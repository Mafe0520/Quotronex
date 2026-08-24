'use client';

import { motion, AnimatePresence } from 'motion/react';
import { useState, useMemo } from 'react';
import { Check, ShieldCheck, Sparkles, ChevronLeft, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PLAN_LIST, type PlanId } from '@/lib/plans';

const T = { duration: 0.22, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

const PLAN_FEATURES: Record<PlanId, string[]> = {
  solo:     ['1 usuario', 'Cotizaciones y facturas ilimitadas', 'Catálogo de precios', 'Vista pública para clientes', 'Email desde tu cuenta'],
  crew:     ['Hasta 3 usuarios', 'Todo lo del plan Solo', 'Gestión de trabajos y cuadrilla', 'Registro de horas', 'Gastos y recibos con IA'],
  business: ['Hasta 7 usuarios', 'Todo lo del plan Crew', 'Órdenes de cambio', 'Fotos antes/durante/después', 'Soporte prioritario'],
  pro_team: ['Hasta 15 usuarios', 'Todo lo del plan Business', 'Acceso anticipado a nuevas funciones', 'Onboarding personalizado', 'Soporte dedicado'],
};

function fmt(cents: number) {
  return `$${cents / 100}`;
}

export function PaywallScreen() {
  const router = useRouter();
  const [billing, setBilling] = useState<'annual' | 'monthly'>('annual');
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('crew');
  const [navigating, setNavigating] = useState(false);

  const trialEnd = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() + 14);
    return d.toLocaleDateString('es-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, []);

  const plan = PLAN_LIST.find(p => p.id === selectedPlan)!;
  const monthlyEquiv = billing === 'annual'
    ? Math.round(plan.annualPriceCents / 12 / 100)
    : plan.monthlyPriceCents / 100;
  const annualTotal = plan.annualPriceCents / 100;
  const savings = (plan.monthlyPriceCents * 12 - plan.annualPriceCents) / 100;

  function handleStart() {
    if (navigating) return;
    setNavigating(true);
    setTimeout(() => router.push(`/signup?plan=${selectedPlan}&billing=${billing}`), 150);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg)]">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between px-6">
        <a href="/onboarding"
          className="flex size-10 items-center justify-center rounded-full hover:bg-[var(--surface)]">
          <ChevronLeft size={20} color="var(--text-secondary)" />
        </a>
        <a href="/" className="flex items-center gap-2 text-sm font-bold [font-family:var(--font-display)] text-[var(--text-primary)]">
          <span className="size-5 rounded bg-[var(--accent)]" aria-hidden />
          Quotronex
        </a>
        <div className="w-10" aria-hidden />
      </header>

      <main className="mx-auto w-full max-w-md flex-1 overflow-y-auto px-5 pb-16 pt-2">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={T} className="mb-5">
          <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)] leading-[1.08] mb-2">
            Elige tu plan.<br />
            <span className="text-[var(--accent)]">14 días gratis.</span>
          </h1>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">
            $0 cobrados hoy. Cancela antes del día 15 y no se te cobra nada.
          </p>
          <div className="inline-flex items-center gap-1.5 bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] border border-[color-mix(in_oklab,var(--accent)_25%,transparent)] px-3 py-1 rounded-full text-xs font-bold text-[var(--accent)]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>+400 contratistas en EE. UU.</span>
          </div>
        </motion.div>

        {/* Billing toggle */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...T, delay: 0.05 }}
          className="flex items-center gap-1 p-1 rounded-2xl bg-[var(--surface)] mb-4 border border-[color-mix(in_oklab,var(--text-tertiary)_15%,transparent)]">
          {(['annual', 'monthly'] as const).map(b => (
            <button key={b} onClick={() => setBilling(b)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${billing === b ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text-secondary)]'}`}>
              {b === 'annual' ? (
                <span className="flex items-center justify-center gap-1.5">
                  Anual <span className="text-[10px] font-black bg-white/20 px-1.5 py-0.5 rounded-full">2 meses gratis</span>
                </span>
              ) : 'Mensual'}
            </button>
          ))}
        </motion.div>

        {/* Plan cards */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...T, delay: 0.08 }}
          className="flex flex-col gap-2.5 mb-5">
          {PLAN_LIST.map(p => {
            const isSelected = p.id === selectedPlan;
            const mEquiv = billing === 'annual'
              ? Math.round(p.annualPriceCents / 12 / 100)
              : p.monthlyPriceCents / 100;
            return (
              <button key={p.id} type="button" onClick={() => setSelectedPlan(p.id)}
                className={[
                  'p-4 rounded-2xl border-2 text-left transition-all [touch-action:manipulation]',
                  isSelected
                    ? 'border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_4%,var(--surface))] shadow-[0_2px_12px_color-mix(in_oklab,var(--accent)_12%,transparent)]'
                    : 'border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--surface)] opacity-80',
                ].join(' ')}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-extrabold text-sm ${isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                      {p.name}
                    </span>
                    {p.id === 'crew' && (
                      <span className="bg-[var(--accent)] text-white text-[10px] font-black px-2 py-0.5 rounded-full">Popular</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                    <Users size={11} />
                    <span>{p.includedSeats === 1 ? '1 usuario' : `hasta ${p.includedSeats}`}</span>
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-2xl font-black [font-family:var(--font-display)] ${isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                    ${mEquiv}
                  </span>
                  <span className="text-xs text-[var(--text-tertiary)]">/mes</span>
                  {billing === 'annual' && (
                    <span className="text-xs text-[var(--accent-2)] font-bold ml-1">
                      · ${p.annualPriceCents / 100}/año
                    </span>
                  )}
                </div>

                {/* Features — only shown when selected */}
                <AnimatePresence initial={false}>
                  {isSelected && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden">
                      <div className="mt-3 flex flex-col gap-1.5 border-t border-[color-mix(in_oklab,var(--text-tertiary)_12%,transparent)] pt-3">
                        {PLAN_FEATURES[p.id].map((f, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-[var(--text-primary)]">
                            <Check size={12} className="text-[var(--accent)] shrink-0" strokeWidth={3} />
                            {f}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </motion.div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...T, delay: 0.12 }}>
          {/* Price summary */}
          <div className="mb-3 text-center">
            <p className="text-xs text-[var(--text-tertiary)]">
              {billing === 'annual'
                ? `${plan.name} · $${monthlyEquiv}/mes · $${annualTotal}/año · ahorras $${savings}`
                : `${plan.name} · $${monthlyEquiv}/mes · cancela cuando quieras`}
            </p>
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.985, y: 3 }}
            onClick={handleStart}
            disabled={navigating}
            className="w-full h-14 bg-[var(--accent)] text-[var(--bg)] rounded-[var(--radius-button)] font-bold text-base flex items-center justify-center gap-2 [box-shadow:var(--shadow-cta)] disabled:opacity-70 [touch-action:manipulation]">
            {navigating ? (
              <svg className="size-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".3" />
                <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            ) : <>Empezar gratis 14 días →</>}
          </motion.button>

          <div className="text-center mt-3 flex flex-col gap-1">
            <p className="text-xs text-[var(--text-secondary)] flex items-center justify-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent-2)]" />
              14 días gratis · $0 hoy · Cancela antes del {trialEnd}
            </p>
            <p className="text-xs text-[var(--text-tertiary)]">
              Después de tu prueba, tu plan comienza automáticamente.
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
