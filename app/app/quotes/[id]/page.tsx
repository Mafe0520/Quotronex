import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { QuoteDetail } from '@/components/app/quotes/QuoteDetail'

export default async function QuotePage({ params, searchParams }: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ action?: string }>
}) {
  const { id } = await params
  const { action } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: quote }, { data: items }, { data: linkedInvoice }, { data: changeEvents }] = await Promise.all([
    supabase.from('quotes').select('id, status, total_cents, created_at, notes, expires_at, deposit_cents, deposit_pct, voice_transcript, accepted_at, accepted_name, clients(id, name, email, phone), businesses(name, phone, email, address, website, tagline)').eq('id', id).single(),
    supabase.from('quote_items').select('*').eq('quote_id', id).order('sort_order'),
    supabase.from('invoices').select('id').eq('quote_id', id).maybeSingle(),
    supabase.from('estimate_events').select('id, created_at, meta').eq('quote_id', id).eq('event_type', 'change_requested').order('created_at', { ascending: false }).limit(1),
  ])

  if (!quote) notFound()

  const latestChangeRequest = changeEvents?.[0] ?? null

  return <QuoteDetail quote={quote} items={items ?? []} autoSend={action === 'send'} linkedInvoiceId={linkedInvoice?.id ?? null} changeRequest={latestChangeRequest ? { message: (latestChangeRequest.meta as { message?: string })?.message ?? '', created_at: latestChangeRequest.created_at } : null} />
}
