import { requireAdmin } from '@/lib/admin/require-admin'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { UsersTable } from '@/components/admin/UsersTable'
import type { Database } from '@/lib/supabase/types'

export const metadata = { title: 'Users — Quotronex Admin' }

export default async function AdminUsersPage() {
  await requireAdmin()

  const db = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const [{ data: members }, { data: businesses }] = await Promise.all([
    db.from('business_members').select('*').order('invited_at', { ascending: false }),
    db.from('businesses').select('id, name'),
  ])

  const bizMap = new Map((businesses ?? []).map(b => [b.id, b.name]))

  const rows = (members ?? []).map(m => ({
    id: m.id,
    userId: m.user_id,
    businessId: m.business_id,
    businessName: bizMap.get(m.business_id) ?? '—',
    role: m.role,
    joinedAt: m.accepted_at ?? m.invited_at,
    invitedAt: m.invited_at,
    accepted: m.accepted_at !== null,
  }))

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black [font-family:var(--font-display)] text-white">Users</h1>
        <p className="mt-1 text-sm text-[#888]">{rows.length} miembro{rows.length !== 1 ? 's' : ''}</p>
      </div>
      <UsersTable rows={rows} />
    </div>
  )
}
