import { requireAdmin } from '@/lib/admin/require-admin'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { PLANS, type PlanId, estimatedMRR } from '@/lib/plans'
import { DollarSign, AlertTriangle } from 'lucide-react'
import type { Database } from '@/lib/supabase/types'

export const metadata = { title: 'Revenue — Quotronex Admin' }

const HAS_STRIPE = false

function fmt(cents: number) {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}`
}

function StatCard({ label, value, sub, estimated, noData }: {
  label: string; value: string; sub?: string; estimated?: boolean; noData?: boolean
}) {
  return (
    <div className="rounded-xl border border-[#1a1a1a] bg-[#0d0d14] p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#555]">{label}</p>
        {estimated && (
          <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-400">ESTIMATED</span>
        )}
        {noData && (
          <span className="rounded-full bg-[#1a1a1a] px-1.5 py-0.5 text-[9px] font-bold text-[#555]">NO DATA</span>
        )}
      </div>
      {noData ? (
        <p className="mt-3 h-8 w-12 rounded bg-[#1a1a1a]" />
      ) : (
        <p className="mt-2 text-3xl font-black text-white">{value}</p>
      )}
      {sub && <p className="mt-1 text-xs text-[#555]">{sub}</p>}
    </div>
  )
}

export default async function AdminRevenuePage() {
  await requireAdmin()

  const db = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: subs } = await db
    .from('subscriptions')
    .select('plan_id, status, is_founder, billing')

  const activeSubs = (subs ?? []).filter(s => s.status === 'active' || s.status === 'trialing')
  const mrrCents = activeSubs.reduce((sum, s) => sum + estimatedMRR(s.plan_id as PlanId, (s as any).billing ?? 'monthly', s.is_founder), 0)
  const arrCents = mrrCents * 12

  const planBreakdown = Object.entries(PLANS).map(([id, plan]) => {
    const count = activeSubs.filter(s => s.plan_id === id).length
    const revenue = activeSubs
      .filter(s => s.plan_id === id)
      .reduce((sum, s) => sum + estimatedMRR(id as PlanId, (s as any).billing ?? 'monthly', s.is_founder), 0)
    return { id, label: plan.name, count, revenue, price: plan.monthlyPriceCents }
  }).filter(p => p.count > 0 || true)

  const founderCount = (subs ?? []).filter(s => s.is_founder).length

  return (
    <div className="p-8">
      <div className="mb-2">
        <h1 className="text-2xl font-black [font-family:var(--font-display)] text-white">Revenue</h1>
      </div>

      {!HAS_STRIPE && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3">
          <AlertTriangle size={16} className="shrink-0 text-amber-400" />
          <p className="text-sm text-amber-300">
            Stripe not connected — all revenue figures are <strong>estimated</strong> based on active subscriptions. No real money data available.
          </p>
        </div>
      )}

      {/* Top stats */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Collected this month" value="—" sub="Stripe required" noData={!HAS_STRIPE} />
        <StatCard label="Estimated MRR" value={fmt(mrrCents)} sub="Active + trialing subs" estimated />
        <StatCard label="Estimated ARR" value={fmt(arrCents)} sub="MRR × 12" estimated />
        <StatCard label="Estimated net" value="—" sub="Stripe required" noData={!HAS_STRIPE} />
      </div>

      {/* Plan breakdown */}
      <div className="mb-8">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#555]">Plan breakdown</h2>
        <div className="rounded-xl border border-[#1a1a1a] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1a1a1a] text-[10px] font-semibold uppercase tracking-widest text-[#555]">
                <th className="px-4 py-3 text-left">Plan</th>
                <th className="px-4 py-3 text-left">Price</th>
                <th className="px-4 py-3 text-left">Subscribers</th>
                <th className="px-4 py-3 text-left">Est. MRR</th>
              </tr>
            </thead>
            <tbody>
              {planBreakdown.map(p => (
                <tr key={p.id} className="border-b border-[#111] hover:bg-[#0d0d14]">
                  <td className="px-4 py-3 font-semibold text-white">{p.label}</td>
                  <td className="px-4 py-3 text-[#aaa]">{fmt(p.price)}/mo</td>
                  <td className="px-4 py-3 text-[#aaa]">{p.count}</td>
                  <td className="px-4 py-3">
                    {p.count > 0 ? (
                      <div>
                        <span className="text-white">{fmt(p.revenue)}</span>
                        <span className="ml-1.5 text-[10px] text-amber-500">EST</span>
                      </div>
                    ) : (
                      <span className="text-[#444]">—</span>
                    )}
                  </td>
                </tr>
              ))}
              <tr className="bg-[#0a0a0f]">
                <td colSpan={2} className="px-4 py-3 text-xs font-semibold uppercase text-[#555]">Total</td>
                <td className="px-4 py-3 font-bold text-white">{activeSubs.length}</td>
                <td className="px-4 py-3">
                  <span className="font-bold text-white">{fmt(mrrCents)}</span>
                  <span className="ml-1.5 text-[10px] text-amber-500">EST</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Founder slots */}
      <div>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#555]">Founder program</h2>
        <div className="rounded-xl border border-[#1a1a1a] bg-[#0d0d14] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Founder slots used</p>
              <p className="mt-0.5 text-xs text-[#555]">100 slots total · precio especial bloqueado de por vida</p>
            </div>
            <p className="text-3xl font-black text-amber-400">{founderCount} <span className="text-lg text-[#555]">/ 100</span></p>
          </div>
          <div className="mt-4 h-2 w-full rounded-full bg-[#1a1a1a]">
            <div
              className="h-2 rounded-full bg-amber-500 transition-all"
              style={{ width: `${Math.min((founderCount / 100) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
