import OpenAI from 'openai'
import { env } from '../../config/env'

let openai: OpenAI | null = null

function getClient(): OpenAI | null {
  if (!env.OPENAI_API_KEY) return null
  if (!openai) openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })
  return openai
}

export interface AiImageResult {
  imageUrl: string
  title: string
  source: string
}

const UA = 'FamilyCart/1.0 (shopping list app)'

/** Returns true when the string contains non-Latin characters (Hebrew, Arabic, etc.) */
function isNonLatin(s: string): boolean {
  return /[^\u0000-\u007F\u00C0-\u024F]/.test(s)
}

// ─────────────────────────────────────────────────────────────────────
//  Translate non-English names via OpenAI (cheap, reliable)
// ─────────────────────────────────────────────────────────────────────

async function translateToEnglish(
  itemName: string,
  category?: string,
): Promise<string[]> {
  const client = getClient()
  if (!client) return []
  try {
    const msg = [
      `You are a grocery product expert specializing in Israeli supermarket products.`,
      `Translate the following grocery / supermarket product name to English.`,
      `Preserve ALL details exactly: brand name, fat percentage, flavor, weight/size, variant.`,
      `Fat percentages are critical — "שמנת 38%" means specifically 38% fat cream, NOT 30% or any other.`,
      `Common Israeli dairy translations:`,
      `  שמנת מתוקה = sweet cream / heavy whipping cream`,
      `  שמנת חמוצה = sour cream`,
      `  חלב = milk`,
      `  קוטג׳ = cottage cheese`,
      `  גבינה לבנה = white cheese / quark`,
      `Return 3 search-friendly English variants, one per line.`,
      `Line 1: full translation with brand + all specifics (e.g. "Tnuva sweet cream 38% fat")`,
      `Line 2: generic product with specifics but no brand (e.g. "heavy whipping cream 38%")`,
      `Line 3: alternative phrasing for search (e.g. "sweet cream 38 percent fat")`,
      `Return ONLY the lines, no numbering, no explanations.`,
      category ? `Category hint: ${category}` : '',
      `Product: "${itemName}"`,
    ].filter(Boolean).join('\n')

    const res = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: msg }],
      temperature: 0,
      max_tokens: 150,
    })
    const text = res.choices[0]?.message?.content?.trim() || ''
    const variants = text
      .split('\n')
      .map(line => line.replace(/^\d+[.)]\s*/, '').replace(/^[-•]\s*/, '').replace(/^["']|["']$/g, '').trim())
      .filter(Boolean)
    return variants
  } catch (e) {
    console.error('[aiImageSearch] translation error:', e)
    return []
  }
}

// ─────────────────────────────────────────────────────────────────────
//  Open Food Facts — real grocery product images (free, no API key)
// ─────────────────────────────────────────────────────────────────────

/** Extract "specific" tokens — percentages, weights — that must match exactly. */
function extractSpecifics(text: string): string[] {
  // Match: percentages (1%, 3%), weights (500g, 1L) — but NOT bare numbers
  const matches = text.match(/\d+(?:[.,]\d+)?%|\d+(?:[.,]\d+)?\s*(?:g|kg|ml|l|oz|lb)\b/gi)
  return (matches || []).map(m => m.toLowerCase().replace(/\s+/g, ''))
}

/** Check if a specific token (e.g. "1%") appears as a whole token in text. */
function hasSpecificToken(text: string, token: string): boolean {
  // Escape special regex chars in token, then match with word boundaries
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // For percentages: match "1%" but not "12%" or "21%"
  // Use \b before digits and match the full token
  const re = new RegExp(`(?<![\\d])${escaped}(?![\\d])`, 'i')
  return re.test(text)
}

/** Run a single Open Food Facts query and return raw products. */
async function offQuery(searchTerm: string, countryTag?: string): Promise<any[]> {
  try {
    let url = `https://world.openfoodfacts.net/cgi/search.pl?search_terms=${encodeURIComponent(searchTerm)}&search_simple=1&json=1&page_size=20&fields=product_name,product_name_he,product_name_en,image_front_url,image_url,brands,countries_tags`
    if (countryTag) {
      url += `&tagtype_0=countries&tag_contains_0=contains&tag_0=${encodeURIComponent(countryTag)}`
    }
    const res = await fetch(url, {
      headers: { 'User-Agent': `${UA} - https://github.com/familycart` },
      signal: AbortSignal.timeout(12000),
    })
    if (!res.ok) return []
    const data = (await res.json()) as any
    return (data.products as any[]) || []
  } catch (e) {
    console.error('[aiImageSearch] Open Food Facts query error:', e)
    return []
  }
}

/**
 * Score a product against the search query.
 * Heavy emphasis on matching ALL specific tokens (percentages, sizes, brand).
 */
function scoreProduct(
  product: any,
  termWords: string[],
  specifics: string[],
  termLower: string,
  isHebrew?: boolean,
): number {
  const name = (product.product_name || '').toLowerCase()
  const nameHe = (product.product_name_he || '').toLowerCase()
  const nameEn = (product.product_name_en || '').toLowerCase()
  const brand = (product.brands || '').toLowerCase()
  const full = `${name} ${nameHe} ${nameEn} ${brand}`
  const countries = (product.countries_tags || []) as string[]

  // Pick the best name to match against — use Hebrew name for Hebrew queries
  const matchName = (isHebrew && nameHe) ? nameHe : name

  let score = 0

  // Separate "specific" tokens (38%, 500g) from regular words for base matching.
  // Specifics are scored separately below — don't let them tank the base relevance.
  const specificSet = new Set(specifics)
  const baseWords = termWords.filter(w => !specificSet.has(w))

  // ── Base relevance (match against product NAME primarily) ────────
  if (matchName === termLower) score += 100
  else if (matchName.startsWith(termLower)) score += 80
  else if (baseWords.length > 0 && baseWords.every(w => matchName.includes(w))) score += 70
  else if (matchName.includes(termLower)) score += 50
  else if (baseWords.some(w => matchName.includes(w))) score += 20
  // Also check the other language name as a fallback
  else if (baseWords.length > 0 && baseWords.every(w => full.includes(w))) score += 40
  else if (baseWords.some(w => full.includes(w))) score += 15
  else if (baseWords.some(w => brand.includes(w))) score += 8

  // ── Brand matching ─────────────────────────────────────────────
  // If the user typed a brand name, products from that brand get a big boost
  const nonSpecificWords = termWords.filter(w => !/^\d/.test(w) && w.length > 1)
  for (const w of nonSpecificWords) {
    if (brand.includes(w)) {
      score += 25
      break // one brand match is enough
    }
  }

  // ── Specific-token matching (percentages, sizes) ───────────────
  if (specifics.length > 0) {
    const productSpecifics = extractSpecifics(full)
    let matched = 0
    let mismatched = 0
    let missing = 0

    for (const spec of specifics) {
      if (hasSpecificToken(full, spec)) {
        matched++
      } else if (spec.endsWith('%')) {
        const hasOtherPercent = productSpecifics.some(ps => ps.endsWith('%') && ps !== spec)
        if (hasOtherPercent) mismatched++
        else missing++
      } else {
        missing++
      }
    }

    score += matched * 30           // strong bonus for each matching specific
    if (matched === specifics.length) score += 20  // bonus: ALL specifics match
    score -= mismatched * 50        // heavy penalty for wrong specifics
    score -= missing * 10           // mild penalty for missing specifics
  }

  // ── Word-level matching bonus ──────────────────────────────────
  const matchedWords = termWords.filter(w => full.includes(w))
  score += matchedWords.length * 5

  // ── Image quality bonus ────────────────────────────────────────
  if (product.image_front_url) score += 10
  if (brand) score += 3

  // ── Israeli product boost for Hebrew queries ───────────────────
  if (isHebrew && countries.some((c: string) => c === 'en:israel')) {
    score += 20
  }

  return score
}

async function searchOpenFoodFacts(
  searchTerms: string[],
  isHebrew: boolean = false,
): Promise<AiImageResult | null> {
  try {
    // Deduplicate & filter empty terms
    const terms = Array.from(new Set(searchTerms.map(t => t.trim()).filter(Boolean)))
    if (!terms.length) return null

    // Run all queries in parallel — global + Israel-filtered for Hebrew queries
    const queries: Promise<any[]>[] = terms.map(t => offQuery(t))
    if (isHebrew) {
      // Also search with Israel country filter for better Hebrew product coverage
      for (const t of terms) {
        queries.push(offQuery(t, 'Israel'))
      }
    }
    const queryResults = await Promise.all(queries)
    
    // Merge all products, deduplicate by image URL
    const seen = new Set<string>()
    const allProducts: any[] = []
    for (const products of queryResults) {
      for (const p of products) {
        const img = p.image_front_url || p.image_url || ''
        if (!img || seen.has(img)) continue
        seen.add(img)
        allProducts.push(p)
      }
    }

    if (!allProducts.length) return null

    // Build scoring context from ALL search terms combined
    const combinedTerm = terms.join(' ').toLowerCase()
    const specifics = Array.from(new Set(extractSpecifics(combinedTerm)))

    console.info(`[aiImageSearch] OFF: ${allProducts.length} products, specifics=[${specifics}], hebrew=${isHebrew}`)

    // Score all products against each search term and take the max
    const scored = allProducts
      .filter((p: any) => p.image_front_url || p.image_url)
      .map((p: any) => {
        // Score against each individual term and take the best
        const scores = terms.map(t => {
          const tLower = t.toLowerCase()
          const tWords = tLower.split(/\s+/).filter(Boolean)
          const tSpecs = extractSpecifics(tLower)
          return scoreProduct(p, tWords, tSpecs, tLower, isHebrew)
        })
        return { product: p, score: Math.max(...scores) }
      })
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)

    // Require a minimum score to avoid returning irrelevant products
    if (!scored.length || scored[0].score < 30) return null

    const best = scored[0]
    const bestNameHe = best.product.product_name_he || ''
    console.info(`[aiImageSearch] OFF best: "${best.product.product_name}" he="${bestNameHe}" (${best.product.brands}) score=${best.score}`)

    const imageUrl = best.product.image_front_url || best.product.image_url
    // Prefer Hebrew name for Hebrew queries, fall back to default name
    const displayName = (isHebrew && bestNameHe) ? bestNameHe : best.product.product_name
    const title = [displayName, best.product.brands].filter(Boolean).join(' — ')

    return {
      imageUrl,
      title: title || searchTerms[0],
      source: 'openfoodfacts.org',
    }
  } catch (e) {
    console.error('[aiImageSearch] Open Food Facts error:', e)
  }
  return null
}

// ─────────────────────────────────────────────────────────────────────
//  Israeli grocery search — Rami Levy API + OFF barcode lookup
//  Returns real supermarket product images for Hebrew queries.
// ─────────────────────────────────────────────────────────────────────

const RAMI_LEVY_CDN = 'https://img.rami-levy.co.il'
const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

interface RamiLevyProduct {
  name: string
  barcode: number
  images: { small: string; original: string; trim: string; transparent: string }
  gs?: { BrandName?: string }
}

/** Search Rami Levy's product catalog API (Israel's major supermarket chain). */
async function searchRamiLevy(query: string): Promise<RamiLevyProduct[]> {
  try {
    const url = `https://www.rami-levy.co.il/api/search?q=${encodeURIComponent(query)}`
    const res = await fetch(url, {
      headers: { 'User-Agent': BROWSER_UA, 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []
    const data = (await res.json()) as any
    return (data.data as RamiLevyProduct[]) || []
  } catch (e) {
    console.error('[aiImageSearch] Rami Levy search error:', e)
    return []
  }
}

/** Look up a product by barcode on Open Food Facts and return its image. */
async function offBarcodeLookup(barcode: string): Promise<string | null> {
  try {
    const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
    const res = await fetch(url, {
      headers: { 'User-Agent': `${UA} - https://github.com/familycart` },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const data = (await res.json()) as any
    if (data.status === 1 && data.product?.image_front_url) {
      return data.product.image_front_url
    }
  } catch { /* ignore */ }
  return null
}

/** Verify a URL returns a real image (not a 404 placeholder). */
async function isImageAccessible(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': BROWSER_UA },
      signal: AbortSignal.timeout(4000),
      redirect: 'follow',
    })
    const ct = res.headers.get('content-type') || ''
    return res.ok && ct.startsWith('image/') && ct !== 'image/gif' // gif = Rami Levy 404 placeholder
  } catch { return false }
}

/**
 * Search for an Israeli grocery product image.
 * Strategy: Rami Levy API → score by specifics → CDN image → OFF barcode.
 */
async function searchIsraeliGrocery(query: string): Promise<AiImageResult | null> {
  const products = await searchRamiLevy(query)
  if (!products.length) return null

  console.info(`[aiImageSearch] Rami Levy: ${products.length} products for "${query}"`)

  // Score products so that specific tokens (38%, 500g) in the query match correctly.
  const querySpecifics = extractSpecifics(query)
  const scored = products.map(p => {
    const pName = p.name.toLowerCase()
    let score = 0
    // Products whose specifics match the query rank highest
    if (querySpecifics.length > 0) {
      for (const spec of querySpecifics) {
        if (hasSpecificToken(pName, spec)) score += 50
        else {
          // Wrong percentage → heavy penalty
          const pSpecs = extractSpecifics(pName)
          const hasDifferent = pSpecs.some(ps => ps.endsWith('%') && spec.endsWith('%') && ps !== spec)
          if (hasDifferent) score -= 30
        }
      }
    }
    return { product: p, score }
  })
  scored.sort((a, b) => b.score - a.score)

  // Try top-scored products — prefer CDN image, fall back to OFF barcode lookup
  for (const { product } of scored.slice(0, 5)) {
    const brand = product.gs?.BrandName || ''
    const title = brand ? `${product.name} — ${brand}` : product.name

    // 1) Try Rami Levy CDN (original / large image)
    const cdnPath = product.images?.original || product.images?.trim
    if (cdnPath) {
      const cdnUrl = `${RAMI_LEVY_CDN}${cdnPath}`
      if (await isImageAccessible(cdnUrl)) {
        console.info(`[aiImageSearch] Rami Levy CDN hit: "${product.name}"`)
        return { imageUrl: cdnUrl, title, source: 'rami-levy.co.il' }
      }
    }

    // 2) Fall back to OFF barcode lookup
    if (product.barcode) {
      const offImage = await offBarcodeLookup(String(product.barcode))
      if (offImage) {
        console.info(`[aiImageSearch] OFF barcode hit: ${product.barcode} → "${product.name}"`)
        return { imageUrl: offImage, title, source: 'openfoodfacts.org' }
      }
    }
  }

  return null
}

// ─────────────────────────────────────────────────────────────────────
//  DuckDuckGo Instant Answer — free, no API key, finds real product images
// ─────────────────────────────────────────────────────────────────────

async function searchDuckDuckGo(
  query: string,
): Promise<AiImageResult | null> {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const data = (await res.json()) as any

    // Try the main result image first
    if (data.Image && data.Image.startsWith('http')) {
      return {
        imageUrl: data.Image,
        title: data.Heading || query,
        source: 'duckduckgo.com',
      }
    }

    // Try related topics for an image
    const topics = [...(data.RelatedTopics || []), ...(data.Results || [])]
    for (const topic of topics) {
      if (topic.Icon?.URL && topic.Icon.URL.startsWith('http')) {
        return {
          imageUrl: topic.Icon.URL,
          title: topic.Text?.substring(0, 120) || query,
          source: 'duckduckgo.com',
        }
      }
    }
  } catch (e) {
    console.error('[aiImageSearch] DuckDuckGo error:', e)
  }
  return null
}

// ─────────────────────────────────────────────────────────────────────
//  Wikipedia fallback (free, no API key) — good for generic/produce items
// ─────────────────────────────────────────────────────────────────────

async function wikiSearch(
  lang: string,
  query: string,
): Promise<AiImageResult | null> {
  try {
    const url = `https://${lang}.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=8&prop=pageimages&format=json&pithumbsize=500`
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const data = (await res.json()) as any
    const pages = data.query?.pages
    if (!pages) return null

    const queryLower = query.toLowerCase()
    const withThumbs = (Object.values(pages) as any[]).filter((p: any) => p.thumbnail?.source)
    if (!withThumbs.length) return null

    const scored = withThumbs.map((p: any) => {
      const t = (p.title || '').toLowerCase()
      let score = 0
      if (t === queryLower) score = 100
      else if (t.startsWith(queryLower)) score = 80
      else if (t.includes(queryLower)) score = 60
      else if (queryLower.includes(t)) score = 40
      return { page: p, score }
    })
    scored.sort((a, b) => b.score - a.score)

    const best = scored[0].page
    return {
      imageUrl: best.thumbnail.source,
      title: best.title || query,
      source: `${lang}.wikipedia.org`,
    }
  } catch (e) {
    console.error(`[aiImageSearch] wikiSearch(${lang}) error:`, e)
  }
  return null
}

async function searchWikipedia(
  searchTerm: string,
  category?: string,
): Promise<AiImageResult | null> {
  const query = category ? `${searchTerm} ${category}` : searchTerm

  // Direct page summary first (high quality hero image)
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerm)}`
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(5000),
    })
    if (res.ok) {
      const data = (await res.json()) as any
      const thumb = data.thumbnail?.source || data.originalimage?.source
      if (thumb && (thumb.endsWith('.jpg') || thumb.endsWith('.png') || thumb.includes('/thumb/'))) {
        const imageUrl = thumb.replace(/\/\d+px-/, '/500px-')
        return { imageUrl, title: data.title || searchTerm, source: 'wikipedia.org' }
      }
    }
  } catch { /* ignore */ }

  // Wikipedia search
  const result = await wikiSearch('en', query)
  if (result) return result

  // Wikimedia Commons
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query + ' food product')}&gsrlimit=5&prop=imageinfo&iiprop=url&iiurlwidth=500&format=json&origin=*`
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(5000),
    })
    if (res.ok) {
      const data = (await res.json()) as any
      const pages = data.query?.pages
      if (pages) {
        for (const page of Object.values(pages) as any[]) {
          const info = (page as any).imageinfo?.[0]
          const imgUrl = info?.thumburl || info?.url
          if (imgUrl && /\.(jpe?g|png|webp)/i.test(imgUrl)) {
            return {
              imageUrl: imgUrl,
              title: (page as any).title?.replace('File:', '') || searchTerm,
              source: 'commons.wikimedia.org',
            }
          }
        }
      }
    }
  } catch { /* ignore */ }

  return null
}

// ─────────────────────────────────────────────────────────────────────
//  Public API
// ─────────────────────────────────────────────────────────────────────

/**
 * Searches for a **grocery / supermarket-style** product image.
 *
 * Flow:
 * 1. If the name is non-Latin (Hebrew …), search Israeli grocery catalogs first.
 * 2. Translate to English, then search Open Food Facts.
 * 3. Try DuckDuckGo Instant Answer (branded / regional products).
 * 4. Fall back to Wikipedia / Wikimedia Commons.
 */
export async function searchProductImage(
  itemName: string,
  category?: string,
): Promise<AiImageResult | null> {
  let englishName = itemName
  const searchTerms: string[] = [itemName]
  const hebrew = isNonLatin(itemName)

  // ── Strategy 1: Israeli grocery catalog (Rami Levy) ────────────
  // This is the BEST source for Hebrew product queries — returns real
  // supermarket product images directly from an Israeli retailer.
  if (hebrew) {
    const israeliResult = await searchIsraeliGrocery(itemName)
    if (israeliResult) return israeliResult
  }

  // ── Translate non-Latin names to English grocery terms ──────────
  if (hebrew) {
    const variants = await translateToEnglish(itemName, category)
    if (variants.length) {
      console.info(`[aiImageSearch] Translated "${itemName}" → [${variants.join(' | ')}]`)
      englishName = variants[0]
      searchTerms.push(...variants)
    }
  }

  // ── Strategy 2: Open Food Facts (search Hebrew + English in parallel) ─
  const offResult = await searchOpenFoodFacts(searchTerms, hebrew)
  if (offResult) return offResult

  // ── Strategy 3: DuckDuckGo Instant Answer (branded / regional products) ─
  const ddgQuery = hebrew ? englishName : itemName
  const ddgResult = await searchDuckDuckGo(
    category ? `${ddgQuery} ${category} product` : `${ddgQuery} product`,
  )
  if (ddgResult) return ddgResult

  // ── Strategy 4: Wikipedia / Wikimedia (good for produce items) ──
  if (hebrew) {
    const heWikiResult = await wikiSearch('he', itemName)
    if (heWikiResult) return heWikiResult
  }
  const wikiResult = await searchWikipedia(englishName, category)
  if (wikiResult) return wikiResult

  return null
}
