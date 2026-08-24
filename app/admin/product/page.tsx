import { requireAdmin } from '@/lib/admin/require-admin'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { FileText, Send, CheckCircle, Briefcase } from 'lucide-react'

export const metadata = { title: 'Product Usage — Quotronex Admin' }

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: number | string; sub?: string; color: string
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

function pct(a: number, b: number) {
  if (!b) return '—'
  return `${Math.round((a / b) * 100)}%`
}

export default async function AdminProductPage() {
  await requireAdmin()

  const db = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()

  const [{ data: events }, { data: jobs }, { data: clients }] = await Promise.all([
    db.from('estimate_events').select('event_type, created_at'),
    db.from('jobs').select('id, created_at'),
    db.from('clients').select('id, created_at'),
  ])

  const allEvents = events ?? []
  const allJobs = jobs ?? []
  const allClients = clients ?? []

  const created  = allEvents.filter(e => e.event_type === 'created').length
  const sent     = allEvents.filter(e => e.event_type === 'sent').length
  const accepted = allEvents.filter(e => e.event_type === 'accepted').length

  const createdThisMonth  = allEvents.filter(e => e.event_type === 'created' && e.created_at >= startOfMonth).length
  const createdLastMonth  = allEvents.filter(e => e.event_type === 'created' && e.created_at >= startOfLastMonth && e.created_at < startOfMonth).length
  const jobsThisMonth     = allJobs.filter(j => j.created_at >= startOfMonth).length
  const clientsThisMonth  = allClients.filter(c => c.created_at >= startOfMonth).length

  const delta = createdLastMonth > 0
    ? Math.round(((createdThisMonth - createdLastMonth) / createdLastMonth) * 100)
    : null

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black [font-family:var(--font-display)] text-white">Product Usage</h1>
        <p className="mt-1 text-sm text-[#888]">Datos reales de uso de la plataforma</p>
      </div>

      {/* Top stats */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={FileText}    label="Estimates created" value={created}  color="bg-blue-500/15 text-blue-400" />
        <StatCard icon={Send}        label="Estimates sent"    value={sent}     sub={`${pct(sent, created)} of created`} color="bg-violet-500/15 text-violet-400" />
        <StatCard icon={CheckCircle} label="Estimates accepted" value={accepted} sub={`${pct(accepted, sent)} close rate`} color="bg-emerald-500/15 text-emerald-400" />
        <StatCard icon={Briefcase}   label="Jobs created"      value={allJobs.length} color="bg-amber-500/15 text-amber-400" />
      </div>

      {/* This month */}
      <div className="mb-8">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#555]">This month</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: 'Estimates created',
              value: createdThisMonth,
              sub: delta !== null ? `${delta > 0 ? '+' : ''}${delta}% vs last month` : undefined,
              subColor: delta !== null ? (delta >= 0 ? 'text-emerald-400' : 'text-red-400') : '',
            },
            { label: 'Jobs created',   value: jobsThisMonth,    sub: undefined, subColor: '' },
            { label: 'Clients added',  value: clientsThisMonth, sub: undefined, subColor: '' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-[#1a1a1a] bg-[#0d0d14] p-5">
              <p className="text-3xl font-black text-white">{s.value}</p>
              <p className="mt-1 text-xs font-semibold text-[#888]">{s.label}</p>
              {s.sub && <p className={`mt-0.5 text-xs font-semibold ${s.subColor}`}>{s.sub}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Funnel */}
      <div>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#555]">Estimate funnel (all time)</h2>
        <div className="rounded-xl border border-[#1a1a1a] overflow-hidden">
          {[
            { label: 'Created', value: created,  pctOf: created,  color: 'bg-blue-500' },
            { label: 'Sent',    value: sent,     pctOf: created,  color: 'bg-violet-500' },
            { label: 'Accepted',value: accepted, pctOf: created,  color: 'bg-emerald-500' },
          ].map(row => {
            const width = created > 0 ? Math.round((row.value / created) * 100) : 0
            return (
              <div key={row.label} className="flex items-center gap-4 border-b border-[#111] px-5 py-4 last:border-0">
                <span className="w-20 text-xs font-semibold text-[#888]">{row.label}</span>
                <div className="flex-1 h-2 rounded-full bg-[#1a1a1a]">
                  <div className={`h-2 rounded-full ${row.color}`} style={{ width: `${width}%` }} />
                </div>
                <span className="w-8 text-right text-sm font-bold text-white">{row.value}</span>
                <span className="w-10 text-right text-xs text-[#555]">{width}%</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
