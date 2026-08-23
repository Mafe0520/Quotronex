'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'motion/react';
import {
  Paintbrush, Wrench, Zap, Flame, Hammer,
  ChevronRight, ChevronLeft, Mic, FileText, CheckCircle2, Lock,
} from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { saveQuoteAndRedirect } from '@/app/actions/quotes';

// ── Tipos ──────────────────────────────────────────────────────────────────
type Trade = { id: string; label: string; icon: React.ElementType; placeholder: string; suggestions: string[] };
type Step  = 'trade' | 'pricebook' | 'describe' | 'loading' | 'preview';

const TRADES: Trade[] = [
  { id: 'painting', label: 'Pintura',             icon: Paintbrush, placeholder: 'ej. Pintura interior, 3 cuartos', suggestions: ['Pintura interior', 'Pintura de exteriores', 'Pintura de techo']          },
  { id: 'plumbing', label: 'Plomería',             icon: Wrench,     placeholder: 'ej. Cambio de tubería',          suggestions: ['Cambio de tubería', 'Reparación de fuga', 'Instalación de lavabo']        },
  { id: 'electric', label: 'Electricidad',         icon: Zap,        placeholder: 'ej. Panel eléctrico 200A',       suggestions: ['Panel eléctrico 200A', 'Instalación de tomacorrientes', 'Cableado nuevo']  },
  { id: 'hvac',     label: 'Climatización / HVAC', icon: Flame,      placeholder: 'ej. Instalación de A/C',        suggestions: ['Instalación de A/C', 'Mantenimiento de HVAC', 'Cambio de filtros y ductos'] },
  { id: 'remodel',  label: 'Remodelación',         icon: Hammer,     placeholder: 'ej. Remodelación de cocina',     suggestions: ['Remodelación de cocina', 'Remodelación de baño', 'Cambio de pisos']          },
];

const STEPS: Step[]     = ['trade', 'pricebook', 'describe', 'loading', 'preview'];
const BAR_STEPS: Step[] = ['trade', 'pricebook', 'describe'];
const T = { duration: 0.26, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] };

// ── Progress dots ─────────────────────────────────────────────────────────
function ProgressDots({ step }: { step: Step }) {
  const idx = BAR_STEPS.indexOf(step as typeof BAR_STEPS[number]);
  if (idx < 0) return null;
  return (
    <div className="flex items-center justify-center gap-2 py-3">
      {BAR_STEPS.map((_, i) => (
        <motion.div
          key={i}
          animate={
            i < idx  ? { width: 20, backgroundColor: 'color-mix(in oklab, var(--accent) 50%, transparent)' } :
            i === idx ? { width: 28, backgroundColor: 'var(--accent)' } :
                        { width: 8,  backgroundColor: 'var(--surface-2)' }
          }
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="h-2 rounded-full"
        />
      ))}
      <span className="ml-2 text-xs font-semibold text-[var(--text-tertiary)] tabular-nums">
        {idx + 1}/3
      </span>
    </div>
  );
}

// ── Trade badge compacto ───────────────────────────────────────────────────
function TradeBadge({ trade }: { trade: Trade }) {
  const Icon = trade.icon;
  return (
    <div className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] border border-[color-mix(in_oklab,var(--accent)_20%,transparent)] px-3 py-1">
      <Icon size={12} color="var(--accent)" strokeWidth={2} />
      <span className="text-xs font-semibold text-[var(--accent)]">{trade.label}</span>
    </div>
  );
}

// ── Animated total ─────────────────────────────────────────────────────────
function AnimatedTotal({ target, reduce }: { target: number; reduce: boolean }) {
  const mv      = useMotionValue(0);
  const rounded = useTransform(mv, v => `$${Math.round(v).toLocaleString()}`);
  useEffect(() => {
    if (reduce) { mv.set(target); return; }
    const ctrl = animate(mv, target, { duration: 0.8, ease: 'easeOut' });
    return () => ctrl.stop();
  }, [mv, target, reduce]);
  return <motion.span className="text-xl font-bold tabular-nums text-[var(--accent)]">{rounded}</motion.span>;
}

// ── STEP 1: Trade ─────────────────────────────────────────────────────────
function StepTrade({ onNext }: { onNext: (t: Trade) => void }) {
  const [selected, setSelected] = useState<string | null>(null);

  const listVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
  };
  const itemVariants = {
    hidden:  { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.32, 0.72, 0, 1] as [number,number,number,number] } },
  };

  return (
    <motion.div key="trade" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -24 }} transition={T}>
      <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)] leading-tight mb-2">
        ¿A qué te dedicas?
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Quotronex se configura con <strong className="text-[var(--text-primary)] font-semibold">tus precios reales</strong>, no con tarifas genéricas.
      </p>

      <motion.ul className="flex flex-col gap-3" variants={listVariants} initial="hidden" animate="visible">
        {TRADES.map((t) => {
          const Icon = t.icon;
          const isSelected = selected === t.id;
          return (
            <motion.li key={t.id} variants={itemVariants}>
              <motion.button
                whileTap={{ scale: 0.985 }}
                onClick={() => {
                  setSelected(t.id);
                  setTimeout(() => onNext(t), 160);
                }}
                className={[
                  'w-full rounded-[var(--radius-card)] border text-left flex items-center justify-between p-4 [touch-action:manipulation]',
                  isSelected
                    ? 'border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_6%,var(--surface))] shadow-[0_0_0_2px_var(--accent)]'
                    : 'border-[var(--border-subtle)] bg-[var(--surface)] hover:border-[color-mix(in_oklab,var(--text-primary)_30%,transparent)] shadow-sm',
                ].join(' ')}
              >
                <div className="flex items-center gap-3.5">
                  <div className={[
                    'size-11 rounded-xl flex items-center justify-center shrink-0',
                    isSelected ? 'bg-[var(--accent)]' : 'bg-[var(--surface-2)]',
                  ].join(' ')}>
                    <Icon className="size-5" strokeWidth={2.2} color={isSelected ? 'var(--bg)' : 'var(--accent)'} />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[var(--text-primary)]">{t.label}</div>
                    <div className="text-xs text-[var(--text-secondary)]">{t.suggestions[0]}, {t.suggestions[1]}</div>
                  </div>
                </div>
                <ChevronRight className={[
                  'size-4 shrink-0 transition-transform duration-150',
                  isSelected ? 'text-[var(--accent)] translate-x-1' : 'text-[var(--text-tertiary)]',
                ].join(' ')} />
              </motion.button>
            </motion.li>
          );
        })}
      </motion.ul>

      {/* Teaser — llena el espacio y refuerza el valor */}
      <div className="mt-6 flex items-center gap-3 rounded-xl bg-[color-mix(in_oklab,var(--accent)_6%,var(--surface))] border border-[color-mix(in_oklab,var(--accent)_15%,transparent)] px-4 py-3">
        <FileText className="size-5 shrink-0 text-[var(--accent)]" strokeWidth={1.5} />
        <p className="text-xs text-[var(--text-secondary)] leading-snug">
          En 2 minutos verás tu <strong className="text-[var(--text-primary)]">primera cotización real</strong> con tus propios precios — lista para enviar.
        </p>
      </div>
      <p className="mt-4 text-center text-xs text-[var(--text-tertiary)]">Puedes personalizar o agregar más oficios después</p>
    </motion.div>
  );
}

// ── STEP 2: Price Book ─────────────────────────────────────────────────────
function StepPricebook({
  trade, onNext,
}: { trade: Trade; onNext: (service: string, price: string) => void }) {
  const reduce = useReducedMotion() ?? false;
  const [service, setService] = useState('');
  const [price,   setPrice]   = useState('');
  const [tried,   setTried]   = useState(false);
  const valid = service.trim().length > 0 && parseFloat(price) > 0;

  return (
    <motion.div key="pricebook" initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={T}>
      <TradeBadge trade={trade} />
      <h1 className="text-2xl font-black leading-tight [font-family:var(--font-display)] text-[var(--text-primary)] mb-2">
        Tu primer precio
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Esto va a tu Price Book. Quotronex lo usa para generar cotizaciones exactas — no estimados genéricos.
      </p>

      <div className="flex flex-col gap-4">
        <motion.div
          className="flex flex-col gap-1.5"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.16,1,0.3,1], delay: reduce ? 0 : 0.06 }}
        >
          <label className="text-sm font-semibold text-[var(--text-primary)]">Nombre del servicio</label>
          <input
            type="text"
            value={service}
            onChange={e => setService(e.target.value)}
            placeholder={trade.placeholder}
            className="h-12 w-full rounded-[var(--radius-button)] border border-[var(--border-subtle)] bg-[var(--surface)] px-4 text-base text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_oklab,var(--accent)_20%,transparent)]"
          />
          <div className="flex gap-2 pt-1 flex-wrap">
            {trade.suggestions.slice(0, 2).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setService(s)}
                className="rounded-full border border-[color-mix(in_oklab,var(--accent)_30%,transparent)] bg-[color-mix(in_oklab,var(--accent)_8%,transparent)] px-3 py-1 text-xs font-medium text-[var(--accent)] [touch-action:manipulation]"
              >
                {s}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="flex flex-col gap-1.5"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.16,1,0.3,1], delay: reduce ? 0 : 0.12 }}
        >
          <label className="text-sm font-semibold text-[var(--text-primary)]">Precio típico</label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[var(--text-secondary)] text-base">$</span>
            <input
              type="number"
              inputMode="decimal"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="0"
              className="h-12 w-full rounded-[var(--radius-button)] border border-[var(--border-subtle)] bg-[var(--surface)] pl-8 pr-4 text-base text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_oklab,var(--accent)_20%,transparent)]"
            />
          </div>
          <p className="text-xs text-[var(--text-tertiary)]">Precio total del trabajo, no por hora. Puedes agregar más después.</p>
        </motion.div>
      </div>

      {/* Mini-preview dinámica */}
      <AnimatePresence>
        {(service.trim() || parseFloat(price) > 0) ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16,1,0.3,1] }}
            className="mt-5 flex items-center justify-between rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--accent)_25%,transparent)] bg-[color-mix(in_oklab,var(--accent)_6%,transparent)] px-4 py-3"
          >
            <span className="text-sm text-[var(--text-secondary)] truncate max-w-[60%]">
              {service.trim() || 'Tu servicio'}
            </span>
            <span className="text-sm font-bold tabular-nums text-[var(--accent)]">
              {parseFloat(price) > 0 ? `$${parseFloat(price).toLocaleString()}` : '—'}
            </span>
          </motion.div>
        ) : (
          <motion.div
            key="hint"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="mt-5 flex items-center gap-2.5 rounded-[var(--radius-button)] bg-[var(--surface-2)] px-4 py-3"
          >
            <CheckCircle2 className="size-4 shrink-0 text-[var(--text-tertiary)]" strokeWidth={2} />
            <span className="text-xs text-[var(--text-tertiary)]">Tu cotización se genera en menos de 10 segundos</span>
          </motion.div>
        )}
      </AnimatePresence>

      {tried && !valid && (
        <p className="mt-3 text-xs font-medium text-[var(--error)]">
          Ingresa el nombre del servicio y un precio para continuar
        </p>
      )}

      {/* CTA inline en el contenido (no sticky, step corto) */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => { if (!valid) { setTried(true); return; } onNext(service.trim(), price); }}
        className="mt-6 flex h-14 w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] text-base font-bold text-[var(--bg)] [box-shadow:var(--shadow-cta)] [touch-action:manipulation]"
      >
        Guardar precio →
      </motion.button>
    </motion.div>
  );
}

// ── STEP 3: Describe el trabajo ────────────────────────────────────────────
function StepDescribe({
  trade, onNext,
}: { trade: Trade; onNext: (desc: string) => void }) {
  const [desc,  setDesc]  = useState('');
  const [tried, setTried] = useState(false);
  const valid = desc.trim().length > 8;

  return (
    <motion.div key="describe" initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={T}>
      <TradeBadge trade={trade} />
      <h1 className="text-2xl font-black leading-tight [font-family:var(--font-display)] text-[var(--text-primary)] mb-2">
        Describe el trabajo
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Escribe lo que le harías al cliente. La IA genera la cotización usando tus precios.
      </p>

      <textarea
        value={desc}
        onChange={e => setDesc(e.target.value)}
        rows={5}
        placeholder={`Ej. Pintar sala y comedor, paredes solamente, aprox. 400 sq ft. Color blanco, 2 manos.`}
        className="w-full rounded-[var(--radius-button)] border border-[var(--border-subtle)] bg-[var(--surface)] px-4 py-3 text-base text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_oklab,var(--accent)_20%,transparent)] resize-none"
      />

      <div className="mt-3 flex items-center gap-3 rounded-xl bg-[color-mix(in_oklab,var(--accent)_5%,var(--surface))] border border-[color-mix(in_oklab,var(--accent)_12%,transparent)] px-4 py-3">
        <Mic className="size-4 shrink-0 text-[var(--accent)]" strokeWidth={2} />
        <span className="text-xs text-[var(--text-secondary)]">
          Dictado por voz disponible en la app — aquí escribe el trabajo.
        </span>
      </div>

      {tried && !valid && (
        <p className="mt-3 text-xs font-medium text-[var(--error)]">
          Escribe al menos una línea describiendo el trabajo
        </p>
      )}

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => { if (!valid) { setTried(true); return; } onNext(desc.trim()); }}
        className="mt-6 flex h-14 w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] text-base font-bold text-[var(--bg)] [box-shadow:var(--shadow-cta)] [touch-action:manipulation]"
      >
        Generar cotización →
      </motion.button>
    </motion.div>
  );
}

// ── STEP 4: Loading ────────────────────────────────────────────────────────
function StepLoading({ onDone }: { onDone: () => void }) {
  const msgs = [
    'Analizando tu descripción…',
    'Calculando con tus precios…',
    'Armando el PDF…',
    '¡Lista para enviar!',
  ];
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    let i = 0;
    const iv = setInterval(() => {
      i++;
      if (i < msgs.length) setMsgIdx(i);
      else { clearInterval(iv); setTimeout(onDone, 400); }
    }, 900);
    return () => clearInterval(iv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pct = ((msgIdx + 1) / msgs.length) * 100;

  return (
    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={T}
      className="flex flex-col items-center gap-8 py-16 text-center"
    >
      <div className="relative flex size-24 items-center justify-center">
        <svg viewBox="0 0 96 96" className="absolute inset-0" width="96" height="96">
          <circle cx="48" cy="48" r="40" fill="none" stroke="var(--surface-2)" strokeWidth="6" />
          <motion.circle
            cx="48" cy="48" r="40" fill="none"
            stroke="var(--accent)" strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 40}`}
            initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - pct / 100) }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            transform="rotate(-90 48 48)"
          />
        </svg>
        <FileText size={32} color="var(--accent)" />
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={msgIdx}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="text-base font-semibold text-[var(--text-primary)]"
        >
          {msgs[msgIdx]}
        </motion.p>
      </AnimatePresence>
    </motion.div>
  );
}

// ── STEP 5: Preview ────────────────────────────────────────────────────────
function StepPreview({
  trade, service, price, desc, onBack, onSave,
}: { trade: Trade; service: string; price: string; desc: string; onBack: () => void; onSave: () => Promise<void> }) {
  const reduce = useReducedMotion() ?? false;
  const [saving, setSaving] = useState(false);
  const [quoteNum] = useState(() => String(Math.floor(Math.random() * 900) + 100));
  const today = new Date().toLocaleDateString('es-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const total     = parseFloat(price) || 1200;
  const labor     = Math.round(total * 0.65);
  const materials = Math.round(total * 0.30);
  const misc      = total - labor - materials;

  return (
    <motion.div key="preview" initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={T}>
      <motion.div
        className="mb-4 flex items-center gap-2"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.05 }}
      >
        <CheckCircle2 size={20} color="var(--accent-2)" />
        <span className="text-sm font-semibold text-[var(--accent-2)]">¡Tu cotización está lista!</span>
      </motion.div>

      {/* Quote card */}
      <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface)] shadow-[var(--shadow-2)]">
        <div className="border-b border-[var(--border-subtle)] px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">COTIZACIÓN</p>
              <p className="text-lg font-bold [font-family:var(--font-display)] text-[var(--text-primary)]">#{quoteNum}</p>
            </div>
            <span className="rounded-full bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">BORRADOR</span>
          </div>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">{today}</p>
        </div>

        <div className="border-b border-[var(--border-subtle)] px-5 py-4">
          <p className="text-sm font-semibold text-[var(--text-primary)]">{service || 'Servicio de ' + trade.label}</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)] line-clamp-2">{desc}</p>
        </div>

        <div className="px-5 py-4 flex flex-col gap-2">
          {[
            { label: 'Mano de obra', amt: labor     },
            { label: 'Materiales',   amt: materials  },
            { label: 'Misceláneos',  amt: misc       },
          ].map(l => (
            <div key={l.label} className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">{l.label}</span>
              <span className="text-sm font-semibold tabular-nums text-[var(--text-primary)]">${l.amt.toLocaleString()}</span>
            </div>
          ))}
          <div className="mt-2 flex items-center justify-between border-t border-[var(--border-subtle)] pt-3">
            <span className="text-base font-bold text-[var(--text-primary)]">Total</span>
            <AnimatedTotal target={total} reduce={reduce} />
          </div>
        </div>

        {/* Botones borrosos — bloqueo de paywall */}
        <div className="relative border-t border-[var(--border-subtle)] px-5 py-4">
          <div className="flex gap-2 select-none pointer-events-none" style={{ filter: 'blur(3px)' }}>
            <div className="flex-1 h-11 rounded-[var(--radius-button)] bg-[var(--accent)] flex items-center justify-center text-sm font-bold text-white">Enviar al cliente</div>
            <div className="flex-1 h-11 rounded-[var(--radius-button)] border border-[var(--border-subtle)] flex items-center justify-center text-sm font-semibold text-[var(--text-secondary)]">Guardar PDF</div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="flex items-center gap-1.5 rounded-full bg-[var(--text-primary)] px-3 py-1 text-xs font-bold text-[var(--bg)]">
              <Lock size={11} />
              Activa tu cuenta para enviar
            </span>
          </div>
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        disabled={saving}
        onClick={async () => { setSaving(true); await onSave(); }}
        className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] text-base font-bold text-[var(--bg)] [box-shadow:var(--shadow-cta)] disabled:opacity-60 [touch-action:manipulation]"
      >
        {saving ? (
          <svg className="size-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".25" />
            <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        ) : 'Activar y enviar →'}
      </motion.button>
      <p className="mt-3 text-center text-xs text-[var(--text-tertiary)]">Prueba gratis 14 días · Sin tarjeta de crédito</p>
      <button
        onClick={onBack}
        className="mt-3 flex w-full items-center justify-center gap-1 text-xs text-[var(--text-tertiary)] [touch-action:manipulation]"
      >
        <ChevronLeft size={12} />
        Volver y editar
      </button>
    </motion.div>
  );
}

// ── Main flow ──────────────────────────────────────────────────────────────
export function OnboardingFlow() {
  const router = useRouter();
  const [step,    setStep]    = useState<Step>('trade');
  const [trade,   setTrade]   = useState<Trade>(TRADES[0]);
  const [service, setService] = useState('');
  const [price,   setPrice]   = useState('');
  const [desc,    setDesc]    = useState('');

  const prevStep: Record<Step, Step> = {
    trade: 'trade', pricebook: 'trade', describe: 'pricebook',
    loading: 'describe', preview: 'describe',
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg)]">
      {/* Header fijo */}
      <header className="flex h-14 shrink-0 items-center justify-between px-6">
        {step !== 'trade' && step !== 'loading' ? (
          <button
            onClick={() => setStep(prevStep[step])}
            className="flex size-10 items-center justify-center rounded-full hover:bg-[var(--surface)] [touch-action:manipulation]"
            aria-label="Volver"
          >
            <ChevronLeft size={20} color="var(--text-secondary)" />
          </button>
        ) : (
          <a href="/" className="flex items-center gap-2 text-sm font-bold [font-family:var(--font-display)] text-[var(--text-primary)]">
            <span className="size-5 rounded bg-[var(--accent)]" aria-hidden />
            Quotronex
          </a>
        )}
        {step !== 'preview' && step !== 'loading' && (
          <button
            onClick={() => router.push('/')}
            className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] [touch-action:manipulation]"
          >
            Salir
          </button>
        )}
      </header>

      {/* Indicador de progreso */}
      {BAR_STEPS.includes(step as typeof BAR_STEPS[number]) && (
        <div className="shrink-0 px-6">
          <ProgressDots step={step} />
        </div>
      )}

      {/* Contenido scrollable */}
      <main className="flex-1 overflow-y-auto px-6 pt-2 pb-12">
        <div className="mx-auto max-w-md">
          <AnimatePresence mode="wait">
            {step === 'trade' && (
              <StepTrade onNext={t => { setTrade(t); setStep('pricebook'); }} />
            )}
            {step === 'pricebook' && (
              <StepPricebook trade={trade} onNext={(s, p) => { setService(s); setPrice(p); setStep('describe'); }} />
            )}
            {step === 'describe' && (
              <StepDescribe trade={trade} onNext={d => { setDesc(d); setStep('loading'); }} />
            )}
            {step === 'loading' && (
              <StepLoading onDone={() => setStep('preview')} />
            )}
            {step === 'preview' && (
              <StepPreview
                trade={trade} service={service} price={price} desc={desc}
                onBack={() => setStep('describe')}
                onSave={async () => {
                  await saveQuoteAndRedirect({
                    trade: trade.label,
                    serviceName: service,
                    priceTotal: parseFloat(price) || 0,
                    description: desc,
                  });
                }}
              />
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
