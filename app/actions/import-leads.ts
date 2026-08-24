'use server'

import { requireAdmin } from '@/lib/admin/require-admin'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// Google Places category per trade
const TRADE_QUERY: Record<string, string> = {
  painting:         'painting contractor',
  plumbing:         'plumber',
  electrical:       'electrician',
  hvac:             'hvac contractor',
  pressure_washing: 'pressure washing service',
  other:            'home services contractor',
}

// US state → approximate lat/lng center for Places API bias
const STATE_COORDS: Record<string, { lat: number; lng: number }> = {
  TX: { lat: 31.0, lng: -100.0 },
  FL: { lat: 27.7, lng: -81.5 },
  CA: { lat: 36.7, lng: -119.4 },
  NY: { lat: 42.9, lng: -75.5 },
  GA: { lat: 32.7, lng: -83.5 },
  NC: { lat: 35.6, lng: -79.8 },
  AZ: { lat: 34.0, lng: -111.1 },
  CO: { lat: 39.1, lng: -105.4 },
  IL: { lat: 40.0, lng: -89.2 },
  OH: { lat: 40.4, lng: -82.8 },
  PA: { lat: 40.6, lng: -77.2 },
  WA: { lat: 47.4, lng: -121.5 },
  NV: { lat: 38.3, lng: -117.1 },
  TN: { lat: 35.9, lng: -86.4 },
  MN: { lat: 46.4, lng: -93.1 },
  MI: { lat: 44.3, lng: -85.4 },
  VA: { lat: 37.8, lng: -79.5 },
  NJ: { lat: 40.1, lng: -74.5 },
  SC: { lat: 33.8, lng: -81.2 },
  OR: { lat: 44.0, lng: -120.5 },
}

type PlaceResult = {
  id: string
  displayName?: { text: string }
  formattedAddress?: string
  nationalPhoneNumber?: string
  websiteUri?: string
  rating?: number
  userRatingCount?: number
  businessStatus?: string
}

export type ImportResult = {
  total: number
  new: number
  duplicates: number
  suppressed: number
  errors: number
  leads: { name: string; status: 'new' | 'duplicate' | 'suppressed' | 'error' }[]
}

export async function importLeadsFromPlaces(params: {
  trade: string
  state: string
  city?: string
  count: number
}): Promise<{ result?: ImportResult; error?: string }> {
  await requireAdmin()

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) return { error: 'GOOGLE_PLACES_API_KEY no configurada' }

  const coords = STATE_COORDS[params.state.toUpperCase()]
  if (!coords) return { error: `Estado no soportado: ${params.state}` }

  const query = params.city
    ? `${TRADE_QUERY[params.trade] ?? 'contractor'} in ${params.city} ${params.state}`
    : `${TRADE_QUERY[params.trade] ?? 'contractor'} in ${params.state}`

  // Google Places API (New) — Text Search
  let places: PlaceResult[] = []
  let pageToken: string | undefined

  while (places.length < params.count) {
    const body: Record<string, unknown> = {
      textQuery: query,
      maxResultCount: Math.min(20, params.count - places.length),
      locationBias: {
        circle: {
          center: { latitude: coords.lat, longitude: coords.lng },
          radius: 50000,
        },
      },
    }
    if (pageToken) body.pageToken = pageToken

    const resp = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.businessStatus,nextPageToken',
      },
      body: JSON.stringify(body),
    })

    if (!resp.ok) {
      const err = await resp.text()
      return { error: `Google Places error ${resp.status}: ${err}` }
    }

    const data = await resp.json()
    const batch: PlaceResult[] = data.places ?? []
    places.push(...batch)
    pageToken = data.nextPageToken

    if (!pageToken || batch.length === 0) break
  }

  places = places.slice(0, params.count)

  if (places.length === 0) {
    return { error: 'Google Places no devolvió resultados para esa búsqueda.' }
  }

  // Ingest each place
  const db = svc()
  const result: ImportResult = { total: places.length, new: 0, duplicates: 0, suppressed: 0, errors: 0, leads: [] }

  for (const place of places) {
    const name = place.displayName?.text
    if (!name) { result.errors++; continue }

    // Parse city/state from formattedAddress
    const { city, state } = parseAddress(place.formattedAddress ?? '', params.state)

    // Derive website quality
    const websiteQuality = place.websiteUri ? 'outdated' : 'none'

    try {
      const { data: ingest, error: ingestErr } = await db.rpc('prospect_ingest_lead', {
        p_business_name:    name,
        p_trade:            params.trade,
        p_city:             city,
        p_state:            state,
        p_website:          place.websiteUri ?? null,
        p_phone_public:     place.nationalPhoneNumber ?? null,
        p_phone_source:     'google_places',
        p_website_quality:  websiteQuality,
        p_source_type:      'google_places',
        p_raw_business_name: name,
        p_raw_address:      place.formattedAddress ?? null,
        p_raw_phone:        place.nationalPhoneNumber ?? null,
        p_raw_website:      place.websiteUri ?? null,
      })

      if (ingestErr) {
        console.error('[import] RPC error for', name, ':', ingestErr.message)
        result.errors++
        result.leads.push({ name, status: 'error' })
        continue
      }
      console.log('[import] RPC result for', name, ':', JSON.stringify(ingest))

      const row = Array.isArray(ingest) ? ingest[0] : ingest
      const isDuplicate = row?.is_duplicate as boolean

      if (isDuplicate) {
        result.duplicates++
        result.leads.push({ name, status: 'duplicate' })
      } else {
        // Check if suppressed after ingest
        const { data: lead } = await db
          .from('prospect_leads')
          .select('is_suppressed')
          .eq('id', row?.lead_id)
          .single()

        if (lead?.is_suppressed) {
          result.suppressed++
          result.leads.push({ name, status: 'suppressed' })
        } else {
          result.new++
          result.leads.push({ name, status: 'new' })
        }
      }
    } catch {
      result.errors++
      result.leads.push({ name, status: 'error' })
    }
  }

  // Auto-scrape emails for new leads that have a website
  const newLeadIds = result.leads
    .filter((l, i) => l.status === 'new' && places[i]?.websiteUri)
    .map((_, i) => {
      const place = places.find(p => p.displayName?.text === result.leads[i]?.name)
      return place?.id
    })
    .filter(Boolean) as string[]

  if (newLeadIds.length > 0) {
    // Get actual lead IDs from DB for the new leads
    const { data: newLeads } = await db
      .from('prospect_leads')
      .select('id, website')
      .is('email', null)
      .not('website', 'is', null)
      .order('created_at', { ascending: false })
      .limit(newLeadIds.length + 5)

    if (newLeads && newLeads.length > 0) {
      for (const lead of newLeads) {
        try {
          const url = lead.website.startsWith('http') ? lead.website : 'https://' + lead.website
          const resp = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; research-bot/1.0)' },
            signal: AbortSignal.timeout(6000),
          })
          if (resp.ok) {
            const html = await resp.text()
            const emails = extractEmailsFromHtml(html)
            if (emails.length > 0) {
              await db.from('prospect_leads').update({
                email: emails[0],
                email_origin: 'public_direct',
                email_collected_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }).eq('id', lead.id)
            }
          }
        } catch { /* skip */ }
        await new Promise(r => setTimeout(r, 200))
      }
    }
  }

  revalidatePath('/admin/prospecting/leads')
  return { result }
}

const SKIP = ['noreply','no-reply','example.com','sentry','wix','wordpress','squarespace','privacy','abuse','postmaster','webmaster']

function extractEmailsFromHtml(html: string): string[] {
  const found = new Set<string>()
  const re = /\b([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})\b/g
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const e = m[1].toLowerCase()
    if (e.includes('@') && e.includes('.') && !SKIP.some(p => e.includes(p))) {
      found.add(e)
    }
  }
  return [...found]
}

function parseAddress(address: string, fallbackState: string): { city: string | null; state: string } {
  // "123 Main St, Houston, TX 77001, USA"
  const parts = address.split(',').map(s => s.trim())
  // Find part that contains 2-letter state code
  for (const part of parts) {
    const m = part.match(/\b([A-Z]{2})\b/)
    if (m) {
      const idx = parts.indexOf(part)
      const city = idx > 0 ? parts[idx - 1] : null
      return { city, state: m[1] }
    }
  }
  return { city: null, state: fallbackState }
}
