'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function getBusinessId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: ids } = await supabase.rpc('get_my_business_ids')
  const id = ids?.[0] ?? null
  if (!id) redirect('/app')
  return { supabase, user, businessId: id as string }
}

export type QuoteItemDraft = {
  name: string
  description?: string
  qty: number
  unit_price_cents: number
  unit?: string
  price_book_item_id?: string
  optional?: boolean
  markup_pct?: number | null
  item_type?: string | null
}

export async function createQuote(clientId: string | null, items: QuoteItemDraft[]) {
  const { supabase, businessId } = await getBusinessId()

  const total_cents = items.reduce((s, i) => s + i.qty * i.unit_price_cents, 0)

  const { data: quote, error } = await supabase
    .from('quotes')
    .insert({ business_id: businessId, client_id: clientId, status: 'draft', total_cents })
    .select('id')
    .single()

  if (error || !quote) return { error: error?.message ?? 'Error al crear la cotización' }

  if (items.length > 0) {
    const rows = items.map((item, i) => ({
      business_id: businessId,
      quote_id: quote.id,
      name: item.name,
      description: item.description ?? null,
      qty: item.qty,
      unit_price_cents: item.unit_price_cents,
      total_cents: item.qty * item.unit_price_cents,
      unit: item.unit ?? null,
      price_book_item_id: item.price_book_item_id ?? null,
      optional: item.optional ?? false,
      markup_pct: item.markup_pct ?? null,
      item_type: item.item_type ?? null,
      sort_order: i,
    }))
    await supabase.from('quote_items').insert(rows)

    // Mark price book items as recently used
    const pbIds = items.map(i => i.price_book_item_id).filter(Boolean) as string[]
    if (pbIds.length > 0) {
      await supabase.from('price_book_items')
        .update({ last_used_at: new Date().toISOString() })
        .in('id', pbIds)
    }
  }

  revalidatePath('/app')
  return { quoteId: quote.id }
}

export async function updateQuoteStatus(quoteId: string, status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired' | 'converted') {
  const { supabase } = await getBusinessId()
  const { error } = await supabase
    .from('quotes')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', quoteId)
  if (error) return { error: error.message }
  revalidatePath('/app')
  revalidatePath(`/app/quotes/${quoteId}`)
  return { ok: true }
}

export async function saveQuoteAndRedirect({
  trade, serviceName, priceTotal, description,
}: {
  trade: string; serviceName: string; priceTotal: number; description: string
}) {
  const { supabase, businessId } = await getBusinessId()
  const total_cents = Math.round(priceTotal * 100)

  const { data: quote, error } = await supabase
    .from('quotes')
    .insert({ business_id: businessId, client_id: null, status: 'draft', total_cents })
    .select('id')
    .single()

  if (error || !quote) redirect('/app')

  await supabase.from('quote_items').insert({
    business_id: businessId,
    quote_id: quote.id,
    name: serviceName,
    description,
    qty: 1,
    unit_price_cents: total_cents,
    total_cents,
    sort_order: 0,
  })

  revalidatePath('/app')
  redirect(`/app/quotes/${quote.id}`)
}

export async function duplicateQuote(quoteId: string): Promise<{ newId?: string; error?: string }> {
  const { supabase, businessId } = await getBusinessId()

  const [{ data: quote }, { data: items }] = await Promise.all([
    supabase.from('quotes').select('client_id, project_id, notes, expires_at').eq('id', quoteId).single(),
    supabase.from('quote_items').select('name, description, qty, unit_price_cents, total_cents, unit, price_book_item_id, sort_order').eq('quote_id', quoteId).order('sort_order'),
  ])
  if (!quote) return { error: 'Cotización no encontrada' }

  const total_cents = (items ?? []).reduce((s, i) => s + i.total_cents, 0)
  const { data: newQuote, error } = await supabase
    .from('quotes')
    .insert({ business_id: businessId, client_id: quote.client_id, project_id: quote.project_id, notes: quote.notes, status: 'draft', total_cents })
    .select('id').single()

  if (error || !newQuote) return { error: error?.message ?? 'Error al duplicar' }

  if ((items ?? []).length > 0) {
    await supabase.from('quote_items').insert(
      items!.map(i => ({ ...i, business_id: businessId, quote_id: newQuote.id }))
    )
  }

  revalidatePath('/app')
  return { newId: newQuote.id }
}

export async function archiveQuote(quoteId: string): Promise<{ error?: string }> {
  const { supabase } = await getBusinessId()
  const { error } = await supabase.from('quotes').update({ archived_at: new Date().toISOString() }).eq('id', quoteId)
  if (error) return { error: error.message }
  revalidatePath('/app')
  return {}
}

export async function unarchiveQuote(quoteId: string): Promise<{ error?: string }> {
  const { supabase } = await getBusinessId()
  const { error } = await supabase.from('quotes').update({ archived_at: null }).eq('id', quoteId)
  if (error) return { error: error.message }
  revalidatePath('/app')
  return {}
}

export async function updateQuoteMeta(quoteId: string, data: { notes?: string; expires_at?: string | null; deposit_cents?: number | null; deposit_pct?: number | null }): Promise<{ error?: string }> {
  const { supabase } = await getBusinessId()
  const { error } = await supabase.from('quotes').update({ ...data, updated_at: new Date().toISOString() }).eq('id', quoteId)
  if (error) return { error: error.message }
  revalidatePath(`/app/quotes/${quoteId}`)
  revalidatePath('/app')
  return {}
}

export async function updateQuoteItems(quoteId: string, items: QuoteItemDraft[]): Promise<{ error?: string }> {
  const { supabase, businessId } = await getBusinessId()
  const total_cents = items.reduce((s, i) => s + i.qty * i.unit_price_cents, 0)

  await supabase.from('quote_items').delete().eq('quote_id', quoteId)

  if (items.length > 0) {
    const rows = items.map((item, i) => ({
      business_id: businessId,
      quote_id: quoteId,
      name: item.name,
      description: item.description ?? null,
      qty: item.qty,
      unit_price_cents: item.unit_price_cents,
      total_cents: item.qty * item.unit_price_cents,
      unit: item.unit ?? null,
      price_book_item_id: item.price_book_item_id ?? null,
      optional: item.optional ?? false,
      markup_pct: item.markup_pct ?? null,
      item_type: item.item_type ?? null,
      sort_order: i,
    }))
    const { error } = await supabase.from('quote_items').insert(rows)
    if (error) return { error: error.message }
  }

  await supabase.from('quotes').update({ total_cents, updated_at: new Date().toISOString() }).eq('id', quoteId)
  revalidatePath(`/app/quotes/${quoteId}`)
  revalidatePath('/app')
  return {}
}

export async function sendQuote(quoteId: string): Promise<{ ok?: boolean; error?: string }> {
  const { supabase } = await getBusinessId()

  const { data: quote } = await supabase
    .from('quotes')
    .select('id, total_cents, status, clients(name, email), businesses(name)')
    .eq('id', quoteId)
    .single()

  if (!quote) return { error: 'Cotización no encontrada' }

  const clientEmail = (quote.clients as { email?: string | null } | null)?.email
  if (!clientEmail) return { error: 'El cliente no tiene correo registrado' }

  const clientName = (quote.clients as { name: string } | null)?.name ?? 'Cliente'
  const businessName = (quote.businesses as { name: string } | null)?.name ?? 'Mi Negocio'

  const { sendQuoteEmail } = await import('@/lib/email')
  const result = await sendQuoteEmail({
    to: clientEmail,
    businessName,
    clientName,
    quoteId,
    totalCents: quote.total_cents,
  })

  if (result.error) return { error: result.error.message }

  if (quote.status === 'draft') {
    await supabase.from('quotes').update({ status: 'sent', updated_at: new Date().toISOString() }).eq('id', quoteId)
    revalidatePath('/app')
    revalidatePath(`/app/quotes/${quoteId}`)
  }

  return { ok: true }
}

export async function sendQuoteToSelf(quoteId: string): Promise<{ ok?: boolean; error?: string }> {
  const { supabase } = await getBusinessId()

  const { data: { user } } = await supabase.auth.getUser()
  const ownerEmail = user?.email
  if (!ownerEmail) return { error: 'No se encontró tu correo.' }

  const { data: quote } = await supabase
    .from('quotes')
    .select('id, total_cents, clients(name), businesses(name)')
    .eq('id', quoteId)
    .single()

  if (!quote) return { error: 'Cotización no encontrada' }

  const clientName = (quote.clients as { name: string } | null)?.name ?? 'Cliente'
  const businessName = (quote.businesses as { name: string } | null)?.name ?? 'Mi Negocio'

  const { sendQuoteEmail } = await import('@/lib/email')
  const result = await sendQuoteEmail({
    to: ownerEmail,
    businessName,
    clientName,
    quoteId,
    totalCents: quote.total_cents,
  })

  if (result.error) return { error: result.error.message }
  return { ok: true }
}

export async function createClient_(name: string, email?: string, phone?: string, address?: string) {
  const { supabase, businessId } = await getBusinessId()
  const { data, error } = await supabase
    .from('clients')
    .insert({ business_id: businessId, name, email: email || null, phone: phone || null, address: address || null })
    .select('id, name, email, phone, address')
    .single()
  if (error) return { error: error.message }
  return { client: data }
}

// Public action — no auth required; uses service role via anon key policy
export async function requestQuoteChanges(quoteId: string, message: string): Promise<{ error?: string }> {
  const { createClient: createSupabase } = await import('@supabase/supabase-js')
  const db = createSupabase<import('@/lib/supabase/types').Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { data: quote } = await db.from('quotes').select('business_id').eq('id', quoteId).single()
  if (!quote) return { error: 'Cotización no encontrada' }
  const { error } = await db.from('estimate_events').insert({
    quote_id: quoteId,
    business_id: quote.business_id,
    event_type: 'change_requested',
    meta: { message },
  })
  if (error) return { error: error.message }
  return {}
}
