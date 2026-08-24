'use client'

import { useState } from 'react'
import { Search, UserCircle, ShieldCheck, Wrench } from 'lucide-react'

const ROLE_STYLES: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  owner:   { label: 'Owner',  icon: ShieldCheck, color: 'text-violet-400' },
  admin:   { label: 'Admin',  icon: ShieldCheck, color: 'text-blue-400' },
  tech:    { label: 'Tech',   icon: Wrench,      color: 'text-[#aaa]' },
  viewer:  { label: 'Viewer', icon: UserCircle,  color: 'text-[#666]' },
}

export interface UserRow {
  id: string
  userId: string
  businessId: string
  businessName: string
  role: string
  joinedAt: string
  invitedAt: string
  accepted: boolean
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function avatar(userId: string) {
  return userId.slice(0, 2).toUpperCase()
}

export function UsersTable({ rows }: { rows: UserRow[] }) {
  const [q, setQ] = useState('')

  const filtered = rows.filter(r =>
    !q ||
    r.businessName.toLowerCase().includes(q.toLowerCase()) ||
    r.role.toLowerCase().includes(q.toLowerCase()) ||
    r.userId.toLowerCase().includes(q.toLowerCase())
  )

  return (
    <div>
      <div className="relative mb-4 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
        <input
          type="search"
          placeholder="Buscar usuario…"
          value={q}
          onChange={e => setQ(e.target.value)}
          className="h-9 w-full rounded-lg border border-[#222] bg-[#111] pl-8 pr-3 text-sm text-white placeholder:text-[#555] outline-none focus:border-[#444]"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#1a1a1a]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1a1a1a] text-[10px] font-semibold uppercase tracking-widest text-[#555]">
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Business</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Joined</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[#555]">No results</td>
              </tr>
            )}
            {filtered.map(r => {
              const roleStyle = ROLE_STYLES[r.role] ?? ROLE_STYLES.viewer
              const Icon = roleStyle.icon
              return (
                <tr key={r.id} className="border-b border-[#111] hover:bg-[#0d0d14] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#1a1a1a] text-xs font-bold text-[#888]">
                        {avatar(r.userId)}
                      </div>
                      <span className="font-mono text-xs text-[#555]">{r.userId.slice(0, 8)}…</span>
                    </div>
                  </td>

                  <td className="px-4 py-3 font-medium text-[#aaa]">{r.businessName}</td>

                  <td className="px-4 py-3">
                    <div className={`flex items-center gap-1.5 font-semibold ${roleStyle.color}`}>
                      <Icon size={13} />
                      {roleStyle.label}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    {r.accepted ? (
                      <span className="inline-flex rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-400">Active</span>
                    ) : (
                      <span className="inline-flex rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-400">Pending</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-[#555]">{fmtDate(r.joinedAt)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
