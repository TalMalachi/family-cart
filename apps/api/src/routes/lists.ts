import type { FastifyInstance } from 'fastify'
import {
  CreateListSchema,
  CreateItemInputSchema,
  UpdateItemInputSchema,
  AddAlternativeInputSchema,
  ListQuerySchema,
} from '@familycart/shared/schemas'
import { db }                from '../db/postgres'
import { requirePermission } from '../middleware/permissions'
import { buildFullShareUrl, cacheSharePage } from './share'
import { searchProductImage } from '../services/aiImageSearch'
import { searchNearbyStores } from '../services/storeSearch'

export async function listsRoutes(app: FastifyInstance) {

  app.get('/', { preHandler: requirePermission('lists.read') }, async (request, reply) => {
    const { familyId } = request.user as any
    const parsed = ListQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'invalid_query', message: parsed.error.message })
    }
    const { status, page, pageSize } = parsed.data
    let statusFilter = ''
    if (status !== 'all') {
      if (status === 'active') statusFilter = `and sl.status = 'active'`
      else if (status === 'completed') statusFilter = `and sl.status = 'completed'`
      else if (status === 'archived') statusFilter = `and sl.status = 'archived'`
    }
    const offset = (page - 1) * pageSize
    const lists = await db`
      select sl.*,
        count(si.id)::int as item_count,
        count(si.id) filter (where si.is_purchased)::int as purchased_count
      from shopping_lists sl
      left join shopping_items si on si.list_id = sl.id
      where sl.family_id = ${familyId} ${db.unsafe(statusFilter)}
      group by sl.id
      order by sl.created_at desc
      limit ${pageSize} offset ${offset}
    `
    const [{ total }] = await db`
      select count(*)::int as total from shopping_lists sl where sl.family_id = ${familyId} ${db.unsafe(statusFilter)}
    `
    return {
      data: lists,
      total,
      page,
      pageSize,
    }
  })

  app.get('/:id', { preHandler: requirePermission('lists.read') }, async (request, reply) => {
    const { id } = request.params as any
    const { familyId } = request.user as any
    const [list] = await db`select * from shopping_lists where id = ${id}`
    if (!list) return reply.status(404).send({ error: 'not_found' })
    if (list.familyId !== familyId) return reply.status(403).send({ error: 'forbidden' })
    const items = await db`
      select si.*,
        coalesce(json_agg(distinct jsonb_build_object(
          'id', pi.id, 'url', pi.url, 'isPrimary', pi.is_primary,
          'uploadedBy', pi.uploaded_by, 'uploadedAt', pi.uploaded_at
        )) filter (where pi.id is not null), '[]') as images,
        coalesce(json_agg(distinct jsonb_build_object(
          'id', ap.id, 'name', ap.name, 'note', ap.note, 'priority', ap.priority
        )) filter (where ap.id is not null), '[]') as alternatives
      from shopping_items si
      left join product_images pi on pi.item_id = si.id
      left join alternative_products ap on ap.item_id = si.id
      where si.list_id = ${id}
      group by si.id order by si.category nulls last, si.created_at asc
    `
    return { ...list, items }
  })

  // GET /lists/:id/share-link — return a signed public URL for sharing via WhatsApp
  app.get('/:id/share-link', { preHandler: requirePermission('lists.read') }, async (request, reply) => {
    const { id } = request.params as any
    const { familyId } = request.user as any
    const [list] = await db`select * from shopping_lists where id = ${id}`
    if (!list) return reply.status(404).send({ error: 'not_found' })
    if (list.familyId !== familyId) return reply.status(403).send({ error: 'forbidden' })

    // Pre-render the share page while we have an authenticated DB context
    // (RLS is satisfied here). The public share route reads from Redis only.
    await cacheSharePage(id)

    return { shareUrl: buildFullShareUrl(id, request) }
  })

  app.get('/items/:itemId', { preHandler: requirePermission('lists.read') }, async (request, reply) => {
    const { itemId } = request.params as any
    const { familyId } = request.user as any
    // Load item first
    const [itemMeta] = await db`select * from shopping_items where id = ${itemId}`
    if (!itemMeta) return reply.status(404).send({ error: 'not_found' })
    // Load parent list
    const [list] = await db`select * from shopping_lists where id = ${itemMeta.listId}`
    if (!list) return reply.status(404).send({ error: 'not_found' })
    if (list.familyId !== familyId) return reply.status(403).send({ error: 'forbidden' })
    // Now run aggregate detail query
    const [item] = await db`
      select si.*,
        coalesce(json_agg(distinct jsonb_build_object(
          'id', pi.id, 'url', pi.url, 'isPrimary', pi.is_primary,
          'uploadedBy', pi.uploaded_by, 'uploadedAt', pi.uploaded_at
        )) filter (where pi.id is not null), '[]') as images,
        coalesce(json_agg(distinct jsonb_build_object(
          'id', ap.id, 'name', ap.name, 'note', ap.note, 'priority', ap.priority
        )) filter (where ap.id is not null), '[]') as alternatives
      from shopping_items si
      left join product_images pi on pi.item_id = si.id
      left join alternative_products ap on ap.item_id = si.id
      where si.id = ${itemId}
      group by si.id
    `
    return item
  })

  app.post('/', { preHandler: requirePermission('lists.create') }, async (request, reply) => {
    let body
    try {
      body = CreateListSchema.parse(request.body)
    } catch (e: any) {
      return reply.status(400).send({ error: 'invalid_body', message: e.message })
    }
    const { familyId, id: userId } = request.user as any
    const [list] = await db`
      insert into shopping_lists (family_id, name, created_by)
      values (${familyId}, ${body.name}, ${userId}) returning *
    `
    return reply.status(201).send(list)
  })

  app.patch('/:id', { preHandler: requirePermission('lists.write') }, async (request, reply) => {
    const { id } = request.params as any
    const { familyId } = request.user as any
    // Verify list exists
    const [list] = await db`select * from shopping_lists where id = ${id}`
    if (!list) return reply.status(404).send({ error: 'not_found' })
    if (list.familyId !== familyId) return reply.status(403).send({ error: 'forbidden' })
    const body = request.body as any
    const updates: Record<string, any> = {}
    for (const k of ['name', 'status']) if (k in body) updates[k] = body[k]
    if (Object.keys(updates).length === 0) return reply.status(400).send({ error: 'empty_update' })
    // completed_at logic
    if ('status' in updates) {
      if (updates.status === 'completed' && list.status !== 'completed') {
        updates.completed_at = new Date()
      } else if (list.status === 'completed' && updates.status !== 'completed') {
        updates.completed_at = null
      }
    }
    const [updated] = await db`
      update shopping_lists set ${db(updates)} where id = ${id} returning *
    `
    return updated
  })

  app.delete('/:id', { preHandler: requirePermission('lists.delete') }, async (request, reply) => {
    const { id } = request.params as any
    const { familyId } = request.user as any
    // Verify list exists
    const [list] = await db`select * from shopping_lists where id = ${id}`
    if (!list) return reply.status(404).send({ error: 'not_found' })
    if (list.familyId !== familyId) return reply.status(403).send({ error: 'forbidden' })
    await db`delete from shopping_lists where id = ${id}`
    return reply.status(204).send()
  })

  app.post('/:id/items', { preHandler: requirePermission('lists.write') }, async (request, reply) => {
    let body
    try {
      body = CreateItemInputSchema.parse(request.body)
    } catch (e: any) {
      return reply.status(400).send({ error: 'invalid_body', message: e.message })
    }
    const { id: userId, familyId } = request.user as any
    const { id: listId } = request.params as any
    // Verify parent list exists and belongs to family
    const [list] = await db`select * from shopping_lists where id = ${listId}`
    if (!list) return reply.status(404).send({ error: 'not_found' })
    if (list.familyId !== familyId) return reply.status(403).send({ error: 'forbidden' })
    const [item] = await db`
      insert into shopping_items (list_id, name, quantity, unit, estimated_price, category, created_by)
      values (${listId}, ${body.name}, ${body.quantity}, ${body.unit ?? null},
              ${body.estimatedPrice ?? null}, ${body.category ?? null}, ${userId})
      returning *
    `
    return reply.status(201).send(item)
  })

  app.patch('/items/:itemId', { preHandler: requirePermission('lists.write') }, async (request, reply) => {
    const { itemId } = request.params as any
    const { id: userId, familyId } = request.user as any
    let body
    try {
      body = UpdateItemInputSchema.parse(request.body)
    } catch (e: any) {
      return reply.status(400).send({ error: 'invalid_body', message: e.message })
    }
    // Verify item exists
    const [item0] = await db`select * from shopping_items where id = ${itemId}`
    if (!item0) return reply.status(404).send({ error: 'not_found' })
    // Verify parent list
    const [list] = await db`select * from shopping_lists where id = ${item0.listId}`
    if (!list) return reply.status(404).send({ error: 'not_found' })
    if (list.familyId !== familyId) return reply.status(403).send({ error: 'forbidden' })
    const updates: Record<string, any> = { ...body, updated_at: new Date() }
    if (Object.keys(updates).length === 1 && updates.updated_at) return reply.status(400).send({ error: 'empty_update' })
    if (body.isPurchased === true)  { updates.purchased_by = userId;  updates.purchased_at = new Date() }
    if (body.isPurchased === false) { updates.purchased_by = null;    updates.purchased_at = null }
    const [item] = await db`update shopping_items set ${db(updates)} where id = ${itemId} returning *`
    return item
  })

  app.delete('/items/:itemId', { preHandler: requirePermission('lists.write') }, async (request, reply) => {
    const { itemId } = request.params as any
    const { familyId } = request.user as any
    // Verify item exists
    const [item] = await db`select * from shopping_items where id = ${itemId}`
    if (!item) return reply.status(404).send({ error: 'not_found' })
    // Verify parent list
    const [list] = await db`select * from shopping_lists where id = ${item.listId}`
    if (!list) return reply.status(404).send({ error: 'not_found' })
    if (list.familyId !== familyId) return reply.status(403).send({ error: 'forbidden' })
    await db`delete from shopping_items where id = ${itemId}`
    return reply.status(204).send()
  })

  // POST /lists/items/:itemId/images  — attach optional item image by URL/data URL
  app.post('/items/:itemId/images', { preHandler: requirePermission('lists.write') }, async (request, reply) => {
    const { itemId } = request.params as any
    const { id: userId, familyId } = request.user as any
    // Strict body parsing
    const { url, isPrimary } = request.body as { url?: string; isPrimary?: boolean }
    if (!url || typeof url !== 'string' || !url.trim()) {
      return reply.status(400).send({ error: 'invalid_image_url' })
    }
    // Verify item exists
    const [item] = await db`select * from shopping_items where id = ${itemId}`
    if (!item) return reply.status(404).send({ error: 'not_found' })
    // Verify parent list
    const [list] = await db`select * from shopping_lists where id = ${item.listId}`
    if (!list) return reply.status(404).send({ error: 'not_found' })
    if (list.familyId !== familyId) return reply.status(403).send({ error: 'forbidden' })
    const imageUrl = url.trim()
    if (isPrimary) {
      await db`update product_images set is_primary = false where item_id = ${itemId}`
    }
    const [image] = await db`
      insert into product_images (item_id, url, is_primary, uploaded_by)
      values (${itemId}, ${imageUrl}, ${isPrimary}, ${userId})
      returning *
    `

    return reply.status(201).send(image)
  })

  app.post('/items/:itemId/alternatives', { preHandler: requirePermission('lists.write') }, async (request, reply) => {
    let body
    try {
      body = AddAlternativeInputSchema.parse(request.body)
    } catch (e: any) {
      return reply.status(400).send({ error: 'invalid_body', message: e.message })
    }
    const { itemId } = request.params as any
    const { familyId } = request.user as any
    // Verify parent item exists and belongs to a list in the user's family
    const [item] = await db`select * from shopping_items where id = ${itemId}`
    if (!item) return reply.status(404).send({ error: 'not_found' })
    const [list] = await db`select * from shopping_lists where id = ${item.listId}`
    if (!list) return reply.status(404).send({ error: 'not_found' })
    if (list.familyId !== familyId) return reply.status(403).send({ error: 'forbidden' })
    const [alt] = await db`
      insert into alternative_products (item_id, name, note, priority)
      values (${itemId}, ${body.name}, ${body.note ?? null}, ${body.priority}) returning *
    `
    return reply.status(201).send(alt)
  })

  app.delete('/items/:itemId/alternatives/:altId', { preHandler: requirePermission('lists.write') }, async (request, reply) => {
    const { itemId, altId } = request.params as any
    const { familyId } = request.user as any
    // Verify parent item exists
    const [item] = await db`select * from shopping_items where id = ${itemId}`
    if (!item) return reply.status(404).send({ error: 'not_found' })
    // Verify parent list
    const [list] = await db`select * from shopping_lists where id = ${item.listId}`
    if (!list) return reply.status(404).send({ error: 'not_found' })
    if (list.familyId !== familyId) return reply.status(403).send({ error: 'forbidden' })
    // Verify alternative exists
    const [alt] = await db`select * from alternative_products where id = ${altId}`
    if (!alt) return reply.status(404).send({ error: 'not_found' })
    if (alt.itemId !== itemId) return reply.status(403).send({ error: 'wrong_parent' })
    await db`delete from alternative_products where id = ${altId}`
    return reply.status(204).send()
  })

  // POST /lists/items/ai-image-search  — AI-powered product image lookup
  app.post('/items/ai-image-search', { preHandler: requirePermission('lists.write') }, async (request, reply) => {
    const { name, category } = request.body as { name?: string; category?: string }
    if (!name || !name.trim()) {
      return reply.status(400).send({ error: 'name_required' })
    }
    try {
      const result = await searchProductImage(name.trim(), category?.trim())
      if (!result) {
        return reply.status(404).send({ error: 'no_image_found', message: 'Could not find a product image. Try a more specific name.' })
      }
      return { imageUrl: result.imageUrl, title: result.title, source: result.source }
    } catch (err: any) {
      return reply.status(502).send({ error: 'ai_service_error', message: err.message })
    }
  })

  // ── Nearby stores search ─────────────────────────────────────────
  app.post('/:id/nearby-stores', { preHandler: requirePermission('lists.read') }, async (request, reply) => {
    const { id } = request.params as any
    const { lat, lng, radiusKm } = request.body as { lat?: number; lng?: number; radiusKm?: number }
    const { familyId } = request.user as any

    if (!lat || !lng) return reply.status(400).send({ error: 'lat_lng_required' })

    // Get list items
    const [list] = await db`select * from shopping_lists where id = ${id}`
    if (!list) return reply.status(404).send({ error: 'list_not_found' })
    if (list.familyId !== familyId) return reply.status(403).send({ error: 'forbidden' })

    const items = await db`
      select name, quantity, unit from shopping_items
      where list_id = ${id}
      order by created_at
    `

    try {
      const result = await searchNearbyStores(
        lat, lng,
        items.map((i: any) => ({ name: i.name, quantity: i.quantity, unit: i.unit })),
        radiusKm || 10,
        3,
      )
      return result
    } catch (err: any) {
      console.error('[nearby-stores] Error:', err)
      return reply.status(502).send({ error: 'store_search_error', message: err.message })
    }
  })
}
