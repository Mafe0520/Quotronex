'use client'

import { useState } from 'react'
import { Search, Crown } from 'lucide-react'

const STATUS_STYLES: Record<string, { label: string; color: string }> = {
  trialing:  { label: 'Trial',    color: 'bg-blue-500/15 text-blue-400' },
  active:    { label: 'Active',   color: 'bg-emerald-500/15 text-emerald-400' },
  past_due:  { label: 'Past due', color: 'bg-red-500/15 text-red-400' },
  canceled:  { label: 'Canceled', color: 'bg-[#1a1a1a] text-[#666]' },
  paused:    { label: 'Paused',   color: 'bg-amber-500/15 text-amber-400' },
}

const PLAN_LABELS: Record<string, string> = {
  solo:     'Solo',
  crew:     'Crew',
  business: 'Business',
  pro_team: 'Pro Team',
}

const PLAN_PRICES: Record<string, number> = {
  solo: 2900, crew: 3900, business: 5900, pro_team: 8900,
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function trialDaysLeft(iso: string | null) {
  if (!iso) return null
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
}

export interface SubRow {
  id: string
  business_id: string
  businessName: string
  businessSlug: string
  plan_id: string
  status: string
  is_founder: boolean
  billing: string | null
  trial_ends_at: string | null
  next_billing_at: string | null
  created_at: string
  stripe_sub_id: string | null
}

export function SubscriptionsTable({ rows }: { rows: SubRow[] }) {
  const [q, setQ] = useState('')

  const filtered = rows.filter(r =>
    !q ||
    r.businessName.toLowerCase().includes(q.toLowerCase()) ||
    r.plan_id.toLowerCase().includes(q.toLowerCase()) ||
    r.status.toLowerCase().includes(q.toLowerCase())
  )

  return (
    <div>
      <div className="relative mb-4 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
        <input
          type="search"
          placeholder="Buscar…"
          value={q}
          onChange={e => setQ(e.target.value)}
          className="h-9 w-full rounded-lg border border-[#222] bg-[#111] pl-8 pr-3 text-sm text-white placeholder:text-[#555] outline-none focus:border-[#444]"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#1a1a1a]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1a1a1a] text-[10px] font-semibold uppercase tracking-widest text-[#555]">
              <th className="px-4 py-3 text-left">Business</th>
              <th className="px-4 py-3 text-left">Plan</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Price</th>
              <th className="px-4 py-3 text-left">Next billing</th>
              <th className="px-4 py-3 text-left">Started</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[#555]">No results</td>
              </tr>
            )}
            {filtered.map(r => {
              const st = STATUS_STYLES[r.status]
              const daysLeft = r.status === 'trialing' ? trialDaysLeft(r.trial_ends_at) : null
              const priceCents = PLAN_PRICES[r.plan_id] ?? null

              return (
                <tr key={r.id} className="border-b border-[#111] hover:bg-[#0d0d14] transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white">{r.businessName}</div>
                    <div className="text-xs text-[#555]">{r.businessSlug}</div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-[#aaa]">
                      {PLAN_LABELS[r.plan_id] ?? r.plan_id}
                      {r.is_founder && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                          <Crown size={9} /> FOUNDER
                        </span>
                      )}
                    </div>
                    {r.billing && (
                      <div className="text-xs text-[#555] capitalize">{r.billing}</div>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    {st && (
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
                    )}
                  </td>

                  <td className="px-4 py-3">
                    {priceCents ? (
                      <div>
                        <span className="text-[#aaa]">${(priceCents / 100).toFixed(0)}/mo</span>
                        <div className="text-[10px] text-amber-500">ESTIMATED</div>
                      </div>
                    ) : (
                      <span className="text-[#444]">—</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-[#555]">
                    {r.status === 'trialing' ? fmtDate(r.trial_ends_at) : fmtDate(r.next_billing_at)}
                  </td>

                  <td className="px-4 py-3 text-[#555]">{fmtDate(r.created_at)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
