'use client'

import { useState, useTransition } from 'react'
import { motion } from 'motion/react'
import { ChevronLeft, Clock, CheckCircle2, XCircle, AlertCircle, Filter } from 'lucide-react'
import { approveTimeEntry } from '@/app/actions/time'

type Entry = {
  id: string
  clocked_in_at: string
  clocked_out_at: string | null
  notes: string | null
  status: 'pending' | 'approved' | 'rejected'
  worker_name: string | null
  user_id: string
  jobs: { id: string; title: string | null } | null
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { weekday: 'short', month: 'short', day: 'numeric' })
}
function fmtDuration(inIso: string, outIso: string | null) {
  if (!outIso) return 'En progreso'
  const mins = Math.round((new Date(outIso).getTime() - new Date(inIso).getTime()) / 60000)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

const STATUS = {
  pending:  { label: 'Pendiente', color: 'bg-amber-50 text-amber-700', icon: <AlertCircle size={12} /> },
  approved: { label: 'Aprobado',  color: 'bg-green-50 text-green-700', icon: <CheckCircle2 size={12} /> },
  rejected: { label: 'Rechazado', color: 'bg-red-50 text-red-600',     icon: <XCircle size={12} /> },
}

export function TimesheetsClient({ entries: initialEntries }: { entries: Entry[] }) {
  const [entries, setEntries] = useState(initialEntries)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all')
  const [updating, startUpdate] = useTransition()

  function handleApprove(id: string, approved: boolean) {
    startUpdate(async () => {
      await approveTimeEntry(id, approved)
      setEntries(es => es.map(e => e.id === id ? { ...e, status: approved ? 'approved' : 'rejected' } : e))
    })
  }

  const filtered = entries.filter(e => filter === 'all' || e.status === filter)

  // Group by date
  const grouped = filtered.reduce<Record<string, Entry[]>>((acc, e) => {
    const day = e.clocked_in_at.slice(0, 10)
    acc[day] = [...(acc[day] ?? []), e]
    return acc
  }, {})

  const pendingCount = entries.filter(e => e.status === 'pending' && e.clocked_out_at).length

  // Total hours approved this week
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  weekStart.setHours(0, 0, 0, 0)
  const weekMins = entries
    .filter(e => e.status === 'approved' && e.clocked_out_at && new Date(e.clocked_in_at) >= weekStart)
    .reduce((s, e) => s + Math.round((new Date(e.clocked_out_at!).getTime() - new Date(e.clocked_in_at).getTime()) / 60000), 0)

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg)]">
      <header className="flex h-14 items-center gap-3 px-4 border-b border-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)]">
        <a href="/app" className="flex size-10 items-center justify-center rounded-full hover:bg-[var(--surface)]">
          <ChevronLeft size={20} color="var(--text-secondary)" />
        </a>
        <h1 className="flex-1 text-base font-bold [font-family:var(--font-display)] text-[var(--text-primary)]">Timesheets</h1>
        {pendingCount > 0 && (
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">{pendingCount} por aprobar</span>
        )}
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Stats bar */}
        <div className="grid grid-cols-2 gap-3 px-5 pt-5">
          <div className="rounded-2xl bg-[var(--surface)] p-4">
            <p className="text-xs text-[var(--text-tertiary)]">Esta semana</p>
            <p className="text-2xl font-black tabular-nums [font-family:var(--font-display)] text-[var(--accent)] mt-1">
              {Math.floor(weekMins / 60)}h {weekMins % 60}m
            </p>
            <p className="text-xs text-[var(--text-tertiary)]">horas aprobadas</p>
          </div>
          <div className="rounded-2xl bg-[var(--surface)] p-4">
            <p className="text-xs text-[var(--text-tertiary)]">Total registros</p>
            <p className="text-2xl font-black tabular-nums [font-family:var(--font-display)] text-[var(--text-primary)] mt-1">{entries.length}</p>
            <p className="text-xs text-[var(--text-tertiary)]">{pendingCount} pendientes</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 px-5 pt-4 pb-2">
          {(['all', 'pending', 'approved'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${filter === f ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface)] text-[var(--text-secondary)]'}`}>
              <Filter size={11} />
              {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendientes' : 'Aprobados'}
            </button>
          ))}
        </div>

        <div className="flex flex-col px-5 pb-10">
          {Object.keys(grouped).sort().reverse().map(day => (
            <div key={day} className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">{fmtDate(day)}</p>
              <div className="flex flex-col gap-2">
                {grouped[day].map(entry => {
                  const st = STATUS[entry.status]
                  const isOpen = !entry.clocked_out_at
                  return (
                    <div key={entry.id} className="rounded-2xl bg-[var(--surface)] p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-[var(--text-primary)] truncate">
                            {entry.worker_name ?? 'Worker'}
                          </p>
                          {entry.jobs?.title && (
                            <p className="text-xs text-[var(--text-tertiary)] truncate">{entry.jobs.title}</p>
                          )}
                        </div>
                        <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold shrink-0 ${st.color}`}>
                          {st.icon}{st.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>{fmtTime(entry.clocked_in_at)}</span>
                          <span>→</span>
                          <span>{entry.clocked_out_at ? fmtTime(entry.clocked_out_at) : '…'}</span>
                        </div>
                        <span className={`font-bold ${isOpen ? 'text-amber-600' : 'text-[var(--text-primary)]'}`}>
                          {fmtDuration(entry.clocked_in_at, entry.clocked_out_at)}
                        </span>
                      </div>

                      {entry.notes && (
                        <p className="mt-2 text-xs text-[var(--text-tertiary)] italic">"{entry.notes}"</p>
                      )}

                      {entry.status === 'pending' && entry.clocked_out_at && (
                        <div className="flex gap-2 mt-3">
                          <motion.button whileTap={{ scale: 0.97 }} disabled={updating}
                            onClick={() => handleApprove(entry.id, true)}
                            className="flex flex-1 h-9 items-center justify-center gap-1.5 rounded-xl bg-green-600 text-xs font-bold text-white disabled:opacity-60">
                            <CheckCircle2 size={13} /> Aprobar
                          </motion.button>
                          <motion.button whileTap={{ scale: 0.97 }} disabled={updating}
                            onClick={() => handleApprove(entry.id, false)}
                            className="flex flex-1 h-9 items-center justify-center gap-1.5 rounded-xl bg-red-50 text-xs font-bold text-red-600 disabled:opacity-60">
                            <XCircle size={13} /> Rechazar
                          </motion.button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Clock size={32} color="var(--text-tertiary)" />
              <p className="text-sm text-[var(--text-tertiary)]">No hay registros {filter !== 'all' ? 'con este filtro' : ''}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
