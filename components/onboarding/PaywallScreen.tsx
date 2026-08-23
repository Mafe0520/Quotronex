'use client';

import { motion } from 'motion/react';
import { useState, useMemo } from 'react';
import { Check, ShieldCheck, Sparkles, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

const FEATURES = [
  'Cotiza con voz en menos de 1 minuto — ilimitado',
  'Español e inglés incluidos para oficina y campo',
  'Envía por email o SMS, firma digital y cobra',
  'Asigna trabajos a cuadrillas de hasta 15 trabajadores',
  'Precio fijo y predecible. Sin add-ons ocultos',
];

const T = { duration: 0.22, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

export function PaywallScreen() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual');
  const [navigating, setNavigating]     = useState(false);

  const trialEnd = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() + 14);
    return d.toLocaleDateString('es-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, []);

  function handleStart() {
    if (navigating) return;
    setNavigating(true);
    setTimeout(() => router.push(`/login?plan=${selectedPlan}&billing=${selectedPlan}`), 150);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg)]">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between px-6">
        <a
          href="/onboarding"
          className="flex size-10 items-center justify-center rounded-full hover:bg-[var(--surface)]"
          aria-label="Volver"
        >
          <ChevronLeft size={20} color="var(--text-secondary)" />
        </a>
        <a href="/" className="flex items-center gap-2 text-sm font-bold [font-family:var(--font-display)] text-[var(--text-primary)]">
          <span className="size-5 rounded bg-[var(--accent)]" aria-hidden />
          Quotronex
        </a>
        <div className="w-10" aria-hidden />
      </header>

      <main className="mx-auto w-full max-w-md flex-1 overflow-y-auto px-5 pb-16 pt-2">
        {/* Hero copy */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={T}>
          <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)] leading-[1.08] mb-2">
            Tu cotización <br />
            <span className="text-[var(--accent)]">está lista.</span>
          </h1>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">
            Tu cliente está esperando — el que llega primero con números claros se queda con el trabajo.
          </p>

          {/* Social proof chip */}
          <div className="inline-flex items-center gap-1.5 bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] border border-[color-mix(in_oklab,var(--accent)_25%,transparent)] px-3 py-1 rounded-full text-xs font-bold text-[var(--accent)] mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>+400 contratistas cotizando en EE. UU.</span>
          </div>
        </motion.div>

        {/* Features checklist */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ ...T, delay: 0.06 }}
          className="bg-[var(--surface)] border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] rounded-2xl p-4 mb-6 shadow-[var(--shadow-1)]"
        >
          <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-tertiary)] block mb-3">
            Incluido en tu prueba de 14 días
          </span>
          <div className="flex flex-col gap-2.5">
            {FEATURES.map((text, i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs text-[var(--text-primary)] font-medium leading-snug">
                <div className="size-4 rounded-full bg-[color-mix(in_oklab,var(--accent-2)_15%,transparent)] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-2.5 h-2.5 text-[var(--accent-2)]" strokeWidth={3} />
                </div>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Plan selector */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ ...T, delay: 0.1 }}
          className="flex flex-col gap-3 mb-5"
        >
          {/* Plan Anual — dominante */}
          <button
            type="button"
            onClick={() => setSelectedPlan('annual')}
            className={[
              'p-4 rounded-2xl border-2 cursor-pointer relative bg-[var(--surface)] text-left [touch-action:manipulation]',
              selectedPlan === 'annual'
                ? 'border-[var(--accent)] shadow-[0_2px_12px_color-mix(in_oklab,var(--accent)_12%,transparent)]'
                : 'border-[color-mix(in_oklab,var(--text-tertiary)_30%,transparent)] opacity-85 hover:border-[color-mix(in_oklab,var(--text-primary)_40%,transparent)]',
            ].join(' ')}
          >
            <div className="flex justify-between items-start mb-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-[var(--text-primary)]">Plan Anual</span>
                <span className="bg-[var(--accent)] text-white text-xs font-black uppercase px-2 py-0.5 rounded-full tracking-wide">
                  Más Popular
                </span>
              </div>
              <span className="text-xs font-bold text-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] px-2 py-0.5 rounded">
                14 días gratis
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-3xl font-black text-[var(--text-primary)] [font-family:var(--font-display)]">$32</span>
              <span className="text-xs text-[var(--text-secondary)] font-medium">/mes</span>
              <span className="text-xs text-[var(--accent-2)] font-bold ml-2">Ahorras 2 meses</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Facturado a $384/año después de los 14 días · $0 cobrados hoy
            </p>
          </button>

          {/* Plan Mensual — subordinado */}
          <button
            type="button"
            onClick={() => setSelectedPlan('monthly')}
            className={[
              'p-4 rounded-2xl border-2 cursor-pointer bg-[var(--surface)] text-left [touch-action:manipulation]',
              selectedPlan === 'monthly'
                ? 'border-[var(--accent)] shadow-[0_2px_12px_color-mix(in_oklab,var(--accent)_12%,transparent)]'
                : 'border-[color-mix(in_oklab,var(--text-tertiary)_30%,transparent)] opacity-75 hover:border-[color-mix(in_oklab,var(--text-primary)_40%,transparent)]',
            ].join(' ')}
          >
            <div className="flex justify-between items-start mb-1">
              <span className="font-bold text-sm text-[var(--text-primary)]">Plan Mensual</span>
              <span className="text-xs font-bold text-[var(--text-secondary)] bg-[var(--surface-2)] px-2 py-0.5 rounded">
                14 días gratis
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-[var(--text-primary)] [font-family:var(--font-display)]">$39</span>
              <span className="text-xs text-[var(--text-secondary)] font-medium">/mes</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Cobro regular cada mes · Cancela con un clic
            </p>
          </button>
        </motion.div>

        {/* CTA — soft brutalist press */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...T, delay: 0.14 }}>
          <motion.button
            type="button"
            whileTap={{ scale: 0.985, y: 3, boxShadow: 'var(--shadow-cta-press)' }}
            onClick={handleStart}
            disabled={navigating}
            className="w-full h-14 bg-[var(--accent)] text-[var(--bg)] rounded-[var(--radius-button)] font-bold text-base tracking-tight flex items-center justify-center gap-2 [box-shadow:var(--shadow-cta)] disabled:opacity-70 [touch-action:manipulation]"
          >
            {navigating ? (
              <svg className="size-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".3" />
                <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            ) : (
              <>
                <span>Comenzar {selectedPlan === 'annual' ? 'Plan Anual' : 'Plan Mensual'} Gratis</span>
                <span className="text-lg">→</span>
              </>
            )}
          </motion.button>

          <div className="text-center mt-3 flex flex-col gap-1">
            <p className="text-xs text-[var(--text-secondary)] flex items-center justify-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent-2)]" />
              Garantía total de devolución de 7 días
            </p>
            <p className="text-xs text-[var(--text-tertiary)]">
              Prueba 14 días gratis · No se cobra hasta el día 15 · Cancela cuando quieras
            </p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              $0 cobrados hoy · Cargo después del {trialEnd}
            </p>
          </div>

          <div className="mt-6 flex justify-center">
            <a href="/app" className="text-xs text-[var(--text-tertiary)] underline underline-offset-2">
              Ahora no, continuar sin plan
            </a>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
