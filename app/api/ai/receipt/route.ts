import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { imageUrl, imageBase64, mimeType } = await req.json()
  if (!imageUrl && !imageBase64) return NextResponse.json({ error: 'No image' }, { status: 400 })

  try {
    const imageSource = imageBase64
      ? { type: 'base64' as const, media_type: (mimeType ?? 'image/jpeg') as 'image/jpeg', data: imageBase64 }
      : { type: 'url' as const, url: imageUrl }

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: imageSource },
          {
            type: 'text',
            text: `Analiza este recibo/factura y extrae los datos. Responde SOLO con JSON válido, sin texto adicional:
{
  "vendor": "nombre del negocio/tienda",
  "amount_cents": número entero en centavos (ej: 1234 para $12.34),
  "date": "YYYY-MM-DD",
  "description": "descripción corta de qué se compró",
  "category": "materials|tools|fuel|food|other"
}
Si no puedes leer algún campo con certeza, usa null. NO inventes valores.`,
          },
        ],
      }],
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
        business_id: businessId, feature: 'receipt_extraction',
        input_tokens: inputT, output_tokens: outputT, cost_usd: costUsd,
      })
    }

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'No se pudo analizar el recibo' })

    const parsed = JSON.parse(jsonMatch[0])
    return NextResponse.json(parsed)
  } catch (e) {
    return NextResponse.json({ error: 'Error al analizar con AI' }, { status: 500 })
  }
}
