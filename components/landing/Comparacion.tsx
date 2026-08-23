'use client';

import { motion } from 'motion/react';
import { XCircle, CheckCircle2 } from 'lucide-react';
import { SectionShell, Kicker, useReveal, VIEWPORT_ONCE } from './ui';
import { MarkedCopy } from './MarkedCopy';

interface ComparacionProps {
  kicker:      string;
  titulo:      string;
  subtitulo:   string;
  columnaAntiguo: { titulo: string; items: string[] };
  columnaQuotronex: { titulo: string; items: string[] };
}

export function Comparacion({
  kicker,
  titulo,
  subtitulo,
  columnaAntiguo,
  columnaQuotronex,
}: ComparacionProps) {
  const { contenedor, item } = useReveal(0.07);

  return (
    <SectionShell elevacion="base">
      <motion.div
        variants={contenedor}
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT_ONCE}
        className="flex flex-col items-center text-center gap-4 mb-10"
      >
        <motion.div variants={item}>
          <Kicker>{kicker}</Kicker>
        </motion.div>
        <motion.h2
          variants={item}
          className="text-3xl font-black tracking-tight text-[var(--text-primary)] leading-[1.08] max-w-2xl"
          style={{ textWrap: 'balance' } as React.CSSProperties}
        >
          {titulo}
        </motion.h2>
        <motion.p variants={item} className="text-[var(--text-secondary)] max-w-xl text-base leading-relaxed">
          {subtitulo}
        </motion.p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Columna ANTIGUO */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT_ONCE}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--error)_25%,transparent)] bg-[color-mix(in_oklab,var(--error)_6%,var(--surface))] p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <span className="inline-flex size-7 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--error)_15%,transparent)]">
              <XCircle className="size-4 text-[var(--error)]" strokeWidth={2} />
            </span>
            <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--error)]">
              {columnaAntiguo.titulo}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {columnaAntiguo.items.map((texto, i) => (
              <div key={i} className="flex items-start gap-3">
                <span
                  className="mt-0.5 text-sm font-bold shrink-0 leading-none text-[var(--error)]"
                  aria-hidden
                >×</span>
                <span className="text-sm text-[var(--text-secondary)] leading-snug">{texto}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Columna QUOTRONEX */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT_ONCE}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--accent)_25%,transparent)] bg-[color-mix(in_oklab,var(--accent)_6%,var(--surface))] p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <span className="inline-flex size-7 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--accent)_15%,transparent)]">
              <CheckCircle2 className="size-4 text-[var(--accent)]" strokeWidth={2} />
            </span>
            <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--accent)]">
              {columnaQuotronex.titulo}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {columnaQuotronex.items.map((texto, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2
                  className="size-4 shrink-0 mt-0.5 text-[var(--accent)]"
                  strokeWidth={2.5}
                  aria-hidden
                />
                <span className="text-sm text-[var(--text-secondary)] leading-snug">{texto}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </SectionShell>
  );
}
