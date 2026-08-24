import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: ids } = await supabase.rpc('get_my_business_ids')
  const businessId = ids?.[0]
  if (!businessId) return NextResponse.json({ error: 'No business' }, { status: 403 })

  const { job_id, url, phase, caption } = await req.json()
  if (!job_id || !url || !phase) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const { data, error } = await supabase
    .from('job_photos')
    .insert({ job_id, business_id: businessId, url, phase, caption: caption ?? null })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id })
}
