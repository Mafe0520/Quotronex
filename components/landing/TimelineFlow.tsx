'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText, Send, PenLine, CreditCard,
  CheckCircle2, Clock, Smartphone, Banknote,
} from 'lucide-react';
import { SectionShell, Kicker, useReveal, VIEWPORT_ONCE } from './ui';
import { MarkedCopy } from './MarkedCopy';

interface Step {
  id:        string;
  icon?:     React.ElementType;
  label:     string;
  badge:     string;
  card: {
    titulo:  string;
    detalle: string;
    meta:    string;
    iconCard?: React.ElementType;
  };
}

const STEP_ICONS: React.ElementType[] = [FileText, Send, PenLine, CreditCard];
const CARD_ICONS: React.ElementType[] = [FileText, Smartphone, PenLine, Banknote];

interface TimelineFlowProps {
  kicker:    string;
  titulo:    string;
  subtitulo: string;
  steps:     Step[];
}

const SPRING = { type: 'spring' as const, stiffness: 380, damping: 30, mass: 0.6 };
const EASE   = { duration: 0.25, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] };

export function TimelineFlow({ kicker, titulo, subtitulo, steps }: TimelineFlowProps) {
  const [active, setActive] = useState(0);
  const { contenedor, item } = useReveal(0.07);

  const current = steps[active];

  return (
    <SectionShell elevacion="base">
      {/* Header */}
      <motion.div
        variants={contenedor}
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT_ONCE}
        className="flex flex-col items-center text-center gap-3 mb-12"
      >
        <motion.div variants={item}>
          <Kicker>{kicker}</Kicker>
        </motion.div>
        <motion.h2
          variants={item}
          className="text-3xl font-black tracking-tight text-[var(--text-primary)] leading-[1.08] max-w-2xl"
          style={{ textWrap: 'balance' } as React.CSSProperties}
        >
          <MarkedCopy text={titulo} />
        </motion.h2>
        <motion.p variants={item} className="text-[var(--text-secondary)] max-w-xl text-base leading-relaxed">
          {subtitulo}
        </motion.p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={VIEWPORT_ONCE}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-3xl"
      >
        {/* Pasos — stepper horizontal */}
        <div className="flex items-center gap-0 mb-8">
          {steps.map((step, i) => {
            const Icon = step.icon ?? STEP_ICONS[i] ?? FileText;
            const isActive   = i === active;
            const isComplete = i < active;
            return (
              <div key={step.id} className="flex flex-1 items-center">
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  className="flex flex-col items-center gap-2 [touch-action:manipulation] group"
                >
                  <motion.div
                    animate={
                      isActive
                        ? { backgroundColor: 'var(--accent)', scale: 1.12 }
                        : isComplete
                        ? { backgroundColor: 'color-mix(in oklab, var(--accent) 20%, transparent)', scale: 1 }
                        : { backgroundColor: 'var(--surface-2)', scale: 1 }
                    }
                    transition={SPRING}
                    className="relative flex size-12 items-center justify-center rounded-full border"
                    style={{
                      borderColor: isActive
                        ? 'var(--accent)'
                        : isComplete
                        ? 'color-mix(in oklab, var(--accent) 40%, transparent)'
                        : 'var(--border-subtle)',
                    }}
                  >
                    {/* Flash esmeralda al activar */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.span
                          key="flash"
                          initial={{ opacity: 0.5, scale: 0.8 }}
                          animate={{ opacity: 0, scale: 2.2 }}
                          transition={{ duration: 0.55, ease: 'easeOut' }}
                          className="absolute inset-0 rounded-full bg-[var(--accent)]"
                        />
                      )}
                    </AnimatePresence>
                    <Icon
                      className="relative size-5"
                      strokeWidth={2}
                      style={{ color: isActive || isComplete ? 'var(--accent)' : 'var(--text-tertiary)' }}
                    />
                  </motion.div>
                  <span
                    className="text-xs font-semibold transition-colors duration-150 hidden sm:block"
                    style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
                  >
                    {step.label}
                  </span>
                </button>

                {/* Conector entre pasos */}
                {i < steps.length - 1 && (
                  <div className="relative flex-1 mx-2 h-px bg-[var(--border-subtle)]">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-[var(--accent)]"
                      animate={{ width: i < active ? '100%' : '0%' }}
                      transition={{ duration: 0.35, ease: 'easeInOut' }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Card central con AnimatePresence */}
        <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-2)]">
          {/* Badge de paso */}
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-6 py-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
              Paso {active + 1} de {steps.length}
            </span>
            <motion.span
              key={current.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={EASE}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-button)] bg-[color-mix(in_oklab,var(--accent)_14%,transparent)] px-3 py-1 text-xs font-bold text-[var(--accent)]"
            >
              <CheckCircle2 className="size-3" strokeWidth={2.5} />
              {current.badge}
            </motion.span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0,  scale: 1    }}
              exit={{    opacity: 0, y: -8, scale: 0.98  }}
              transition={EASE}
              className="flex flex-col sm:flex-row items-center gap-6 p-6 sm:p-8"
            >
              {/* Icono card — grande */}
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1,   opacity: 1 }}
                transition={{ ...SPRING, delay: 0.06 }}
                className="shrink-0 flex size-16 items-center justify-center rounded-2xl bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] border border-[color-mix(in_oklab,var(--accent)_25%,transparent)]"
              >
                {(() => {
                  const CardIcon = current.card.iconCard ?? CARD_ICONS[active] ?? FileText;
                  return <CardIcon className="size-8 text-[var(--accent)]" strokeWidth={1.5} />;
                })()}
              </motion.div>

              {/* Texto */}
              <div className="flex flex-col gap-2 text-center sm:text-left">
                <motion.h3
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...EASE, delay: 0.05 }}
                  className="text-xl font-black text-[var(--text-primary)] [font-family:var(--font-display)]"
                >
                  {current.card.titulo}
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...EASE, delay: 0.09 }}
                  className="text-base text-[var(--text-secondary)] leading-relaxed"
                >
                  {current.card.detalle}
                </motion.p>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ ...EASE, delay: 0.14 }}
                  className="text-xs font-semibold text-[var(--text-tertiary)]"
                >
                  {current.card.meta}
                </motion.span>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navegación siguiente */}
          {active < steps.length - 1 && (
            <div className="flex justify-end border-t border-[var(--border-subtle)] px-6 py-3">
              <motion.button
                type="button"
                onClick={() => setActive(prev => Math.min(prev + 1, steps.length - 1))}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] px-4 py-2 text-sm font-bold text-[var(--bg)] [touch-action:manipulation]"
              >
                Siguiente paso →
              </motion.button>
            </div>
          )}
          {active === steps.length - 1 && (
            <div className="flex justify-end border-t border-[var(--border-subtle)] px-6 py-3">
              <motion.button
                type="button"
                onClick={() => setActive(0)}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-2 rounded-[var(--radius-button)] border border-[var(--border-subtle)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] [touch-action:manipulation]"
              >
                ↩ Ver desde el inicio
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    </SectionShell>
  );
}

// ── Exports de datos para page.tsx ────────────────────────────────────────────
export type { Step as TimelineStep };
export { FileText, Send, PenLine, CreditCard, CheckCircle2, Clock, Smartphone, Banknote };
