import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const client = new Anthropic()

const SYSTEM = `Eres un asistente que extrae ítems de catálogo de precios para contratistas.
El usuario puede enviarte:
- Texto CSV/Excel pegado
- Texto de una lista de precios
- Una imagen de un catálogo, lista de precios, o documento

Extrae TODOS los servicios/materiales que encuentres. Para cada ítem devuelve:
{
  "name": "nombre del servicio o material (max 80 chars)",
  "price_cents": número entero en centavos (si ves $45.00 devuelve 4500, si no hay precio usa 0),
  "unit": "hr|sqft|lf|unit|day|lb|gal|bag|sheet|etc o null",
  "trade": "categoría del oficio (Plomería, Electricidad, Pintura, Drywall, Pisos, Techos, HVAC, Carpintería, Jardinería, Limpieza, General, etc)",
  "description": "descripción breve o null"
}

Responde SOLO con JSON válido: { "items": [...] }
NO inventes precios. Si el precio no está claro usa 0.
NO incluyas más de 200 ítems.`

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { text, imageBase64, mimeType } = await req.json()
  if (!text && !imageBase64) return NextResponse.json({ error: 'No data' }, { status: 400 })

  try {
    const content: Anthropic.MessageParam['content'] = []

    if (imageBase64) {
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: mimeType ?? 'image/jpeg', data: imageBase64 },
      })
    }

    content.push({
      type: 'text',
      text: text
        ? `Extrae los ítems de esta lista de precios:\n\n${text}`
        : 'Extrae todos los ítems de precios de esta imagen.',
    })

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: SYSTEM,
      messages: [{ role: 'user', content }],
    })

    // Log AI usage (fire-and-forget)
    const { data: ids } = await supabase.rpc('get_my_business_ids')
    const businessId = ids?.[0] as string | null
    if (businessId) {
      const inputT = response.usage.input_tokens
      const outputT = response.usage.output_tokens
      const costUsd = (inputT * 0.00000025) + (outputT * 0.00000125)
      const { createClient: createAdmin } = await import('@supabase/supabase-js')
      const db = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      await (db as any).from('ai_usage_log').insert({
        business_id: businessId, feature: 'price_book_import',
        input_tokens: inputT, output_tokens: outputT, cost_usd: costUsd,
      })
    }

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) return NextResponse.json({ items: [] })

    const parsed = JSON.parse(match[0])
    const items = (parsed.items ?? []).slice(0, 200)
    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ error: 'Error al procesar' }, { status: 500 })
  }
}
