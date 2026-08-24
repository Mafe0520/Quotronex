import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WorkerHome } from '@/components/app/worker/WorkerHome'

export default async function WorkerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: bizIds } = await supabase.rpc('get_my_business_ids')
  const businessId = bizIds?.[0] as string | null
  if (!businessId) redirect('/login')

  // Only field_workers land here; others go to /app
  const { data: membership } = await supabase
    .from('business_members')
    .select('role, name')
    .eq('business_id', businessId)
    .eq('user_id', user.id)
    .single()

  if (membership?.role !== 'field_worker') redirect('/app')

  const today = new Date().toISOString().slice(0, 10)

  // Jobs assigned to this worker OR all jobs in the business (if none assigned)
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title, status, start_date, end_date, notes, flags, quotes(clients(name, phone))')
    .eq('business_id', businessId)
    .or(`assigned_to.eq.${user.id},assigned_to.is.null`)
    .not('status', 'in', '("canceled","completed")')
    .order('start_date', { ascending: true, nullsFirst: false })

  return (
    <WorkerHome
      workerName={membership?.name ?? user.email ?? 'Worker'}
      jobs={jobs ?? []}
      today={today}
    />
  )
}
