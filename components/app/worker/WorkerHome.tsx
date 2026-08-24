'use client'

import { motion } from 'motion/react'
import { Briefcase, Calendar, CheckCircle2, PlayCircle, Clock, AlertTriangle, ChevronRight, Star } from 'lucide-react'
import { signOut } from '@/app/actions/auth'
import { useTransition } from 'react'

type Job = {
  id: string
  title: string | null
  status: string
  start_date: string | null
  end_date: string | null
  notes: string | null
  flags: string[]
  quotes: { clients: { name: string; phone: string | null } | null } | null
}

const STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  scheduled:   { label: 'Programado',  color: 'bg-blue-50 text-blue-700',   icon: <Calendar size={13} /> },
  in_progress: { label: 'En progreso', color: 'bg-amber-50 text-amber-700', icon: <PlayCircle size={13} /> },
  on_hold:     { label: 'En pausa',    color: 'bg-gray-100 text-gray-600',  icon: <Clock size={13} /> },
}

const FLAG_ICONS: Record<string, React.ReactNode> = {
  needs_attention: <AlertTriangle size={12} className="text-red-500" />,
  priority:        <Star size={12} className="text-orange-500" />,
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function WorkerHome({ workerName, jobs, today }: {
  workerName: string
  jobs: Job[]
  today: string
}) {
  const [signingOut, startSignOut] = useTransition()

  const todayJobs = jobs.filter(j => j.start_date?.startsWith(today))
  const upcomingJobs = jobs.filter(j => !j.start_date?.startsWith(today))

  function renderJob(job: Job) {
    const meta = STATUS_META[job.status] ?? STATUS_META.scheduled
    const client = (job.quotes as any)?.clients
    const urgent = job.flags?.includes('needs_attention') || job.flags?.includes('priority')

    return (
      <motion.a
        key={job.id}
        href={`/app/worker/${job.id}`}
        whileTap={{ scale: 0.98 }}
        className={`flex items-center gap-4 rounded-2xl p-4 ${urgent ? 'bg-red-50 border border-red-100' : 'bg-[var(--surface)]'}`}
      >
        <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${urgent ? 'bg-red-100' : 'bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]'}`}>
          <Briefcase size={20} color={urgent ? '#ef4444' : 'var(--accent)'} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-sm font-bold truncate ${urgent ? 'text-red-800' : 'text-[var(--text-primary)]'}`}>
              {job.title ?? 'Trabajo'}
            </p>
            {job.flags?.map(f => FLAG_ICONS[f]).filter(Boolean)}
          </div>
          {client?.name && <p className="text-xs text-[var(--text-tertiary)] truncate">{client.name}</p>}
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.color}`}>
              {meta.icon}{meta.label}
            </span>
            {job.start_date && (
              <span className="text-[10px] text-[var(--text-tertiary)]">{fmtDate(job.start_date)}</span>
            )}
          </div>
        </div>
        <ChevronRight size={16} color="var(--text-tertiary)" className="shrink-0" />
      </motion.a>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg)]">
      {/* Header */}
      <div className="bg-[var(--surface)] px-5 pt-12 pb-6">
        <p className="text-xs font-semibold text-[var(--text-tertiary)]">{new Date().toLocaleDateString('es-MX', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        <h1 className="text-2xl font-black [font-family:var(--font-display)] text-[var(--text-primary)] mt-1">
          Hola, {workerName.split(' ')[0]} 👷
        </h1>
        <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
          {jobs.length === 0 ? 'No tienes trabajos asignados hoy' : `${jobs.length} trabajo${jobs.length !== 1 ? 's' : ''} asignado${jobs.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-6">

        {/* Today */}
        {todayJobs.length > 0 && (
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Hoy</p>
            <div className="flex flex-col gap-3">{todayJobs.map(renderJob)}</div>
          </div>
        )}

        {/* Upcoming */}
        {upcomingJobs.length > 0 && (
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Próximos</p>
            <div className="flex flex-col gap-3">{upcomingJobs.map(renderJob)}</div>
          </div>
        )}

        {/* Empty */}
        {jobs.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex size-20 items-center justify-center rounded-3xl bg-[var(--surface)]">
              <CheckCircle2 size={36} color="var(--text-tertiary)" />
            </div>
            <div>
              <p className="text-base font-bold text-[var(--text-primary)]">Todo al día</p>
              <p className="text-sm text-[var(--text-tertiary)] mt-1">No tienes trabajos pendientes</p>
            </div>
          </div>
        )}
      </div>

      {/* Sign out */}
      <div className="px-5 pb-8 pt-2">
        <button
          disabled={signingOut}
          onClick={() => startSignOut(async () => { await signOut() })}
          className="w-full text-xs text-[var(--text-tertiary)] py-3 disabled:opacity-50"
        >
          {signingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
        </button>
      </div>
    </div>
  )
}
