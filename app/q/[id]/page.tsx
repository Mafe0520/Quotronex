import { notFound } from 'next/navigation'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { QuotePublicView } from '@/components/quotes/QuotePublicView'

export default async function PublicQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const db = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const [{ data: quote }, { data: items }] = await Promise.all([
    db.from('quotes').select('id, status, total_cents, created_at, accepted_at, accepted_name, expires_at, notes, deposit_cents, deposit_pct, clients(name, email, phone), businesses(name, phone, email, address, website, tagline, logo_url, zelle_tag, cashapp_tag, venmo_tag)').eq('id', id).single(),
    db.from('quote_items').select('id, name, description, qty, unit_price_cents, total_cents, unit, optional, sort_order').eq('quote_id', id).order('sort_order'),
  ])

  if (!quote) notFound()

  return <QuotePublicView quote={quote as any} items={items ?? []} />
}
