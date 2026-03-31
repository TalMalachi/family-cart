import OpenAI from 'openai'
import { env } from '../../config/env'

const UA = 'FamilyCart/1.0 (shopping list app)'

// ─────────────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────────────

export interface NearbyStore {
  name: string
  brand: string
  distance: number          // km
  lat: number
  lng: number
  address: string
  itemPrices: ItemPrice[]
  totalEstimated: number
  coverageCount: number     // how many items the store carries
  coveragePercent: number
}

export interface ItemPrice {
  name: string
  estimatedPrice: number | null   // null = not available
  currency: string
}

export interface StoreSearchResult {
  stores: NearbyStore[]
  totalItems: number
  searchRadiusKm: number
  userLat: number
  userLng: number
}

// ─────────────────────────────────────────────────────────────────────
//  1. Find nearby supermarkets via OpenStreetMap Overpass API (free)
// ─────────────────────────────────────────────────────────────────────

interface OsmStore {
  name: string
  brand: string
  lat: number
  lng: number
  address: string
  distance: number
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

async function findNearbyStores(
  lat: number,
  lng: number,
  radiusKm: number = 10,
): Promise<OsmStore[]> {
  const radiusMeters = radiusKm * 1000
  // Overpass QL: find supermarkets, grocery stores, and similar shops nearby
  const shopTypes = 'supermarket|convenience|grocery|wholesale|greengrocer|deli|general'
  const query = `
    [out:json][timeout:25];
    (
      node["shop"~"^(${shopTypes})$"](around:${radiusMeters},${lat},${lng});
      way["shop"~"^(${shopTypes})$"](around:${radiusMeters},${lat},${lng});
      relation["shop"~"^(${shopTypes})$"](around:${radiusMeters},${lat},${lng});
    );
    out center body;
  `

  let data: any
  const overpassUrls = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
  ]
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, attempt * 2000))
    const url = overpassUrls[attempt % overpassUrls.length]
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(45000),
      })
      if (res.ok) { data = await res.json(); break }
      console.warn(`[storeSearch] Overpass ${url} returned ${res.status}, retry ${attempt + 1}/4`)
    } catch (e: any) {
      console.warn(`[storeSearch] Overpass ${url} failed: ${e.message}, retry ${attempt + 1}/4`)
    }
  }
  if (!data) throw new Error('Supermarket search service is temporarily unavailable. Please try again in a moment.')

  const raw: OsmStore[] = []
  const seenOsmIds = new Set<string>()

  for (const el of data.elements || []) {
    const tags = el.tags || {}
    const name = tags.name || tags.brand || ''
    if (!name) continue

    const storeLat = el.lat || el.center?.lat
    const storeLng = el.lon || el.center?.lon
    if (!storeLat || !storeLng) continue

    // Skip duplicate OSM elements (same node/way/relation id)
    const osmId = `${el.type}_${el.id}`
    if (seenOsmIds.has(osmId)) continue
    seenOsmIds.add(osmId)

    const distance = haversineKm(lat, lng, storeLat, storeLng)
    if (distance > radiusKm) continue

    const address = [
      tags['addr:street'],
      tags['addr:housenumber'],
      tags['addr:city'],
    ].filter(Boolean).join(' ')

    raw.push({
      name,
      brand: tags.brand || tags.operator || name,
      lat: storeLat,
      lng: storeLng,
      address: address || '',
      distance: Math.round(distance * 10) / 10,
    })
  }

  // Proximity dedup: same name within 200m (node + way of same store)
  raw.sort((a, b) => a.distance - b.distance)
  const stores: OsmStore[] = []
  for (const s of raw) {
    const isDup = stores.some(existing =>
      existing.name.toLowerCase() === s.name.toLowerCase() &&
      haversineKm(existing.lat, existing.lng, s.lat, s.lng) < 0.2
    )
    if (!isDup) stores.push(s)
  }

  // Chain dedup: keep only the closest branch per store name
  const seenNames = new Set<string>()
  const unique: OsmStore[] = []
  for (const s of stores) {
    const nameKey = s.name.toLowerCase()
    if (seenNames.has(nameKey)) continue
    seenNames.add(nameKey)
    unique.push(s)
  }
  return unique
}

// ─────────────────────────────────────────────────────────────────────
//  2. Estimate prices via OpenAI
// ─────────────────────────────────────────────────────────────────────

let openai: OpenAI | null = null

function getClient(): OpenAI | null {
  if (!env.OPENAI_API_KEY) return null
  if (!openai) openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })
  return openai
}

async function estimatePricesAtStores(
  items: { name: string; quantity: number; unit?: string }[],
  stores: OsmStore[],
): Promise<Map<string, ItemPrice[]>> {
  const client = getClient()
  if (!client) return new Map()

  const itemList = items.map(i =>
    `- ${i.name} (qty: ${i.quantity}${i.unit ? ' ' + i.unit : ''})`
  ).join('\n')

  const storeList = stores.map(s => s.brand).join(', ')

  const prompt = `You are a grocery price estimation assistant for Israel.
Given these shopping list items and supermarket chains, estimate the price of EACH item at EACH store in Israeli Shekels (₪).

Shopping list:
${itemList}

Stores: ${storeList}

Rules:
1. Return ONLY valid JSON — no markdown, no explanation.
2. Format: { "storePrices": { "<store brand>": { "<item name>": <price_number_or_null> } } }
3. Use null if the store is unlikely to carry that item.
4. Prices should be realistic Israeli supermarket prices in ₪ (shekels).
5. Consider that discount chains (Rami Levy, Yochananof) are typically cheaper than premium chains (Shufersal, Mega).
6. Use the per-unit price (not total for quantity).

Respond with ONLY the JSON:`

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 4000,
    })

    const raw = completion.choices[0]?.message?.content?.trim() ?? ''
    const json = raw.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim()
    const parsed = JSON.parse(json)
    const storePrices = parsed.storePrices || parsed

    console.info('[storeSearch] OpenAI response parsed, keys:', Object.keys(storePrices))

    const result = new Map<string, ItemPrice[]>()

    for (const store of stores) {
      // Try matching by brand name (case-insensitive)
      const brandKey = Object.keys(storePrices).find(k =>
        k.toLowerCase() === store.brand.toLowerCase() ||
        store.brand.toLowerCase().includes(k.toLowerCase()) ||
        k.toLowerCase().includes(store.brand.toLowerCase())
      )

      const prices: ItemPrice[] = items.map(item => {
        const storeData = brandKey ? storePrices[brandKey] : null
        let price: number | null = null
        if (storeData) {
          // Try exact match, then partial match
          const itemKey = Object.keys(storeData).find(k =>
            k.toLowerCase() === item.name.toLowerCase() ||
            item.name.toLowerCase().includes(k.toLowerCase()) ||
            k.toLowerCase().includes(item.name.toLowerCase())
          )
          if (itemKey && storeData[itemKey] !== null) {
            price = storeData[itemKey]
          }
        }
        return {
          name: item.name,
          estimatedPrice: price,
          currency: '₪',
        }
      })

      result.set(`${store.name}_${store.lat}_${store.lng}`, prices)
    }

    return result
  } catch (e: any) {
    console.error('[storeSearch] Price estimation error:', e?.message || e)
    console.error('[storeSearch] Full error:', JSON.stringify(e, Object.getOwnPropertyNames(e)).substring(0, 500))
    return new Map()
  }
}

// ─────────────────────────────────────────────────────────────────────
//  3. Public API
// ─────────────────────────────────────────────────────────────────────

export async function searchNearbyStores(
  lat: number,
  lng: number,
  items: { name: string; quantity: number; unit?: string }[],
  radiusKm: number = 10,
  topN: number = 10,
): Promise<StoreSearchResult> {
  console.info(`[storeSearch] Searching within ${radiusKm}km of (${lat}, ${lng}) for ${items.length} items`)

  // Step 1: Find nearby supermarkets
  const allStores = await findNearbyStores(lat, lng, radiusKm)
  console.info(`[storeSearch] Found ${allStores.length} stores`)

  if (!allStores.length) {
    return { stores: [], totalItems: items.length, searchRadiusKm: radiusKm, userLat: lat, userLng: lng }
  }

  // Limit to closest 10 unique chains for price estimation (to control token usage)
  const uniqueChains = new Map<string, OsmStore>()
  for (const s of allStores) {
    const chainKey = s.brand.toLowerCase()
    if (!uniqueChains.has(chainKey)) {
      uniqueChains.set(chainKey, s)
    }
  }
  const storesForPricing = Array.from(uniqueChains.values()).slice(0, 10)

  // Step 2: Estimate prices at each chain
  const priceMap = items.length > 0
    ? await estimatePricesAtStores(items, storesForPricing)
    : new Map<string, ItemPrice[]>()

  // Step 3: Build final results — apply prices from chain to all branches
  const results: NearbyStore[] = allStores.map(store => {
    const key = `${store.name}_${store.lat}_${store.lng}`
    // Find prices: direct match or match by chain
    let itemPrices = priceMap.get(key) || null
    if (!itemPrices) {
      // Try finding by chain brand
      const priceEntries = Array.from(priceMap.entries())
      for (const [k, v] of priceEntries) {
        const priceStore = storesForPricing.find(s =>
          `${s.name}_${s.lat}_${s.lng}` === k
        )
        if (priceStore && priceStore.brand.toLowerCase() === store.brand.toLowerCase()) {
          itemPrices = v
          break
        }
      }
    }

    if (!itemPrices) {
      itemPrices = items.map(i => ({ name: i.name, estimatedPrice: null, currency: '₪' }))
    }

    const coverageCount = itemPrices.filter(p => p.estimatedPrice !== null).length
    const totalEstimated = itemPrices.reduce((sum, p) => {
      if (p.estimatedPrice === null) return sum
      const item = items.find(i => i.name === p.name)
      return sum + p.estimatedPrice * (item?.quantity || 1)
    }, 0)

    return {
      name: store.name,
      brand: store.brand,
      distance: store.distance,
      lat: store.lat,
      lng: store.lng,
      address: store.address,
      itemPrices,
      totalEstimated: Math.round(totalEstimated * 100) / 100,
      coverageCount,
      coveragePercent: items.length > 0 ? Math.round((coverageCount / items.length) * 100) : 0,
    }
  })

  // Rank by: coverage first, then by price (lower is better)
  results.sort((a, b) => {
    // Primary: higher coverage is better
    if (b.coveragePercent !== a.coveragePercent) return b.coveragePercent - a.coveragePercent
    // Secondary: lower total price is better
    if (a.totalEstimated !== b.totalEstimated) return a.totalEstimated - b.totalEstimated
    // Tertiary: closer is better
    return a.distance - b.distance
  })

  return {
    stores: results.slice(0, topN),
    totalItems: items.length,
    searchRadiusKm: radiusKm,
    userLat: lat,
    userLng: lng,
  }
}

