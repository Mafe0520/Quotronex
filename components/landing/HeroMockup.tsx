'use client';

import { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'motion/react';
import { Paintbrush, Wrench, Zap, CheckCircle2, Send, FileSignature, Mic } from 'lucide-react';

type QuoteTab = 'painting' | 'plumbing' | 'electric';
type Phase = 'dictating' | 'ready';

interface LineItem { desc: string; qty: number; unit: string; price: number }

const QUOTES: Record<QuoteTab, { client: string; items: LineItem[] }> = {
  painting: {
    client: 'Carlos M. — 4821 Oak St, Miami FL',
    items: [
      { desc: 'Pintura interior — 3 cuartos', qty: 1, unit: 'trabajo', price: 1200 },
      { desc: 'Mano de obra (8h × $65)',       qty: 8, unit: 'h',       price:  520 },
      { desc: 'Materiales y pintura',           qty: 1, unit: 'kit',     price:  380 },
    ],
  },
  plumbing: {
    client: 'Ana R. — 992 Brickell Ave, Miami FL',
    items: [
      { desc: 'Cambio de tubería principal', qty: 1, unit: 'trabajo', price: 850 },
      { desc: 'Mano de obra (5h × $75)',     qty: 5, unit: 'h',       price: 375 },
      { desc: 'Materiales PVC y accesorios', qty: 1, unit: 'kit',     price: 195 },
    ],
  },
  electric: {
    client: 'Mike T. — 1340 NW 7th Ave, Miami FL',
    items: [
      { desc: 'Panel eléctrico 200A',        qty: 1,  unit: 'unidad', price: 2100 },
      { desc: 'Instalación (12h × $90)',     qty: 12, unit: 'h',      price: 1080 },
      { desc: 'Cable + breakers + cajillas', qty: 1,  unit: 'kit',    price:  420 },
    ],
  },
};

const DICTATION: Record<QuoteTab, string> = {
  painting: 'Pintura interior tres cuartos, mano de obra ocho horas, materiales y pintura...',
  plumbing: 'Cambio tubería principal, cinco horas mano de obra setenta y cinco, materiales PVC...',
  electric: 'Panel eléctrico doscientos amperios, instalación doce horas noventa, cable y breakers...',
};

const TABS: { id: QuoteTab; label: string; icon: React.ElementType }[] = [
  { id: 'painting', label: 'Pintura',  icon: Paintbrush },
  { id: 'plumbing', label: 'Plomería', icon: Wrench     },
  { id: 'electric', label: 'Eléctrico',icon: Zap        },
];

const T = { duration: 0.22, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden:   { opacity: 0, x: 10 },
  visible:  { opacity: 1, x: 0, transition: { duration: 0.24, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] } },
};

function AnimatedAmount({ target }: { target: number }) {
  const mv      = useMotionValue(0);
  const display = useTransform(mv, v => `$${Math.round(v).toLocaleString()}`);

  useEffect(() => {
    const ctrl = animate(mv, target, { duration: 0.75, ease: 'easeOut' });
    return () => ctrl.stop();
  }, [mv, target]);

  return (
    <motion.span className="tabular-nums [font-family:var(--font-display)] text-[var(--accent)]">
      {display}
    </motion.span>
  );
}

export function HeroMockup() {
  const [active, setActive] = useState<QuoteTab>('painting');
  const [phase,  setPhase]  = useState<Phase>('dictating');
  const [typed,  setTyped]  = useState('');

  const quote = QUOTES[active];
  const total = quote.items.reduce((s, i) => s + i.price, 0);

  // Dictation → reveal animation, restarts on tab change
  useEffect(() => {
    setPhase('dictating');
    setTyped('');

    const text = DICTATION[active];
    let i = 0;
    let revealTimeout: ReturnType<typeof setTimeout>;

    const interval = setInterval(() => {
      i++;
      setTyped(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        revealTimeout = setTimeout(() => setPhase('ready'), 380);
      }
    }, 32);

    return () => {
      clearInterval(interval);
      clearTimeout(revealTimeout);
    };
  }, [active]);

  return (
    <div
      className="w-full overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface)] shadow-[var(--shadow-2)]"
      style={{ backdropFilter: 'blur(12px)' }}
    >
      {/* Barra de título */}
      <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-3">
        <span className="size-3 rounded-full bg-[color-mix(in_oklab,#FF5F57_85%,transparent)]" />
        <span className="size-3 rounded-full bg-[color-mix(in_oklab,#FFBD2E_85%,transparent)]" />
        <span className="size-3 rounded-full bg-[color-mix(in_oklab,#28CA41_85%,transparent)]" />
        <span className="ml-3 text-xs font-medium text-[var(--text-tertiary)]">
          Quotronex · Cotización #Q-0142
        </span>
        <span className="ml-auto inline-flex items-center gap-1 rounded-lg bg-[color-mix(in_oklab,var(--accent)_15%,transparent)] px-2.5 py-1 text-xs font-bold text-[var(--accent)]">
          <CheckCircle2 className="size-3" strokeWidth={2.5} />
          Lista para enviar
        </span>
      </div>

      <div className="p-5">
        {/* Tabs */}
        <div className="mb-4 flex gap-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActive(id)}
              className={[
                'flex items-center gap-1.5 rounded-[var(--radius-button)] px-3 py-1.5 text-xs font-semibold [touch-action:manipulation] [transition-property:background-color,color,box-shadow] duration-150',
                active === id
                  ? 'bg-[var(--accent)] text-[var(--bg)] [box-shadow:var(--shadow-cta)]'
                  : 'bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[color-mix(in_oklab,var(--surface-2)_80%,var(--accent)_20%)]',
              ].join(' ')}
            >
              <Icon className="size-3" strokeWidth={2.5} />
              {label}
            </button>
          ))}
        </div>

        {/* ── Fase dictado ── */}
        <AnimatePresence>
          {phase === 'dictating' && (
            <motion.div
              key="dictation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              transition={{ duration: 0.18 }}
            >
              {/* Mic pulsando */}
              <div className="mb-3 flex items-center gap-2">
                <motion.div
                  animate={{ scale: [1, 1.18, 1], opacity: [0.65, 1, 0.65] }}
                  transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut' }}
                  className="flex size-7 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--accent)_14%,transparent)]"
                >
                  <Mic className="size-3.5 text-[var(--accent)]" strokeWidth={2.5} />
                </motion.div>
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                  Dictando...
                </span>
              </div>

              {/* Texto con cursor parpadeante */}
              <div className="min-h-16 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-3 font-mono text-sm text-[var(--text-secondary)]">
                {typed}
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ repeat: Infinity, duration: 0.55, ease: 'linear' }}
                  className="ml-0.5 inline-block h-4 w-0.5 align-middle bg-[var(--accent)]"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Fase cotización (aparece tras el dictado) ── */}
        <AnimatePresence>
          {phase === 'ready' && (
            <motion.div
              key="quote"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={T}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={T}
                >
                  {/* Cliente */}
                  <div className="mb-4 flex items-center gap-2 rounded-[var(--radius-button)] bg-[color-mix(in_oklab,var(--accent)_8%,transparent)] px-3 py-2">
                    <CheckCircle2 className="size-4 shrink-0 text-[var(--accent)]" strokeWidth={2} />
                    <span className="text-xs font-medium text-[var(--text-secondary)]">
                      {quote.client}
                    </span>
                  </div>

                  {/* Tabla */}
                  <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)]">
                    <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Servicio</span>
                      <span className="pr-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">$</span>
                    </div>

                    {/* Filas con stagger */}
                    <motion.div
                      key={active}
                      initial="hidden"
                      animate="visible"
                      variants={containerVariants}
                    >
                      {quote.items.map((item, i) => (
                        <motion.div
                          key={`${active}-${i}`}
                          variants={itemVariants}
                          className={[
                            'grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-3 text-sm',
                            i < quote.items.length - 1 ? 'border-b border-[var(--border-subtle)]' : '',
                          ].join(' ')}
                        >
                          <div>
                            <span className="text-[var(--text-primary)]">{item.desc}</span>
                            <span className="ml-2 text-xs text-[var(--text-tertiary)]">× {item.qty}</span>
                          </div>
                          <span className="tabular-nums font-semibold text-[var(--accent)]">
                            ${item.price.toLocaleString()}
                          </span>
                        </motion.div>
                      ))}
                    </motion.div>

                    {/* Total — cuenta de $0 al monto */}
                    <div className="flex items-center justify-between border-t-2 border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-3">
                      <span className="text-sm font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">
                        Total
                      </span>
                      <span className="text-xl font-black [font-family:var(--font-display)]">
                        <AnimatedAmount target={total} />
                      </span>
                    </div>
                  </div>

                  {/* Botones */}
                  <div className="mt-4 flex gap-3">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      className="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] py-2.5 text-sm font-bold text-[var(--bg)] [box-shadow:var(--shadow-cta)] [touch-action:manipulation]"
                    >
                      <Send className="size-4" strokeWidth={2.5} />
                      Enviar por WhatsApp
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center justify-center gap-1.5 rounded-[var(--radius-button)] border border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] [touch-action:manipulation]"
                    >
                      <FileSignature className="size-4" strokeWidth={2} />
                      Ver firma
                    </motion.button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
