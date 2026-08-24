import { requireAdmin } from '@/lib/admin/require-admin'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { TrendingUp, AlertTriangle } from 'lucide-react'

export const metadata = { title: 'Acquisition — Quotronex Admin' }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default async function AdminAcquisitionPage() {
  await requireAdmin()

  const db = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const now = new Date()
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    return {
      label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      start: d.toISOString(),
      end: new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString(),
    }
  }).reverse()

  const [{ data: businesses }, { data: subs }] = await Promise.all([
    db.from('businesses').select('id, created_at'),
    db.from('subscriptions').select('business_id, status, created_at, trial_ends_at'),
  ])

  const allBiz = businesses ?? []
  const allSubs = subs ?? []

  const totalTrials  = allSubs.filter(s => s.status === 'trialing').length
  const totalActive  = allSubs.filter(s => s.status === 'active').length
  const totalCanceled = allSubs.filter(s => s.status === 'canceled').length
  const convRate = (totalTrials + totalActive + totalCanceled) > 0
    ? Math.round((totalActive / (totalTrials + totalActive + totalCanceled)) * 100)
    : 0

  const monthlyData = months.map(m => ({
    label: m.label,
    signups: allBiz.filter(b => b.created_at >= m.start && b.created_at < m.end).length,
    trials:  allSubs.filter(s => s.created_at >= m.start && s.created_at < m.end && s.status === 'trialing').length,
    converted: allSubs.filter(s => s.created_at >= m.start && s.created_at < m.end && s.status === 'active').length,
  }))

  const maxSignups = Math.max(...monthlyData.map(m => m.signups), 1)

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black [font-family:var(--font-display)] text-white">Acquisition</h1>
        <p className="mt-1 text-sm text-[#888]">Funnel de conversión</p>
      </div>

      <div className="mb-6 flex items-center gap-3 rounded-xl border border-[#1a1a1a] bg-[#0d0d14] px-4 py-3">
        <AlertTriangle size={14} className="shrink-0 text-[#555]" />
        <p className="text-xs text-[#555]">
          Sin tracking de visitas conectado. Los datos muestran signups reales desde Supabase Auth.
          Para el funnel completo (visitas → landing → trial) conecta analytics.
        </p>
      </div>

      {/* Funnel overview */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total signups',  value: allBiz.length,   color: 'text-white' },
          { label: 'In trial',       value: totalTrials,      color: 'text-blue-400' },
          { label: 'Converted',      value: totalActive,      color: 'text-emerald-400' },
          { label: 'Conv. rate',     value: `${convRate}%`,   color: convRate >= 30 ? 'text-emerald-400' : 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-[#1a1a1a] bg-[#0d0d14] p-5">
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
            <p className="mt-1 text-xs font-semibold text-[#888]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Monthly chart */}
      <div className="mb-8">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#555]">Signups por mes</h2>
        <div className="rounded-xl border border-[#1a1a1a] bg-[#0d0d14] p-6">
          <div className="flex items-end justify-around gap-4 h-32">
            {monthlyData.map(m => (
              <div key={m.label} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs font-bold text-white">{m.signups || ''}</span>
                <div className="w-full rounded-t-lg bg-[var(--accent)] transition-all"
                  style={{ height: `${(m.signups / maxSignups) * 100}%`, minHeight: m.signups ? 4 : 0 }}
                />
                <span className="text-[10px] text-[#555]">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly table */}
      <div>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#555]">Detalle mensual</h2>
        <div className="rounded-xl border border-[#1a1a1a] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1a1a1a] text-[10px] font-semibold uppercase tracking-widest text-[#555]">
                <th className="px-4 py-3 text-left">Month</th>
                <th className="px-4 py-3 text-left">Signups</th>
                <th className="px-4 py-3 text-left">Trials</th>
                <th className="px-4 py-3 text-left">Converted</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map(m => (
                <tr key={m.label} className="border-b border-[#111] hover:bg-[#0d0d14]">
                  <td className="px-4 py-3 font-semibold text-[#aaa]">{m.label}</td>
                  <td className="px-4 py-3 text-white">{m.signups}</td>
                  <td className="px-4 py-3 text-blue-400">{m.trials}</td>
                  <td className="px-4 py-3 text-emerald-400">{m.converted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
