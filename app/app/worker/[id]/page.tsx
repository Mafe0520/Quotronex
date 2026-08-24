import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WorkerJobDetail } from '@/components/app/worker/WorkerJobDetail'

export default async function WorkerJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: bizIds } = await supabase.rpc('get_my_business_ids')
  const businessId = bizIds?.[0] as string | null
  if (!businessId) redirect('/login')

  const { data: membership } = await supabase
    .from('business_members')
    .select('role, name')
    .eq('business_id', businessId)
    .eq('user_id', user.id)
    .single()

  if (membership?.role !== 'field_worker') redirect(`/app/jobs/${id}`)

  const [{ data: job }, { data: photos }, { data: activeEntry }] = await Promise.all([
    supabase
      .from('jobs')
      .select('id, title, status, notes, start_date, end_date, flags, quotes(clients(name, phone, address))')
      .eq('id', id)
      .single(),
    supabase
      .from('job_photos')
      .select('id, url, phase, caption, created_at')
      .eq('job_id', id)
      .order('created_at'),
    supabase
      .from('time_entries')
      .select('id, clocked_in_at, clocked_out_at')
      .eq('job_id', id)
      .eq('user_id', user.id)
      .is('clocked_out_at', null)
      .maybeSingle(),
  ])

  if (!job) notFound()

  return (
    <WorkerJobDetail
      job={job as any}
      photos={(photos ?? []) as any[]}
      userId={user.id}
      activeEntry={activeEntry ?? null}
    />
  )
}
