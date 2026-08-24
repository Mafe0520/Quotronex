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
  return { supabase, user, businessId }
}

export async function createSupportTicket(subject: string, body: string): Promise<{ id?: string; error?: string }> {
  const { supabase, user, businessId } = await getContext()

  const { data: ticket, error: te } = await supabase
    .from('support_tickets')
    .insert({ business_id: businessId, subject, priority: 'normal', status: 'open' })
    .select('id')
    .single()

  if (te || !ticket) return { error: te?.message ?? 'Error al crear ticket' }

  await supabase.from('support_messages').insert({
    ticket_id: ticket.id,
    sender: user.id,
    body,
  })

  revalidatePath('/app/support')
  return { id: ticket.id }
}

export async function replyToTicket(ticketId: string, body: string): Promise<{ error?: string }> {
  const { supabase, user } = await getContext()
  const { error } = await supabase.from('support_messages').insert({
    ticket_id: ticketId,
    sender: user.id,
    body,
  })
  if (error) return { error: error.message }
  revalidatePath('/app/support')
  revalidatePath(`/app/support/${ticketId}`)
  return {}
}
