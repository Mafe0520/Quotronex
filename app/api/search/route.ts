import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json({ results: [] })

  const { data: ids } = await supabase.rpc('get_my_business_ids')
  const businessId = ids?.[0] as string | null
  if (!businessId) return NextResponse.json({ results: [] })

  const like = `%${q}%`

  const [quotesRes, clientsRes, jobsRes, pbRes] = await Promise.all([
    supabase.from('quotes')
      .select('id, status, total_cents, created_at, clients(name)')
      .eq('business_id', businessId)
      .is('archived_at', null)
      .ilike('clients.name', like)
      .limit(5),

    supabase.from('clients')
      .select('id, name, phone, email')
      .eq('business_id', businessId)
      .is('archived_at', null)
      .or(`name.ilike.${like},phone.ilike.${like},email.ilike.${like}`)
      .limit(6),

    supabase.from('jobs')
      .select('id, title, status, quotes(clients(name))')
      .eq('business_id', businessId)
      .is('archived_at', null)
      .ilike('title', like)
      .limit(5),

    supabase.from('price_book_items')
      .select('id, name, price_cents, unit, trade')
      .eq('business_id', businessId)
      .eq('active', true)
      .is('archived_at', null)
      .ilike('name', like)
      .limit(6),
  ])

  const results: { type: string; id: string; title: string; sub: string; href: string }[] = []

  for (const c of clientsRes.data ?? []) {
    results.push({ type: 'client', id: c.id, title: c.name, sub: c.phone ?? c.email ?? 'Cliente', href: `/app/customers/${c.id}` })
  }

  for (const j of jobsRes.data ?? []) {
    const client = (j.quotes as any)?.clients?.name ?? ''
    results.push({ type: 'job', id: j.id, title: j.title ?? 'Trabajo', sub: client, href: `/app/jobs/${j.id}` })
  }

  for (const q2 of quotesRes.data ?? []) {
    const clientName = (q2.clients as any)?.name ?? ''
    const total = `$${((q2.total_cents ?? 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    results.push({ type: 'quote', id: q2.id, title: `Cotización · ${clientName}`, sub: `${q2.status} · ${total}`, href: `/app/quotes/${q2.id}` })
  }

  for (const p of pbRes.data ?? []) {
    const price = p.price_cents > 0 ? `$${(p.price_cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'Sin precio'
    results.push({ type: 'price', id: p.id, title: p.name, sub: `${price}${p.unit ? ` / ${p.unit}` : ''}${p.trade ? ` · ${p.trade}` : ''}`, href: `/app/price-book/${p.id}/edit` })
  }

  return NextResponse.json({ results })
}
