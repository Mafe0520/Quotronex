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
  outputLang: 'es' | 'en' = 'es',
  trade?: string,
): Promise<AIEstimateResult> {
  if (!description.trim()) return { understood: '', items: [], clarifications: [] }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const contractorTrade = trade ?? 'general contractor'

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

  const langInstruction = outputLang === 'en'
    ? 'Respond with all item names, descriptions, and the "understood" field in ENGLISH.'
    : 'Respond with all item names, descriptions, and the "understood" field in SPANISH.'

  const systemPrompt = `You are an expert estimating assistant for a ${contractorTrade} contractor.
Your job is to interpret a job description and create a detailed quote line-item list.
You understand all types of contracting work: painting, plumbing, electrical, HVAC, roofing, flooring, landscaping, concrete, fencing, cleaning, moving, handyman, carpentry, drywall, waterproofing, and more.

CRITICAL RULES:
1. ONLY use prices from the contractor's Price Book — NEVER invent prices
2. If a service is NOT in the Price Book, create it as a manual item WITHOUT a price (price_book_item_id: null, unit_price_cents: 0)
3. Be conservative with quantities — if unknown, use 1
4. If important information is missing, add it to clarifications
5. ${langInstruction}
6. The "understood" field is a 1-2 sentence summary of what you understood about the job

AVAILABLE PRICE BOOK:
${pb.length === 0 ? '(No items in Price Book — all items will be manual without price)' : pbList}

Respond ONLY with valid JSON, no additional text:
{
  "understood": "short summary of what you understood",
  "items": [
    {
      "price_book_item_id": "uuid or null if no match",
      "name": "service name",
      "description": "additional description if applicable or null",
      "qty": number,
      "unit_price_cents": number (0 if no price),
      "unit": "unit or null",
      "confidence": "high|medium|low",
      "matched": true if from price book, false if manual
    }
  ],
  "clarifications": ["question 1 if info is missing", "question 2", ...]
}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        { role: 'user', content: `Job description:\n${description.trim()}` }
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
      error: err instanceof Error ? err.message : 'Error generating estimate',
    }
  }
}
