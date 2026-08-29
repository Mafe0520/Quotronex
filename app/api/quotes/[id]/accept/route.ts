import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { notifyUsers } from '@/lib/push'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  // Use any-typed client since we're using service role without generated types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  ) as any

  async function getOwnerIds(businessId: string): Promise<string[]> {
    const { data } = await db.from('business_members').select('user_id').eq('business_id', businessId).in('role', ['owner', 'admin'])
    return ((data ?? []) as { user_id: string }[]).map((r) => r.user_id)
  }

  // viewOnly = mark as viewed without accepting
  if (body.viewOnly) {
    const { data: q } = await db.from('quotes').select('business_id, quote_number').eq('id', id).eq('status', 'sent').single()
    await db.from('quotes').update({ status: 'viewed' }).eq('id', id).eq('status', 'sent')
    if (q) {
      const userIds = await getOwnerIds(q.business_id)
      notifyUsers({ title: 'Cliente vio tu cotización', body: `Cotización #${q.quote_number} fue abierta`, url: '/app', user_ids: userIds })
    }
    return NextResponse.json({ ok: true })
  }

  // Decline flow
  if (body.decline) {
    await db.from('quotes').update({
      status: 'declined',
      declined_at: new Date().toISOString(),
      decline_reason: body.reason?.trim() || null,
    }).eq('id', id).in('status', ['sent', 'viewed'])
    return NextResponse.json({ ok: true })
  }

  const { name } = body
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const { data: q } = await db.from('quotes').select('business_id, quote_number').eq('id', id).single()
  await db.from('quotes').update({
    status: 'accepted',
    accepted_at: new Date().toISOString(),
    accepted_name: name.trim(),
    accepted_ua: req.headers.get('user-agent'),
  }).eq('id', id)

  if (q) {
    const userIds = await getOwnerIds(q.business_id)
    notifyUsers({ title: '¡Cotización aceptada! 🎉', body: `${name.trim()} aceptó la cotización #${q.quote_number}`, url: '/app', user_ids: userIds })
  }

  return NextResponse.json({ ok: true })
}
