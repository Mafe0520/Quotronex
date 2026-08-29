'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X } from 'lucide-react'
import { submitSatisfactionRating } from '@/app/actions/satisfaction'

// ─── Config ───────────────────────────────────────────────────────────────────
const MIN_DAYS_BEFORE_SHOW = 7     // days since first app use
const COOLDOWN_DAYS        = 30    // days between surveys
const SHOW_DELAY_MS        = 18000 // 18 s after mounting
const LS_FIRST_SEEN = 'qx-first-seen'
const LS_SURVEY_LAST = 'qx-survey-last'

// ─── Emoji scale ──────────────────────────────────────────────────────────────
const FACES = [
  { emoji: '😢', label: 'Muy insatisfecho', color: '#ef4444' },
  { emoji: '😕', label: 'Insatisfecho',     color: '#f97316' },
  { emoji: '😐', label: 'Neutral',          color: '#f59e0b' },
  { emoji: '🙂', label: 'Satisfecho',       color: '#84cc16' },
  { emoji: '😄', label: 'Muy satisfecho',   color: '#22c55e' },
]

export function SatisfactionSurvey({ businessId }: { businessId: string | null }) {
  const [visible, setVisible]   = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const [thanked, setThanked]   = useState(false)
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    try {
      // Track first-seen date
      if (!localStorage.getItem(LS_FIRST_SEEN)) {
        localStorage.setItem(LS_FIRST_SEEN, String(Date.now()))
      }

      const firstSeen = parseInt(localStorage.getItem(LS_FIRST_SEEN) ?? '0', 10)
      const lastSurvey = parseInt(localStorage.getItem(LS_SURVEY_LAST) ?? '0', 10)
      const now = Date.now()
      const daysSinceFirst = (now - firstSeen) / 86_400_000
      const daysSinceLast  = lastSurvey ? (now - lastSurvey) / 86_400_000 : Infinity

      if (daysSinceFirst < MIN_DAYS_BEFORE_SHOW) return
      if (daysSinceLast  < COOLDOWN_DAYS)         return
    } catch { return }

    const t = setTimeout(() => setVisible(true), SHOW_DELAY_MS)
    return () => clearTimeout(t)
  }, [])

  function dismiss() {
    try { localStorage.setItem(LS_SURVEY_LAST, String(Date.now())) } catch { /* */ }
    setVisible(false)
  }

  async function handleSelect(rating: number) {
    setSelected(rating)
    setSaving(true)
    await submitSatisfactionRating(rating, businessId)
    setSaving(false)
    try { localStorage.setItem(LS_SURVEY_LAST, String(Date.now())) } catch { /* */ }
    setThanked(true)
    setTimeout(dismiss, 2200)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 40, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 32, opacity: 0, scale: 0.94 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          className="fixed bottom-24 left-1/2 z-[9998] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 md:bottom-10"
          role="dialog"
          aria-modal="true"
          aria-label="Encuesta de satisfacción"
        >
          <div className="relative overflow-hidden rounded-2xl shadow-2xl"
            style={{ background: 'var(--surface)', border: '1px solid color-mix(in oklab, var(--text-tertiary) 12%, transparent)' }}>

            {/* Close */}
            <button
              onClick={dismiss}
              className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X size={15} />
            </button>

            <AnimatePresence mode="wait">
              {!thanked ? (
                <motion.div key="survey" initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-5 pb-5 pt-5">
                  <p className="pr-6 text-sm font-bold text-[var(--text-primary)] leading-snug">
                    ¿Qué tan feliz estás usando Quotronex?
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">Tu opinión nos ayuda a mejorar</p>

                  {/* Emoji row */}
                  <div className="mt-4 flex items-end justify-between gap-1">
                    {FACES.map((f, i) => {
                      const val = i + 1
                      const isSelected = selected === val
                      return (
                        <button
                          key={val}
                          onClick={() => !saving && !selected && handleSelect(val)}
                          disabled={saving || !!selected}
                          title={f.label}
                          className="flex flex-1 flex-col items-center gap-1.5 rounded-xl py-2 transition-all disabled:pointer-events-none"
                          style={{
                            background: isSelected
                              ? `${f.color}18`
                              : 'transparent',
                          }}
                        >
                          <motion.span
                            className="text-3xl leading-none select-none"
                            animate={isSelected ? { scale: [1, 1.35, 1.2] } : { scale: selected ? 0.72 : 1 }}
                            transition={{ duration: 0.35, type: 'spring', stiffness: 400, damping: 20 }}
                            style={{ filter: selected && !isSelected ? 'grayscale(0.7) opacity(0.45)' : 'none' }}
                          >
                            {f.emoji}
                          </motion.span>
                          <span
                            className="text-[9px] font-semibold leading-none"
                            style={{ color: isSelected ? f.color : 'var(--text-tertiary)' }}
                          >
                            {val}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Labels */}
                  <div className="mt-1 flex justify-between px-1">
                    <span className="text-[10px] text-[var(--text-tertiary)]">Muy mal</span>
                    <span className="text-[10px] text-[var(--text-tertiary)]">Excelente</span>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="thanks"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-2 px-5 py-6 text-center"
                >
                  <span className="text-4xl">{selected ? FACES[selected - 1].emoji : '🙏'}</span>
                  <p className="text-sm font-bold text-[var(--text-primary)]">¡Gracias por tu respuesta!</p>
                  <p className="text-xs text-[var(--text-tertiary)]">Tu opinión hace que Quotronex mejore cada día 💙</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
