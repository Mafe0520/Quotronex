'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function convertQuoteToInvoice(quoteId: string): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  // Fetch quote + items
  const { data: quote, error: qErr } = await supabase
    .from('quotes')
    .select('*, quote_items(*)')
    .eq('id', quoteId)
    .single()
  if (qErr || !quote) return { error: 'Cotización no encontrada' }

  // Create invoice
  const due = new Date()
  due.setDate(due.getDate() + 30)

  const { data: invoice, error: iErr } = await supabase
    .from('invoices')
    .insert({
      business_id:    quote.business_id,
      client_id:      quote.client_id,
      project_id:     quote.project_id ?? null,
      quote_id:       quoteId,
      subtotal_cents: quote.total_cents,
      tax_cents:      0,
      total_cents:    quote.total_cents,
      amount_paid_cents: 0,
      status:         'draft' as const,
      issued_at:      new Date().toISOString(),
      due_at:         due.toISOString(),
    })
    .select('id')
    .single()

  if (iErr || !invoice) return { error: iErr?.message ?? 'Error al crear factura' }

  // Mark quote as converted
  await supabase.from('quotes').update({ status: 'converted' }).eq('id', quoteId)

  revalidatePath('/app')
  revalidatePath(`/app/quotes/${quoteId}`)
  return { id: invoice.id }
}

export async function getInvoices() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('invoices')
    .select('id, status, total_cents, amount_paid_cents, due_at, issued_at, clients(name), quote_id')
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getInvoice(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('invoices')
    .select('*, clients(id, name, email, phone), quotes(id, quote_items(id, name, description, qty, unit_price_cents, total_cents, unit))')
    .eq('id', id)
    .single()
  if (!data) return null

  const { data: payments } = await supabase
    .from('payments')
    .select('id, amount_cents, method, paid_at, notes')
    .eq('invoice_id', id)
    .order('paid_at', { ascending: false })

  return { ...data, payments: payments ?? [] }
}

export async function updateInvoiceStatus(
  invoiceId: string,
  status: 'draft' | 'sent' | 'partial' | 'paid' | 'overdue',
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('invoices').update({ status }).eq('id', invoiceId)
  if (error) return { error: error.message }
  revalidatePath(`/app/invoices/${invoiceId}`)
  revalidatePath('/app')
  return {}
}

export async function recordPayment(
  invoiceId: string,
  amountCents: number,
  method: 'cash' | 'check' | 'card' | 'transfer' | 'other',
  notes?: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: invoice } = await supabase
    .from('invoices')
    .select('business_id, total_cents, amount_paid_cents')
    .eq('id', invoiceId)
    .single()
  if (!invoice) return { error: 'Factura no encontrada' }

  const { error: pErr } = await supabase.from('payments').insert({
    business_id:  invoice.business_id,
    invoice_id:   invoiceId,
    amount_cents: amountCents,
    method,
    notes:        notes ?? null,
    paid_at:      new Date().toISOString(),
    status:       'received' as const,
    type:         'partial' as const,
    recorded_by:  user.id,
  })
  if (pErr) return { error: pErr.message }

  const newPaid = invoice.amount_paid_cents + amountCents
  const newStatus = newPaid >= invoice.total_cents ? 'paid' : newPaid > 0 ? 'partial' : 'sent'

  await supabase.from('invoices').update({
    amount_paid_cents: newPaid,
    status: newStatus,
  }).eq('id', invoiceId)

  revalidatePath(`/app/invoices/${invoiceId}`)
  revalidatePath('/app')
  return {}
}

export async function createInvoice(data: {
  clientId: string;
  projectId?: string;
  items: { name: string; description?: string; qty: number; unit_price_cents: number; unit?: string }[];
  notes?: string;
  dueAt?: string;
}): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: ids } = await supabase.rpc('get_my_business_ids')
  const businessId = ids?.[0] ?? null
  if (!businessId) return { error: 'Sin negocio' }

  const total = data.items.reduce((s, i) => s + i.qty * i.unit_price_cents, 0)
  const due = data.dueAt ?? (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString() })()

  const { data: inv, error } = await supabase.from('invoices').insert({
    business_id: businessId,
    client_id: data.clientId,
    project_id: data.projectId ?? null,
    subtotal_cents: total,
    tax_cents: 0,
    total_cents: total,
    amount_paid_cents: 0,
    status: 'draft' as const,
    issued_at: new Date().toISOString(),
    due_at: due,
    notes: data.notes ?? null,
  }).select('id').single()

  if (error || !inv) return { error: error?.message ?? 'Error' }

  revalidatePath('/app')
  return { id: inv.id }
}

export async function sendInvoice(invoiceId: string): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: invoice } = await supabase
    .from('invoices')
    .select('id, total_cents, due_at, status, clients(name, email), businesses(name)')
    .eq('id', invoiceId)
    .single()

  if (!invoice) return { error: 'Factura no encontrada' }

  const clientEmail = (invoice.clients as { email?: string | null } | null)?.email
  if (!clientEmail) return { error: 'El cliente no tiene correo registrado' }

  const clientName = (invoice.clients as { name: string } | null)?.name ?? 'Cliente'
  const businessName = (invoice.businesses as { name: string } | null)?.name ?? 'Mi Negocio'

  const { sendInvoiceEmail } = await import('@/lib/email')
  const result = await sendInvoiceEmail({
    to: clientEmail,
    businessName,
    clientName,
    invoiceId,
    totalCents: invoice.total_cents,
    dueDate: invoice.due_at,
  })

  if (result.error) return { error: result.error.message }

  if (invoice.status === 'draft') {
    await supabase.from('invoices').update({ status: 'sent' }).eq('id', invoiceId)
    revalidatePath('/app')
    revalidatePath(`/app/invoices/${invoiceId}`)
  }

  return { ok: true }
}
