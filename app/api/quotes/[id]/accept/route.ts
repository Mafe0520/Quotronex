import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  const db = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // viewOnly = mark as viewed without accepting
  if (body.viewOnly) {
    await db.from('quotes')
      .update({ status: 'viewed' })
      .eq('id', id)
      .eq('status', 'sent') // only transition sent → viewed
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

  await db.from('quotes').update({
    status: 'accepted',
    accepted_at: new Date().toISOString(),
    accepted_name: name.trim(),
    accepted_ua: req.headers.get('user-agent'),
  }).eq('id', id)

  return NextResponse.json({ ok: true })
}
