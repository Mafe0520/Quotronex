import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/require-admin'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return new NextResponse(null, { status: 404 })
  }

  const { ticketId, body } = await req.json()
  if (!ticketId || !body?.trim()) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const db = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dbAny = db as any

  await Promise.all([
    dbAny.from('support_messages').insert({ ticket_id: ticketId, sender: 'admin', body: body.trim() }),
    dbAny.from('support_tickets').update({ status: 'waiting_on_user', updated_at: new Date().toISOString() }).eq('id', ticketId),
  ])

  return NextResponse.json({ ok: true })
}
