'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function getContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: ids } = await supabase.rpc('get_my_business_ids')
  const businessId = ids?.[0] as string | null
  if (!businessId) redirect('/app')
  const { data: member } = await supabase
    .from('business_members')
    .select('role, name')
    .eq('business_id', businessId)
    .eq('user_id', user.id)
    .single()
  return { supabase, user, businessId, role: member?.role as string, workerName: member?.name as string | null }
}

export async function clockIn(jobId: string): Promise<{ id?: string; error?: string }> {
  const { supabase, user, businessId, workerName } = await getContext()

  // Check not already clocked in
  const { data: open } = await supabase
    .from('time_entries')
    .select('id')
    .eq('user_id', user.id)
    .eq('business_id', businessId)
    .is('clocked_out_at', null)
    .single()

  if (open) return { error: 'Ya estás fichado. Ficha salida primero.' }

  const { data, error } = await supabase
    .from('time_entries')
    .insert({ job_id: jobId, business_id: businessId, user_id: user.id, worker_name: workerName })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath(`/app/worker/${jobId}`)
  return { id: data.id }
}

export async function clockOut(entryId: string, jobId: string, notes?: string): Promise<{ error?: string }> {
  const { supabase, user } = await getContext()

  const { error } = await supabase
    .from('time_entries')
    .update({ clocked_out_at: new Date().toISOString(), notes: notes ?? null })
    .eq('id', entryId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath(`/app/worker/${jobId}`)
  revalidatePath('/app/timesheets')
  return {}
}

export async function approveTimeEntry(entryId: string, approved: boolean): Promise<{ error?: string }> {
  const { supabase, user, role } = await getContext()
  if (role === 'field_worker') return { error: 'Sin permiso' }

  const { error } = await supabase
    .from('time_entries')
    .update({ status: approved ? 'approved' : 'rejected', approved_by: user.id })
    .eq('id', entryId)

  if (error) return { error: error.message }
  revalidatePath('/app/timesheets')
  return {}
}
