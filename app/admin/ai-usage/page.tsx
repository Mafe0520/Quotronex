import { requireAdmin } from '@/lib/admin/require-admin'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Brain, Zap, DollarSign, TrendingUp } from 'lucide-react'

export const metadata = { title: 'AI Usage — Quotronex Admin' }

const FEATURE_LABEL: Record<string, string> = {
  receipt_extraction: 'Receipt Extraction',
  price_book_import: 'Price Book Import',
  estimate_generation: 'Estimate Generation',
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color: string
}) {
  return (
    <div className="rounded-xl border border-[#1a1a1a] bg-[#0d0d14] p-5">
      <div className={`mb-3 flex size-9 items-center justify-center rounded-lg ${color}`}>
        <Icon size={16} />
      </div>
      <p className="text-3xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs font-semibold text-[#888]">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-[#555]">{sub}</p>}
    </div>
  )
}

export default async function AdminAIUsagePage() {
  await requireAdmin()

  const db = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [{ data: allLogs }, { data: businesses }] = await Promise.all([
    (db as any).from('ai_usage_log').select('*').order('created_at', { ascending: false }),
    db.from('businesses').select('id, name'),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const logs: any[] = allLogs ?? []
  const bizMap = new Map(((businesses ?? []) as { id: string; name: string }[]).map(b => [b.id, b.name]))

  const thisMonthLogs = logs.filter((l: any) => l.created_at >= startOfMonth)
  const last30Logs = logs.filter((l: any) => l.created_at >= thirtyDaysAgo)

  const totalCalls = logs.length
  const thisMonthCalls = thisMonthLogs.length
  const totalCost = logs.reduce((s: number, l: any) => s + Number(l.cost_usd), 0)
  const thisMonthCost = thisMonthLogs.reduce((s: number, l: any) => s + Number(l.cost_usd), 0)

  // By feature
  const byFeature: Record<string, { calls: number; cost: number }> = {}
  for (const l of logs) {
    if (!byFeature[l.feature]) byFeature[l.feature] = { calls: 0, cost: 0 }
    byFeature[l.feature].calls++
    byFeature[l.feature].cost += Number(l.cost_usd)
  }

  // By business (last 30 days, top 10)
  const byBiz: Record<string, { calls: number; cost: number }> = {}
  for (const l of last30Logs) {
    const biz = bizMap.get(l.business_id) ?? l.business_id ?? 'Unknown'
    if (!byBiz[biz]) byBiz[biz] = { calls: 0, cost: 0 }
    byBiz[biz].calls++
    byBiz[biz].cost += Number(l.cost_usd)
  }
  const topBiz = Object.entries(byBiz).sort((a, b) => b[1].calls - a[1].calls).slice(0, 10)

  // Daily calls last 14 days
  const daily: Record<string, number> = {}
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    daily[d.toISOString().slice(0, 10)] = 0
  }
  for (const l of logs) {
    const day = l.created_at?.slice(0, 10)
    if (day && daily[day] !== undefined) daily[day]++
  }
  const dailyMax = Math.max(...Object.values(daily), 1)

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black [font-family:var(--font-display)] text-white">AI Usage</h1>
        <p className="mt-1 text-sm text-[#888]">Claude Haiku calls across all businesses</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        <StatCard icon={Zap} label="Total calls" value={totalCalls.toLocaleString()} color="bg-violet-500/15 text-violet-400" />
        <StatCard icon={TrendingUp} label="This month" value={thisMonthCalls.toLocaleString()} color="bg-blue-500/15 text-blue-400" />
        <StatCard icon={DollarSign} label="Total cost" value={`$${totalCost.toFixed(4)}`} color="bg-emerald-500/15 text-emerald-400" />
        <StatCard icon={Brain} label="This month cost" value={`$${thisMonthCost.toFixed(4)}`} sub="Haiku pricing" color="bg-amber-500/15 text-amber-400" />
      </div>

      {/* Daily sparkline */}
      <div className="rounded-xl border border-[#1a1a1a] bg-[#0d0d14] p-6 mb-6">
        <h2 className="mb-4 text-sm font-bold text-white">Calls — last 14 days</h2>
        <div className="flex items-end gap-1 h-20">
          {Object.entries(daily).map(([day, count]) => (
            <div key={day} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-sm bg-violet-500/70"
                style={{ height: `${Math.round((count / dailyMax) * 72) + 4}px` }}
                title={`${day}: ${count} calls`}
              />
              <span className="text-[8px] text-[#444] rotate-45 origin-left hidden sm:block">{day.slice(5)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* By feature */}
        <div className="rounded-xl border border-[#1a1a1a] bg-[#0d0d14] p-6">
          <h2 className="mb-4 text-sm font-bold text-white">By Feature (all time)</h2>
          {Object.keys(byFeature).length === 0 ? (
            <p className="text-sm text-[#555]">No AI calls yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {Object.entries(byFeature).sort((a, b) => b[1].calls - a[1].calls).map(([feature, data]) => (
                <div key={feature} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">{FEATURE_LABEL[feature] ?? feature}</p>
                    <p className="text-xs text-[#555]">${data.cost.toFixed(4)} total cost</p>
                  </div>
                  <span className="text-lg font-black text-white tabular-nums">{data.calls}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top businesses */}
        <div className="rounded-xl border border-[#1a1a1a] bg-[#0d0d14] p-6">
          <h2 className="mb-4 text-sm font-bold text-white">Top Businesses — last 30 days</h2>
          {topBiz.length === 0 ? (
            <p className="text-sm text-[#555]">No AI calls in the last 30 days.</p>
          ) : (
            <div className="flex flex-col divide-y divide-[#111]">
              {topBiz.map(([biz, data]) => (
                <div key={biz} className="flex items-center justify-between gap-3 py-2.5">
                  <p className="text-sm text-white truncate">{biz}</p>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold tabular-nums text-white">{data.calls} calls</p>
                    <p className="text-[10px] text-[#555]">${data.cost.toFixed(4)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent log */}
      <div className="mt-6 rounded-xl border border-[#1a1a1a] overflow-hidden">
        <div className="px-5 py-3 border-b border-[#111]">
          <h2 className="text-sm font-bold text-white">Recent calls</h2>
        </div>
        {logs.length === 0 ? (
          <p className="px-5 py-8 text-sm text-[#555]">No AI calls logged yet.</p>
        ) : (
          <div className="divide-y divide-[#111]">
            {logs.slice(0, 50).map((l: any) => (
              <div key={l.id} className="flex items-center gap-4 px-5 py-3">
                <span className="text-xs text-[#555] shrink-0 tabular-nums">{new Date(l.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                <span className="text-xs font-semibold text-violet-400 shrink-0">{FEATURE_LABEL[l.feature] ?? l.feature}</span>
                <span className="text-xs text-[#555] flex-1 truncate">{bizMap.get(l.business_id) ?? '—'}</span>
                <span className="text-xs text-[#444] shrink-0">{l.input_tokens + l.output_tokens} tok</span>
                <span className="text-xs font-mono text-emerald-500 shrink-0">${Number(l.cost_usd).toFixed(5)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
