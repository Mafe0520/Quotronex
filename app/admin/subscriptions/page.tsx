import { requireAdmin } from '@/lib/admin/require-admin'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { SubscriptionsTable } from '@/components/admin/SubscriptionsTable'
import type { Database } from '@/lib/supabase/types'

export const metadata = { title: 'Subscriptions — Quotronex Admin' }

export default async function AdminSubscriptionsPage() {
  await requireAdmin()

  const db = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const [{ data: subs }, { data: businesses }] = await Promise.all([
    db.from('subscriptions').select('*').order('created_at', { ascending: false }),
    db.from('businesses').select('id, name, slug'),
  ])

  const bizMap = new Map((businesses ?? []).map(b => [b.id, b]))

  const rows = (subs ?? []).map(s => ({
    ...s,
    businessName: bizMap.get(s.business_id)?.name ?? '—',
    businessSlug: bizMap.get(s.business_id)?.slug ?? '',
  }))

  const counts = {
    trialing: rows.filter(r => r.status === 'trialing').length,
    active:   rows.filter(r => r.status === 'active').length,
    pastDue:  rows.filter(r => r.status === 'past_due').length,
    canceled: rows.filter(r => r.status === 'canceled').length,
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black [font-family:var(--font-display)] text-white">Subscriptions</h1>
        <p className="mt-1 text-sm text-[#888]">{rows.length} total</p>
      </div>

      {/* Summary pills */}
      <div className="mb-6 flex flex-wrap gap-3">
        {[
          { label: 'Trialing',  count: counts.trialing, color: 'bg-blue-500/15 text-blue-400' },
          { label: 'Active',    count: counts.active,   color: 'bg-emerald-500/15 text-emerald-400' },
          { label: 'Past due',  count: counts.pastDue,  color: 'bg-red-500/15 text-red-400' },
          { label: 'Canceled',  count: counts.canceled, color: 'bg-[#1a1a1a] text-[#888]' },
        ].map(p => (
          <div key={p.label} className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${p.color}`}>
            <span className="text-base font-black">{p.count}</span> {p.label}
          </div>
        ))}
      </div>

      <SubscriptionsTable rows={rows} />
    </div>
  )
}
