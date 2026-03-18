import type { FastifyInstance } from 'fastify'
import * as crypto from 'crypto'
import { db }    from '../db/postgres'
import { redis } from '../db/redis'
import { env }   from '../../config/env'

// ─── HMAC helpers ─────────────────────────────────────────────────────────────

function sign(listId: string): string {
  return crypto.createHmac('sha256', env.JWT_SECRET).update(listId).digest('hex').slice(0, 16)
}

export function verifyShareSig(listId: string, sig: string): boolean {
  return sign(listId) === sig
}

export function buildShareUrl(listId: string): string {
  return `/share/list/${listId}?s=${sign(listId)}`
}

/**
 * Return a full absolute share URL.
 * Uses APP_URL env if set, otherwise derives from the request Host header.
 */
export function buildFullShareUrl(listId: string, request?: { headers: Record<string, string | string[] | undefined> }): string {
  const path = buildShareUrl(listId)
  const configured = (env.APP_URL ?? '').replace(/\/+$/, '')
  if (configured) return configured + path

  // Derive from request headers
  if (request) {
    const proto = (request.headers['x-forwarded-proto'] as string) || 'http'
    const host  = (request.headers['x-forwarded-host'] as string) || (request.headers['host'] as string) || ''
    if (host && !host.startsWith('localhost')) return `${proto}://${host}${path}`
  }

  return path // relative fallback — client will prepend origin
}

function esc(s: string): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const SHARE_TTL = 60 * 60 * 24 // 24 hours
const SHARE_KEY = (listId: string) => `share:${listId}`

// ─── Pre-render & cache (called from the authenticated share-link endpoint) ──

/**
 * Build the share-page HTML while we have an authenticated DB context
 * (RLS is satisfied), then store it in Redis so the public endpoint
 * can serve it without touching the DB at all.
 */
export async function cacheSharePage(listId: string): Promise<void> {
  const [list] = await db`select * from shopping_lists where id = ${listId}`
  if (!list) return

  const items = await db`
    select si.*,
      coalesce(json_agg(distinct jsonb_build_object(
        'id', pi.id, 'url', pi.url, 'is_primary', pi.is_primary
      )) filter (where pi.id is not null), '[]') as images
    from shopping_items si
    left join product_images pi on pi.item_id = si.id
    where si.list_id = ${listId}
    group by si.id
    order by si.category nulls last, si.created_at asc
  `

  const html = renderSharePage(list, items)
  await redis.set(SHARE_KEY(listId), html, 'EX', SHARE_TTL)
}

// ─── HTML renderer ────────────────────────────────────────────────────────────

function renderSharePage(list: any, items: any[]): string {
  // Find first product image for Open Graph preview
  let ogImage = ''
  for (const item of items) {
    const imgs = typeof item.images === 'string' ? JSON.parse(item.images) : item.images
    const primary = imgs.find((i: any) => i.is_primary || i.isPrimary) ?? imgs[0]
    if (primary?.url && !primary.url.startsWith('data:')) { ogImage = primary.url; break }
  }

  // Group by category
  const grouped: Record<string, any[]> = {}
  for (const item of items) {
    const cat = item.category ?? 'Other'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(item)
  }

  const total = items.length
  const purchased = items.filter((i: any) => i.isPurchased).length
  const pct = total > 0 ? Math.round((purchased / total) * 100) : 0

  // Build item rows
  let itemsHtml = ''
  for (const cat of Object.keys(grouped)) {
    itemsHtml += '<h3 style="margin:20px 0 8px;font-size:14px;color:#64748b;text-transform:uppercase;letter-spacing:.5px">' + esc(cat) + '</h3>'
    for (const item of grouped[cat]) {
      const imgs = typeof item.images === 'string' ? JSON.parse(item.images) : item.images
      const primary = imgs.find((i: any) => i.is_primary || i.isPrimary) ?? imgs[0]
      const done = item.isPurchased
      const qty = '' + item.quantity + (item.unit ? ' ' + item.unit : '')
      const price = item.estimatedPrice ? ' \u00B7 \u20AA' + parseFloat(item.estimatedPrice).toFixed(2) : ''

      // Image URLs must NOT go through esc() — they need raw & for query params.
      // We only quote-escape them for the src="..." attribute.
      const rawUrl = primary?.url ?? ''
      const safeSrc = rawUrl.replace(/"/g, '&quot;')
      const imgTag = rawUrl && !rawUrl.startsWith('data:')
        ? '<img src="' + safeSrc + '" style="width:48px;height:48px;border-radius:8px;object-fit:cover;flex-shrink:0" alt="' + esc(item.name) + '" />'
        : '<div style="width:48px;height:48px;border-radius:8px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:20px">\uD83D\uDCF7</div>'

      itemsHtml += '<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #f1f5f9">'
        + '<span style="font-size:18px">' + (done ? '\u2705' : '\u2610') + '</span>'
        + imgTag
        + '<div style="flex:1;min-width:0">'
        + '<div style="font-size:15px;font-weight:500;' + (done ? 'text-decoration:line-through;color:#94a3b8' : 'color:#0f172a') + '">' + esc(item.name) + '</div>'
        + '<div style="font-size:12px;color:#64748b">' + esc(qty) + price + '</div>'
        + '</div></div>'
    }
  }

  const ogImageTag = ogImage ? '<meta property="og:image" content="' + ogImage.replace(/"/g, '&quot;') + '" />' : ''
  const listContent = itemsHtml || '<p style="text-align:center;color:#94a3b8;padding:40px 0">No items in this list</p>'

  return '<!doctype html><html lang="en"><head>'
    + '<meta charset="UTF-8" />'
    + '<meta name="viewport" content="width=device-width,initial-scale=1" />'
    + '<title>' + esc(list.name) + ' \u2014 FamilyCart</title>'
    + '<meta property="og:title" content="' + esc(list.name) + ' \u2014 Shopping List" />'
    + '<meta property="og:description" content="' + total + ' items \u00B7 ' + purchased + ' purchased" />'
    + ogImageTag
    + '<meta property="og:type" content="website" />'
    + '<style>'
    + '*{box-sizing:border-box;margin:0;padding:0}'
    + 'body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#f5f7fb;color:#0f172a;padding:0 0 40px}'
    + '.header{background:#0f766e;color:#fff;padding:24px 20px;text-align:center}'
    + '.header h1{font-size:20px;font-weight:700;margin-bottom:4px}'
    + '.header p{font-size:13px;opacity:.85}'
    + '.progress{height:4px;background:rgba(255,255,255,.2);margin-top:12px;border-radius:2px}'
    + '.progress-fill{height:100%;background:#fff;border-radius:2px}'
    + '.content{max-width:600px;margin:0 auto;padding:16px 20px}'
    + '.footer{text-align:center;margin-top:24px;font-size:12px;color:#94a3b8}'
    + '</style></head><body>'
    + '<div class="header">'
    + '<h1>\uD83D\uDED2 ' + esc(list.name) + '</h1>'
    + '<p>' + total + ' items \u00B7 ' + purchased + ' purchased</p>'
    + '<div class="progress"><div class="progress-fill" style="width:' + pct + '%"></div></div>'
    + '</div>'
    + '<div class="content">' + listContent + '</div>'
    + '<p class="footer">Shared via FamilyCart</p>'
    + '</body></html>'
}

// ─── Routes ───────────────────────────────────────────────────────────────────

export async function shareRoutes(app: FastifyInstance) {

  /**
   * GET /share/list/:listId?s=<signature>
   *
   * Public — no authentication needed.
   * Reads pre-rendered HTML from Redis (cached at share-link generation time).
   * Falls back to a "link expired" message if the cache entry is gone.
   */
  app.get('/list/:listId', async (request, reply) => {
    const { listId } = request.params as { listId: string }
    const { s: sig }  = request.query as { s?: string }

    if (!sig || !verifyShareSig(listId, sig)) {
      return reply.status(403).type('text/html').send(
        '<!doctype html><html><body style="font-family:sans-serif;text-align:center;padding:60px">'
        + '<h2>\u26D4 Invalid share link</h2>'
        + '<p style="color:#64748b">This link is invalid or has been tampered with.</p>'
        + '</body></html>'
      )
    }

    // Read pre-rendered page from Redis
    const cached = await redis.get(SHARE_KEY(listId))
    if (cached) {
      return reply.type('text/html').send(cached)
    }

    // Cache miss — the link expired (TTL 24 h) or was never generated
    return reply.status(410).type('text/html').send(
      '<!doctype html><html><body style="font-family:sans-serif;text-align:center;padding:60px">'
      + '<h2>\u23F3 Share link expired</h2>'
      + '<p style="color:#64748b">This shopping list link has expired. Ask the sender to share it again.</p>'
      + '</body></html>'
    )
  })
}
