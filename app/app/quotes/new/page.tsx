import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NewQuoteFlow } from '@/components/app/quotes/NewQuoteFlow'

export const metadata = { title: 'Nueva cotización — Quotronex', robots: { index: false } }

export default async function NewQuotePage({ searchParams }: { searchParams: Promise<{ clientId?: string; project?: string }> }) {
  const { clientId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: ids } = await supabase.rpc('get_my_business_ids')
  const businessId = ids?.[0] ?? null
  if (!businessId) redirect('/app')

  const [{ data: clients }, { data: priceBook }] = await Promise.all([
    supabase.from('clients').select('id, name, email, phone').eq('business_id', businessId).is('archived_at', null).order('name'),
    supabase.from('price_book_items')
      .select('id, name, price_cents, unit, trade, favorite, is_optional')
      .eq('business_id', businessId)
      .is('archived_at', null)
      .eq('active', true)
      .order('favorite', { ascending: false })
      .order('name'),
  ])

  const preselectedClient = clientId
    ? (clients ?? []).find(c => c.id === clientId) ?? null
    : null

  return (
    <NewQuoteFlow
      clients={clients ?? []}
      priceBook={priceBook ?? []}
      preselectedClient={preselectedClient}
      businessId={businessId}
    />
  )
}
