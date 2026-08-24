import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TimesheetsClient } from '@/components/app/TimesheetsClient'

export const metadata = { title: 'Timesheets — Quotronex' }

export default async function TimesheetsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: bizIds } = await supabase.rpc('get_my_business_ids')
  const businessId = bizIds?.[0] as string | null
  if (!businessId) redirect('/app')

  const { data: member } = await supabase
    .from('business_members')
    .select('role')
    .eq('business_id', businessId)
    .eq('user_id', user.id)
    .single()

  if (member?.role === 'field_worker') redirect('/app/worker')

  const { data: entries } = await supabase
    .from('time_entries')
    .select('id, clocked_in_at, clocked_out_at, notes, status, worker_name, user_id, jobs(id, title)')
    .eq('business_id', businessId)
    .order('clocked_in_at', { ascending: false })
    .limit(200)

  return <TimesheetsClient entries={(entries ?? []) as any} />
}
