'use client'

import { useState } from 'react'
import { Search, Building2, Users, Crown } from 'lucide-react'

const STATUS_STYLES: Record<string, { label: string; color: string }> = {
  trialing:  { label: 'Trial',    color: 'bg-blue-500/15 text-blue-400' },
  active:    { label: 'Active',   color: 'bg-emerald-500/15 text-emerald-400' },
  past_due:  { label: 'Past due', color: 'bg-red-500/15 text-red-400' },
  canceled:  { label: 'Canceled', color: 'bg-[#333] text-[#888]' },
  paused:    { label: 'Paused',   color: 'bg-amber-500/15 text-amber-400' },
}

const PLAN_LABELS: Record<string, string> = {
  solo:     'Solo',
  crew:     'Crew',
  business: 'Business',
  pro_team: 'Pro Team',
}

export interface BusinessRow {
  id: string
  name: string
  slug: string
  createdAt: string
  plan: string | null
  status: string | null
  isFounder: boolean
  trialEndsAt: string | null
  billing: string | null
  members: number
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function trialDaysLeft(iso: string | null) {
  if (!iso) return null
  const diff = new Date(iso).getTime() - Date.now()
  return Math.ceil(diff / 86_400_000)
}

export function BusinessesTable({ rows }: { rows: BusinessRow[] }) {
  const [q, setQ] = useState('')

  const filtered = rows.filter(r =>
    !q || r.name.toLowerCase().includes(q.toLowerCase()) || r.slug.toLowerCase().includes(q.toLowerCase())
  )

  return (
    <div>
      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
        <input
          type="search"
          placeholder="Buscar negocio…"
          value={q}
          onChange={e => setQ(e.target.value)}
          className="h-9 w-full rounded-lg border border-[#222] bg-[#111] pl-8 pr-3 text-sm text-white placeholder:text-[#555] outline-none focus:border-[#444]"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[#1a1a1a]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1a1a1a] text-[10px] font-semibold uppercase tracking-widest text-[#555]">
              <th className="px-4 py-3 text-left">Business</th>
              <th className="px-4 py-3 text-left">Plan</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Members</th>
              <th className="px-4 py-3 text-left">Registered</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[#555]">No results</td>
              </tr>
            )}
            {filtered.map(r => {
              const st = r.status ? STATUS_STYLES[r.status] : null
              const daysLeft = r.status === 'trialing' ? trialDaysLeft(r.trialEndsAt) : null
              return (
                <tr key={r.id} className="border-b border-[#111] hover:bg-[#0d0d14] transition-colors">
                  {/* Name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#1a1a1a]">
                        <Building2 size={14} className="text-[#555]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 font-semibold text-white">
                          {r.name}
                          {r.isFounder && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                              <Crown size={9} /> FOUNDER
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#555]">{r.slug}</div>
                      </div>
                    </div>
                  </td>

                  {/* Plan */}
                  <td className="px-4 py-3 text-[#aaa]">
                    {r.plan ? PLAN_LABELS[r.plan] ?? r.plan : <span className="text-[#444]">—</span>}
                    {r.billing && r.plan && (
                      <span className="ml-1 text-xs text-[#555]">· {r.billing}</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    {st ? (
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-semibold ${st.color}`}>
                          {st.label}
                        </span>
                        {daysLeft !== null && (
                          <span className={`text-xs ${daysLeft <= 3 ? 'text-red-400' : 'text-[#555]'}`}>
                            {daysLeft > 0 ? `${daysLeft}d left` : 'Expired'}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[#444]">—</span>
                    )}
                  </td>

                  {/* Members */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-[#aaa]">
                      <Users size={13} className="text-[#555]" />
                      {r.members}
                    </div>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 text-[#555]">{fmtDate(r.createdAt)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
