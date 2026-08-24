'use server'

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export type SuggestedItem = {
  price_book_item_id: string | null
  name: string
  description: string | null
  qty: number
  unit_price_cents: number
  unit: string | null
  confidence: 'high' | 'medium' | 'low'
  matched: boolean
}

export type AIEstimateResult = {
  understood: string
  items: SuggestedItem[]
  clarifications: string[]
  error?: string
}

export async function generateEstimate(
  description: string,
  businessId: string,
): Promise<AIEstimateResult> {
  if (!description.trim()) return { understood: '', items: [], clarifications: [] }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch active price book items
  const { data: priceBook } = await supabase
    .from('price_book_items')
    .select('id, name, price_cents, unit, trade, description')
    .eq('business_id', businessId)
    .eq('active', true)
    .is('archived_at', null)
    .order('favorite', { ascending: false })
    .order('name')
    .limit(200)

  const pb = priceBook ?? []

  const pbList = pb.map(i =>
    `- ID: ${i.id} | "${i.name}" | $${(i.price_cents / 100).toFixed(2)}${i.unit ? ` / ${i.unit}` : ''}${i.trade ? ` [${i.trade}]` : ''}${i.description ? ` — ${i.description}` : ''}`
  ).join('\n')

  const systemPrompt = `Eres el asistente de estimados de un contractor de construcción/remodelación.
Tu trabajo es interpretar la descripción de un trabajo y crear una lista de items de cotización.

REGLAS CRÍTICAS:
1. SOLO usa precios del Price Book del contractor — NUNCA inventes precios
2. Si un servicio no está en el Price Book, créalo como item manual SIN precio (price_book_item_id: null, unit_price_cents: 0)
3. Sé conservador con las cantidades — si no sabes, pon 1
4. Si falta información importante, agrégala a clarifications
5. Responde SIEMPRE en español
6. El campo "understood" es un resumen de 1-2 oraciones de lo que entendiste

PRICE BOOK DISPONIBLE:
${pb.length === 0 ? '(Sin items en el Price Book — todos los items serán manuales sin precio)' : pbList}

Responde SOLO con JSON válido, sin texto adicional:
{
  "understood": "string corto de lo que entendiste del trabajo",
  "items": [
    {
      "price_book_item_id": "uuid o null si no hay match",
      "name": "nombre del servicio",
      "description": "descripción adicional si aplica o null",
      "qty": número,
      "unit_price_cents": número (0 si no hay precio),
      "unit": "unidad o null",
      "confidence": "high|medium|low",
      "matched": true si viene del price book, false si es manual
    }
  ],
  "clarifications": ["pregunta 1 si falta info", "pregunta 2", ...]
}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        { role: 'user', content: `Descripción del trabajo:\n${description.trim()}` }
      ],
      system: systemPrompt,
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')

    const parsed = JSON.parse(jsonMatch[0]) as AIEstimateResult
    return parsed
  } catch (err) {
    return {
      understood: '',
      items: [],
      clarifications: [],
      error: err instanceof Error ? err.message : 'Error al generar el estimado',
    }
  }
}
