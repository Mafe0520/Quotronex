'use client'

import { useState, useTransition, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  ChevronLeft, Camera, Plus, Trash2, Phone, CheckCircle2,
  PlayCircle, PauseCircle, AlertTriangle, Star, Clock, X,
} from 'lucide-react'
import { updateJobStatus, deleteJobPhoto } from '@/app/actions/jobs'
import { clockIn, clockOut } from '@/app/actions/time'
import { createClient } from '@supabase/supabase-js'

const supabasePub = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

type Job = {
  id: string
  title: string | null
  status: string
  notes: string | null
  start_date: string | null
  end_date: string | null
  flags: string[]
  quotes: { clients: { name: string; phone: string | null; address: string | null } | null } | null
}

type Photo = { id: string; url: string; phase: 'before' | 'during' | 'after'; caption: string | null; created_at: string }

const PHASES: { key: 'before' | 'during' | 'after'; label: string; emoji: string }[] = [
  { key: 'before', label: 'Antes',    emoji: '📷' },
  { key: 'during', label: 'Durante',  emoji: '🔨' },
  { key: 'after',  label: 'Después',  emoji: '✅' },
]

const STATUS_META: Record<string, { label: string; color: string }> = {
  scheduled:   { label: 'Programado',  color: 'bg-blue-50 text-blue-700' },
  in_progress: { label: 'En progreso', color: 'bg-amber-50 text-amber-700' },
  completed:   { label: 'Completado',  color: 'bg-green-50 text-green-700' },
  on_hold:     { label: 'En pausa',    color: 'bg-gray-100 text-gray-600' },
}

const spring = { type: 'spring' as const, stiffness: 400, damping: 40 }

type TimeEntry = { id: string; clocked_in_at: string; clocked_out_at: string | null }

export function WorkerJobDetail({ job: initialJob, photos: initialPhotos, userId, activeEntry: initialEntry }: {
  job: Job
  photos: Photo[]
  userId: string
  activeEntry?: TimeEntry | null
}) {
  const [job, setJob] = useState(initialJob)
  const [photos, setPhotos] = useState(initialPhotos)
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(initialEntry ?? null)
  const [elapsed, setElapsed] = useState(0)
  const [showComplete, setShowComplete] = useState(false)
  const [clockNotes, setClockNotes] = useState('')
  const [clockError, setClockError] = useState<string | null>(null)
  const [uploadingPhase, setUploadingPhase] = useState<string | null>(null)
  const [updating, startUpdate] = useTransition()
  const [clocking, startClock] = useTransition()
  const [deleting, startDelete] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)
  const phaseRef = useRef<'before' | 'during' | 'after'>('during')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Live timer when clocked in
  useState(() => {
    if (activeEntry) {
      const start = new Date(activeEntry.clocked_in_at).getTime()
      const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000))
      tick()
      timerRef.current = setInterval(tick, 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  })

  function fmtElapsed(secs: number) {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    return h > 0 ? `${h}h ${m.toString().padStart(2,'0')}m` : `${m}:${s.toString().padStart(2,'0')}`
  }

  function handleClockIn() {
    setClockError(null)
    startClock(async () => {
      const res = await clockIn(job.id)
      if (res.error) { setClockError(res.error); return }
      const entry = { id: res.id!, clocked_in_at: new Date().toISOString(), clocked_out_at: null }
      setActiveEntry(entry)
      const start = Date.now()
      timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000)
    })
  }

  function handleClockOut() {
    if (!activeEntry) return
    startClock(async () => {
      await clockOut(activeEntry.id, job.id, clockNotes || undefined)
      if (timerRef.current) clearInterval(timerRef.current)
      setActiveEntry(null)
      setElapsed(0)
      setClockNotes('')
    })
  }

  const meta = STATUS_META[job.status] ?? STATUS_META.scheduled
  const client = (job.quotes as any)?.clients
  const isUrgent = job.flags?.includes('needs_attention')
  const isPriority = job.flags?.includes('priority')

  function setStatus(status: 'in_progress' | 'on_hold' | 'completed') {
    if (status === 'completed') { setShowComplete(true); return }
    startUpdate(async () => {
      await updateJobStatus(job.id, status)
      setJob(j => ({ ...j, status }))
    })
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const phase = phaseRef.current
    setUploadingPhase(phase)
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${job.id}/${phase}/${Date.now()}.${ext}`
      const { error } = await supabasePub.storage.from('job-photos').upload(path, file)
      if (error) { alert('Error al subir foto'); return }
      const { data: { publicUrl } } = supabasePub.storage.from('job-photos').getPublicUrl(path)

      const res = await fetch('/api/jobs/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: job.id, url: publicUrl, phase }),
      })
      const saved = await res.json()
      if (saved.id) setPhotos(p => [...p, { id: saved.id, url: publicUrl, phase, caption: null, created_at: new Date().toISOString() }])
    } finally {
      setUploadingPhase(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function openCamera(phase: 'before' | 'during' | 'after') {
    phaseRef.current = phase
    fileRef.current?.click()
  }

  function handleDeletePhoto(id: string) {
    startDelete(async () => {
      await deleteJobPhoto(id, job.id)
      setPhotos(p => p.filter(x => x.id !== id))
    })
  }

  function handleComplete() {
    startUpdate(async () => {
      await updateJobStatus(job.id, 'completed')
      setJob(j => ({ ...j, status: 'completed' }))
      setShowComplete(false)
    })
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg)]">
      <header className="flex h-14 items-center gap-3 px-4 border-b border-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)]">
        <a href="/app/worker" className="flex size-10 items-center justify-center rounded-full hover:bg-[var(--surface)]">
          <ChevronLeft size={20} color="var(--text-secondary)" />
        </a>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-[var(--text-primary)] truncate">{job.title ?? 'Trabajo'}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold shrink-0 ${meta.color}`}>{meta.label}</span>
      </header>

      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />

      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">

        {/* Flags */}
        {(isUrgent || isPriority) && (
          <div className={`flex items-center gap-2 rounded-2xl px-4 py-3 ${isUrgent ? 'bg-red-50' : 'bg-orange-50'}`}>
            {isUrgent ? <AlertTriangle size={16} className="text-red-500 shrink-0" /> : <Star size={16} className="text-orange-500 shrink-0" />}
            <p className={`text-sm font-bold ${isUrgent ? 'text-red-700' : 'text-orange-700'}`}>
              {isUrgent ? '⚠️ Requiere atención inmediata' : '⭐ Trabajo prioritario'}
            </p>
          </div>
        )}

        {/* Client */}
        {client && (
          <div className="rounded-2xl bg-[var(--surface)] p-4 flex items-center gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]">
              <span className="text-lg font-black text-[var(--accent)]">{client.name.slice(0, 1).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[var(--text-primary)]">{client.name}</p>
              {client.address && <p className="text-xs text-[var(--text-tertiary)] truncate">{client.address}</p>}
            </div>
            {client.phone && (
              <a href={`tel:${client.phone}`}
                className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-green-50">
                <Phone size={18} className="text-green-600" />
              </a>
            )}
          </div>
        )}

        {/* Notes */}
        {job.notes && (
          <div className="rounded-2xl bg-[var(--surface)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)] mb-1">Instrucciones</p>
            <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{job.notes}</p>
          </div>
        )}

        {/* Actions */}
        {job.status === 'scheduled' && (
          <motion.button whileTap={{ scale: 0.97 }} disabled={updating}
            onClick={() => setStatus('in_progress')}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 text-base font-bold text-white disabled:opacity-60">
            <PlayCircle size={20} /> Iniciar trabajo
          </motion.button>
        )}
        {job.status === 'in_progress' && (
          <div className="flex flex-col gap-2">
            <motion.button whileTap={{ scale: 0.97 }} disabled={updating}
              onClick={() => setStatus('completed')}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-green-600 text-base font-bold text-white disabled:opacity-60">
              <CheckCircle2 size={20} /> Marcar completado
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }} disabled={updating}
              onClick={() => setStatus('on_hold')}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--surface)] text-sm font-semibold text-[var(--text-secondary)] disabled:opacity-60">
              <PauseCircle size={16} /> Pausar
            </motion.button>
          </div>
        )}
        {job.status === 'on_hold' && (
          <motion.button whileTap={{ scale: 0.97 }} disabled={updating}
            onClick={() => setStatus('in_progress')}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 text-base font-bold text-white disabled:opacity-60">
            <PlayCircle size={20} /> Reanudar trabajo
          </motion.button>
        )}
        {job.status === 'completed' && (
          <div className="flex items-center gap-3 rounded-2xl bg-green-50 px-4 py-4">
            <CheckCircle2 size={24} className="text-green-600 shrink-0" />
            <p className="text-base font-bold text-green-700">¡Trabajo completado!</p>
          </div>
        )}

        {/* Clock In / Out */}
        <div className="rounded-2xl bg-[var(--surface)] p-4 flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Tiempo trabajado</p>
          {activeEntry ? (
            <>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50">
                  <Clock size={18} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-[var(--text-tertiary)]">En progreso</p>
                  <p className="text-2xl font-black tabular-nums [font-family:var(--font-display)] text-amber-600">{fmtElapsed(elapsed)}</p>
                </div>
              </div>
              <textarea
                value={clockNotes}
                onChange={e => setClockNotes(e.target.value)}
                rows={2}
                placeholder="Nota opcional (qué hiciste, materiales usados...)"
                className="w-full rounded-xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] resize-none"
              />
              <motion.button whileTap={{ scale: 0.97 }} disabled={clocking}
                onClick={handleClockOut}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 text-sm font-bold text-white disabled:opacity-60">
                <Clock size={16} /> {clocking ? 'Guardando…' : 'Fichar Salida'}
              </motion.button>
            </>
          ) : (
            <>
              {clockError && <p className="text-xs text-red-600">{clockError}</p>}
              <motion.button whileTap={{ scale: 0.97 }} disabled={clocking}
                onClick={handleClockIn}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] text-sm font-bold text-[var(--accent)] disabled:opacity-60">
                <Clock size={16} /> {clocking ? '…' : 'Fichar Entrada'}
              </motion.button>
            </>
          )}
        </div>

        {/* Photos by phase */}
        <div className="flex flex-col gap-5">
          {PHASES.map(({ key, label, emoji }) => {
            const phasePhotos = photos.filter(p => p.phase === key)
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-[var(--text-primary)]">{emoji} Fotos {label}</p>
                  <motion.button whileTap={{ scale: 0.95 }}
                    onClick={() => openCamera(key)}
                    disabled={uploadingPhase !== null}
                    className="flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60">
                    {uploadingPhase === key ? '…' : <><Camera size={12} /> Foto</>}
                  </motion.button>
                </div>
                {phasePhotos.length === 0 ? (
                  <button onClick={() => openCamera(key)}
                    className="flex h-24 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] text-xs text-[var(--text-tertiary)]">
                    <Camera size={16} /> Agregar foto {label.toLowerCase()}
                  </button>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {phasePhotos.map(photo => (
                      <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden bg-[var(--surface)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photo.url} alt="" className="h-full w-full object-cover" />
                        <button onClick={() => handleDeletePhoto(photo.id)} disabled={deleting}
                          className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => openCamera(key)}
                      className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] text-[var(--text-tertiary)]">
                      <Plus size={20} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Complete confirmation sheet */}
      <AnimatePresence>
        {showComplete && (
          <div className="fixed inset-0 z-50 flex items-end bg-black/40">
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={spring}
              className="w-full rounded-t-3xl bg-[var(--bg)] p-6 flex flex-col gap-4">
              <div className="mx-auto mb-1 h-1 w-10 rounded-full bg-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)]" />
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-[var(--text-primary)]">¿Trabajo terminado?</p>
                <button onClick={() => setShowComplete(false)}><X size={20} color="var(--text-tertiary)" /></button>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                Asegúrate de haber tomado las fotos de <strong>después</strong> antes de marcar el trabajo como completado.
              </p>
              <motion.button whileTap={{ scale: 0.97 }} disabled={updating}
                onClick={handleComplete}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-green-600 text-base font-bold text-white disabled:opacity-60">
                <CheckCircle2 size={20} /> {updating ? 'Guardando…' : 'Sí, marcar completado'}
              </motion.button>
              <button onClick={() => setShowComplete(false)}
                className="flex h-12 w-full items-center justify-center rounded-2xl bg-[var(--surface)] text-sm font-semibold text-[var(--text-secondary)]">
                Cancelar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
