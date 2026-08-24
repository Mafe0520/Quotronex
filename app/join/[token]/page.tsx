import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Look up invite with service role (bypasses RLS)
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: invite } = await admin
    .from('team_invites')
    .select('id, business_id, email, name, role, expires_at, accepted_at')
    .eq('token', token)
    .single()

  if (!invite || invite.accepted_at || new Date(invite.expires_at) < new Date()) {
    redirect('/login?error=invite_invalid')
  }

  // If user not logged in → send to signup/login with return URL
  if (!user) {
    redirect(`/login?next=/join/${token}`)
  }

  // Accept invite: add to business_members
  await admin.from('business_members').upsert({
    business_id: invite.business_id,
    user_id: user.id,
    role: invite.role,
    name: invite.name,
    email: invite.email,
    accepted_at: new Date().toISOString(),
  }, { onConflict: 'business_id,user_id' })

  // Mark invite accepted
  await admin.from('team_invites').update({ accepted_at: new Date().toISOString() }).eq('id', invite.id)

  redirect('/app')
}
