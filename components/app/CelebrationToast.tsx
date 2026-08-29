'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'

/* ─── Types ──────────────────────────────────────────────────────────────── */
type CelebrateFn = (message: string, sub?: string) => void

const CelebrationContext = createContext<CelebrateFn>(() => {})

export function useCelebration() {
  return useContext(CelebrationContext)
}

/* ─── Confetti particle ───────────────────────────────────────────────────── */
const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#f43f5e', '#3b82f6', '#a855f7', '#ec4899']

function Particle({ style }: { style: React.CSSProperties }) {
  return <span className="absolute bottom-0 rounded-full" style={{ width: 8, height: 8, ...style }} />
}

function Confetti() {
  const particles = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    color: COLORS[i % COLORS.length],
    left: `${8 + Math.random() * 84}%`,
    delay: Math.random() * 0.4,
    duration: 0.7 + Math.random() * 0.6,
    dx: (Math.random() - 0.5) * 80,
    dy: -(60 + Math.random() * 80),
  }))

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden" style={{ height: 120 }}>
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute bottom-0 rounded-full"
          style={{ width: 7, height: 7, left: p.left, backgroundColor: p.color }}
          initial={{ y: 0, x: 0, opacity: 1, scale: 1 }}
          animate={{ y: p.dy, x: p.dx, opacity: 0, scale: 0.4 }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

/* ─── Toast UI ────────────────────────────────────────────────────────────── */
function Toast({ message, sub, onDone }: { message: string; sub?: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3800)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <motion.div
      initial={{ y: 80, opacity: 0, scale: 0.9 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 60, opacity: 0, scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      className="relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl shadow-2xl"
      style={{ background: 'var(--surface)', border: '1px solid color-mix(in oklab, var(--accent) 20%, transparent)' }}
    >
      <Confetti />
      <div className="relative flex items-center gap-3 px-5 py-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 22, delay: 0.12 }}
          className="flex size-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: 'color-mix(in oklab, var(--accent) 15%, transparent)' }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <motion.path
              d="M4 10.5l4 4 8-8"
              stroke="var(--accent)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
            />
          </svg>
        </motion.div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[var(--text-primary)]">{message}</p>
          {sub && <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{sub}</p>}
        </div>
        <button onClick={onDone} className="shrink-0 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      {/* Progress bar */}
      <motion.div
        className="absolute bottom-0 left-0 h-0.5"
        style={{ background: 'var(--accent)' }}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: 3.8, ease: 'linear' }}
      />
    </motion.div>
  )
}

/* ─── Provider ────────────────────────────────────────────────────────────── */
export function CelebrationProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<{ id: number; message: string; sub?: string }[]>([])
  const counter = useRef(0)

  const celebrate: CelebrateFn = useCallback((message, sub) => {
    const id = ++counter.current
    setQueue((q) => [...q, { id, message, sub }])
  }, [])

  function dismiss(id: number) {
    setQueue((q) => q.filter((t) => t.id !== id))
  }

  return (
    <CelebrationContext.Provider value={celebrate}>
      {children}
      <div className="pointer-events-none fixed bottom-24 left-0 right-0 z-[9999] flex flex-col items-center gap-2 px-4 md:bottom-8">
        <AnimatePresence mode="popLayout">
          {queue.map((t) => (
            <div key={t.id} className="pointer-events-auto w-full max-w-sm">
              <Toast message={t.message} sub={t.sub} onDone={() => dismiss(t.id)} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </CelebrationContext.Provider>
  )
}
