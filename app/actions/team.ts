'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { MemberRole } from '@/lib/permissions'

async function getContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: ids } = await supabase.rpc('get_my_business_ids')
  const businessId = ids?.[0] as string | null
  if (!businessId) redirect('/app')

  // Check caller role
  const { data: member } = await supabase
    .from('business_members')
    .select('role')
    .eq('business_id', businessId)
    .eq('user_id', user.id)
    .single()

  return { supabase, user, businessId, callerRole: member?.role as MemberRole | undefined }
}

export async function inviteTeamMember(data: {
  email: string
  name: string
  role: MemberRole
}): Promise<{ ok?: boolean; error?: string }> {
  const { supabase, user, businessId, callerRole } = await getContext()
  if (callerRole !== 'owner' && callerRole !== 'admin') return { error: 'Sin permiso' }
  if (data.role === 'owner') return { error: 'No puedes asignar el rol de Owner' }

  const { data: business } = await supabase
    .from('businesses')
    .select('name')
    .eq('id', businessId)
    .single()

  // Upsert invite
  const { data: invite, error } = await supabase
    .from('team_invites')
    .upsert({
      business_id: businessId,
      email: data.email.toLowerCase().trim(),
      name: data.name.trim() || null,
      role: data.role,
      invited_by: user.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      accepted_at: null,
    }, { onConflict: 'business_id,email' })
    .select('token')
    .single()

  if (error || !invite) return { error: error?.message ?? 'Error al invitar' }

  // Send invite email
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3003'
  const inviteUrl = `${appUrl}/join/${invite.token}`

  try {
    const { sendTeamInviteEmail } = await import('@/lib/email')
    await sendTeamInviteEmail({
      to: data.email,
      name: data.name,
      businessName: business?.name ?? 'Quotronex',
      role: data.role,
      inviteUrl,
    })
  } catch {
    // Non-fatal — invite record exists, email failed
  }

  const { notifyUsers } = await import('@/lib/push')
  const { data: owners } = await supabase.from('business_members').select('user_id').eq('business_id', businessId).eq('role', 'owner')
  const ownerIds = ((owners ?? []) as { user_id: string }[]).map((r) => r.user_id)
  notifyUsers({ title: 'Nuevo miembro invitado', body: `${data.name || data.email} fue invitado al equipo`, url: '/app', user_ids: ownerIds })

  revalidatePath('/app/settings')
  return { ok: true }
}

export async function removeMember(memberId: string): Promise<{ error?: string }> {
  const { supabase, businessId, callerRole } = await getContext()
  if (callerRole !== 'owner' && callerRole !== 'admin') return { error: 'Sin permiso' }

  // Can't remove owner
  const { data: target } = await supabase
    .from('business_members')
    .select('role')
    .eq('id', memberId)
    .eq('business_id', businessId)
    .single()
  if (target?.role === 'owner') return { error: 'No puedes remover al Owner' }

  await supabase.from('business_members').delete().eq('id', memberId).eq('business_id', businessId)
  revalidatePath('/app/settings')
  return {}
}

export async function updateMemberRole(memberId: string, role: MemberRole): Promise<{ error?: string }> {
  const { supabase, businessId, callerRole } = await getContext()
  if (callerRole !== 'owner' && callerRole !== 'admin') return { error: 'Sin permiso' }
  if (role === 'owner') return { error: 'No puedes asignar Owner' }

  const { error } = await supabase
    .from('business_members')
    .update({ role })
    .eq('id', memberId)
    .eq('business_id', businessId)
  if (error) return { error: error.message }
  revalidatePath('/app/settings')
  return {}
}

export async function revokeInvite(inviteId: string): Promise<{ error?: string }> {
  const { supabase, businessId, callerRole } = await getContext()
  if (callerRole !== 'owner' && callerRole !== 'admin') return { error: 'Sin permiso' }
  await supabase.from('team_invites').delete().eq('id', inviteId).eq('business_id', businessId)
  revalidatePath('/app/settings')
  return {}
}
