import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/require-admin'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return new NextResponse(null, { status: 404 })
  }

  const ticketId = req.nextUrl.searchParams.get('ticketId')
  if (!ticketId) return NextResponse.json([], { status: 400 })

  const db = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (db as any)
    .from('support_messages')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })

  return NextResponse.json(data ?? [])
}
