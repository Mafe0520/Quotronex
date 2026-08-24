import { requireAdmin } from '@/lib/admin/require-admin'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { BusinessesTable } from '@/components/admin/BusinessesTable'
import type { Database } from '@/lib/supabase/types'

export const metadata = { title: 'Businesses — Quotronex Admin' }

export default async function AdminBusinessesPage() {
  await requireAdmin()

  const db = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const [{ data: businesses }, { data: subs }, { data: members }] = await Promise.all([
    db.from('businesses').select('id, name, slug, created_at').order('created_at', { ascending: false }),
    db.from('subscriptions').select('business_id, plan_id, status, is_founder, trial_ends_at, billing'),
    db.from('business_members').select('business_id, role'),
  ])

  const subMap = new Map((subs ?? []).map(s => [s.business_id, s]))
  const memberCount = (members ?? []).reduce<Record<string, number>>((acc, m) => {
    acc[m.business_id] = (acc[m.business_id] ?? 0) + 1
    return acc
  }, {})

  const rows = (businesses ?? []).map(b => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    createdAt: b.created_at,
    plan: subMap.get(b.id)?.plan_id ?? null,
    status: subMap.get(b.id)?.status ?? null,
    isFounder: subMap.get(b.id)?.is_founder ?? false,
    trialEndsAt: subMap.get(b.id)?.trial_ends_at ?? null,
    billing: subMap.get(b.id)?.billing ?? null,
    members: memberCount[b.id] ?? 0,
  }))

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black [font-family:var(--font-display)] text-white">Businesses</h1>
        <p className="mt-1 text-sm text-[#888]">{rows.length} negocio{rows.length !== 1 ? 's' : ''} registrado{rows.length !== 1 ? 's' : ''}</p>
      </div>
      <BusinessesTable rows={rows} />
    </div>
  )
}
