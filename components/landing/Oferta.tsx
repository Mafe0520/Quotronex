'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ShieldCheck, Users, Sparkles } from 'lucide-react';
import { Kicker, SectionShell, useReveal, VIEWPORT_ONCE } from './ui';
import { MarkedCopy } from './MarkedCopy';
import { useLang } from '@/app/lang-context';
import { PLAN_LIST, type PlanId } from '@/lib/plans';

// Founding counter — reinicia en sesión para urgencia real
function FounderCounter() {
  const { lang } = useLang();
  const [spots, setSpots] = useState(47);
  useEffect(() => {
    const saved = sessionStorage.getItem('qx-spots');
    if (saved) { setSpots(Number(saved)); return; }
    const n = Math.floor(Math.random() * 8) + 43;
    setSpots(n);
    sessionStorage.setItem('qx-spots', String(n));
  }, []);
  return (
    <div className="flex items-center justify-center gap-2 rounded-full bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] border border-[color-mix(in_oklab,var(--accent)_25%,transparent)] px-4 py-2">
      <Sparkles className="size-4 text-[var(--accent)]" strokeWidth={2} />
      <span className="text-sm font-bold text-[var(--accent)]">
        {lang === 'es'
          ? `Solo quedan ${spots} lugares al precio de fundadores`
          : `Only ${spots} founding spots remaining`}
      </span>
    </div>
  );
}

const FEATURES: Record<PlanId, { es: string; en: string }[]> = {
  solo: [
    { es: '1 usuario', en: '1 user' },
    { es: 'Cotizaciones ilimitadas', en: 'Unlimited quotes' },
    { es: 'Facturas y cobro en línea', en: 'Invoices & online payment' },
    { es: 'Catálogo de precios', en: 'Price catalog' },
    { es: 'Vista pública para clientes', en: 'Client-facing quote view' },
  ],
  crew: [
    { es: 'Hasta 3 usuarios', en: 'Up to 3 users' },
    { es: 'Todo lo del plan Solo', en: 'Everything in Solo' },
    { es: 'Trabajos y asignación de cuadrilla', en: 'Jobs & crew assignment' },
    { es: 'Registro de horas', en: 'Time tracking' },
    { es: 'Gastos y recibos con IA', en: 'AI receipt scanning' },
  ],
  business: [
    { es: 'Hasta 7 usuarios', en: 'Up to 7 users' },
    { es: 'Todo lo del plan Crew', en: 'Everything in Crew' },
    { es: 'Órdenes de cambio', en: 'Change orders' },
    { es: 'Fotos antes/durante/después', en: 'Before/during/after photos' },
    { es: 'Soporte prioritario', en: 'Priority support' },
  ],
  pro_team: [
    { es: 'Hasta 15 usuarios', en: 'Up to 15 users' },
    { es: 'Todo lo del plan Business', en: 'Everything in Business' },
    { es: 'Acceso anticipado a funciones', en: 'Early access to features' },
    { es: 'Onboarding personalizado', en: 'Personalized onboarding' },
    { es: 'Soporte dedicado', en: 'Dedicated support' },
  ],
};

const PLAN_NAMES: Record<PlanId, { es: string; en: string }> = {
  solo:     { es: 'Solo',     en: 'Solo'     },
  crew:     { es: 'Crew',     en: 'Crew'     },
  business: { es: 'Business', en: 'Business' },
  pro_team: { es: 'Pro Team', en: 'Pro Team' },
};

export interface OfertaProps {
  kicker?: string;
  tituloMarked: string;
  trialDias?: number;
  // legacy props — ignored, data comes from lib/plans.ts
  anual?: unknown;
  mensual?: unknown;
  stack?: unknown;
  id?: string;
}

export function Oferta({
  kicker = 'LA OFERTA',
  tituloMarked,
  trialDias = 14,
  id = 'oferta',
}: OfertaProps) {
  const { contenedor, item } = useReveal();
  const { lang } = useLang();
  const es = lang === 'es';

  const [billing, setBilling] = useState<'annual' | 'monthly'>('annual');
  const [selected, setSelected] = useState<PlanId>('solo');

  const plan = PLAN_LIST.find(p => p.id === selected)!;
  const monthlyEquiv = billing === 'annual'
    ? Math.round(plan.annualPriceCents / 12 / 100)
    : plan.monthlyPriceCents / 100;
  const annualTotal = plan.annualPriceCents / 100;
  const savings = (plan.monthlyPriceCents * 12 - plan.annualPriceCents) / 100;

  const ctaHref = `/signup?plan=${selected}&billing=${billing}`;

  return (
    <SectionShell id={id} elevacion="base" ariaLabel={es ? 'Planes y precios' : 'Plans & pricing'}>
      <motion.div variants={contenedor} initial="hidden" whileInView="visible" viewport={VIEWPORT_ONCE}>

        {/* Header */}
        <motion.div variants={item} className="mx-auto max-w-2xl text-center mb-8">
          <Kicker>{kicker}</Kicker>
          <h2 className="text-balance text-3xl font-black leading-[1.08] text-[var(--text-primary)] [font-family:var(--font-display)] md:text-4xl mt-3">
            <MarkedCopy text={tituloMarked} />
          </h2>
        </motion.div>

        {/* Comparativa rápida */}
        <motion.div variants={item} className="mx-auto max-w-xl mb-8">
          <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface)] divide-y divide-[var(--border-subtle)] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5">
              <span className="text-sm text-[var(--text-tertiary)]">
                {es ? 'Plataformas grandes' : 'Other platforms'}
              </span>
              <span className="text-sm font-semibold text-[var(--text-secondary)] tabular-nums">
                {es ? '$149/mes · 3 usuarios · cobran por función' : '$149/mo · 3 users · charge per feature'}
              </span>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5 bg-[color-mix(in_oklab,var(--accent)_5%,transparent)]">
              <span className="text-sm font-bold text-[var(--text-primary)]">Quotronex Crew</span>
              <span className="text-sm font-bold text-[var(--accent)] tabular-nums">
                {es ? '$39/mes · 3 usuarios · todo incluido' : '$39/mo · 3 users · everything included'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Urgencia fundadores */}
        <motion.div variants={item} className="flex justify-center mb-8">
          <FounderCounter />
        </motion.div>

        {/* Billing toggle */}
        <motion.div variants={item} className="mx-auto max-w-sm mb-6">
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-[var(--surface)] border border-[color-mix(in_oklab,var(--text-tertiary)_15%,transparent)]">
            {(['annual', 'monthly'] as const).map(b => (
              <button key={b} onClick={() => setBilling(b)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${billing === b ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text-secondary)]'}`}>
                {b === 'annual' ? (
                  <span className="flex items-center justify-center gap-1.5">
                    {es ? 'Anual' : 'Annual'}
                    <span className="text-[10px] font-black bg-white/20 px-1.5 py-0.5 rounded-full">
                      {es ? '2 meses gratis' : '2 months free'}
                    </span>
                  </span>
                ) : (es ? 'Mensual' : 'Monthly')}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Plan grid */}
        <motion.div variants={item} className="mx-auto max-w-4xl grid grid-cols-2 gap-3 mb-6 md:grid-cols-4">
          {PLAN_LIST.map(p => {
            const isSelected = p.id === selected;
            const mEquiv = billing === 'annual'
              ? Math.round(p.annualPriceCents / 12 / 100)
              : p.monthlyPriceCents / 100;
            return (
              <button key={p.id} onClick={() => setSelected(p.id)}
                className={[
                  'rounded-2xl border-2 p-3 text-left transition-all [touch-action:manipulation]',
                  isSelected
                    ? 'border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_6%,var(--surface))] shadow-[0_4px_16px_color-mix(in_oklab,var(--accent)_14%,transparent)]'
                    : 'border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--surface)] opacity-75',
                ].join(' ')}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold ${isSelected ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'}`}>
                    {PLAN_NAMES[p.id][lang === 'es' ? 'es' : 'en']}
                  </span>
                  {p.id === 'crew' && (
                    <span className="text-[9px] font-black bg-[var(--accent)] text-white px-1.5 py-0.5 rounded-full">
                      {es ? 'Popular' : 'Popular'}
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-0.5">
                  <span className={`text-xl font-black [font-family:var(--font-display)] ${isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                    ${mEquiv}
                  </span>
                  <span className="text-[10px] text-[var(--text-tertiary)]">{es ? '/mes' : '/mo'}</span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Users size={10} className="text-[var(--text-tertiary)]" />
                  <span className="text-[10px] text-[var(--text-tertiary)]">
                    {p.includedSeats === 1 ? '1' : `≤${p.includedSeats}`}
                  </span>
                </div>
              </button>
            );
          })}
        </motion.div>

        {/* Selected plan detail */}
        <motion.div variants={item} className="mx-auto max-w-md">
          <AnimatePresence mode="wait">
            <motion.div key={selected + billing}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="rounded-2xl border-2 border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_5%,var(--surface))] p-6 shadow-[0_8px_32px_color-mix(in_oklab,var(--accent)_14%,transparent)]">

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  {PLAN_NAMES[selected][es ? 'es' : 'en']}
                </h3>
                <span className="rounded-full bg-[color-mix(in_oklab,var(--accent)_15%,transparent)] px-3 py-1 text-xs font-bold text-[var(--accent)]">
                  {es ? `${trialDias} días gratis` : `${trialDias}-day free trial`}
                </span>
              </div>

              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-5xl font-black tabular-nums [font-family:var(--font-display)] text-[var(--text-primary)]">
                  ${monthlyEquiv}
                </span>
                <span className="text-base text-[var(--text-secondary)]">{es ? '/mes' : '/mo'}</span>
              </div>

              {billing === 'annual' ? (
                <div className="mb-4">
                  <p className="text-xs text-[var(--text-secondary)]">
                    {es ? `Facturado a $${annualTotal}/año` : `Billed $${annualTotal}/year`}
                  </p>
                  <p className="text-sm font-bold text-[var(--accent)] mt-1">
                    {es ? `Ahorras $${savings} al año` : `Save $${savings}/year`}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-[var(--text-secondary)] mb-4">
                  {es ? 'Cancela cuando quieras' : 'Cancel anytime'}
                </p>
              )}

              <ul className="flex flex-col gap-2.5 mb-5">
                {FEATURES[selected].map((f, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-[var(--text-primary)]">
                    <Check size={14} className="text-[var(--accent)] shrink-0" strokeWidth={3} />
                    {es ? f.es : f.en}
                  </li>
                ))}
              </ul>

              <a href={ctaHref}
                className="flex h-14 w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] text-base font-bold text-white [box-shadow:var(--shadow-cta)] [touch-action:manipulation]">
                {es ? 'Empezar gratis →' : 'Start free trial →'}
              </a>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[var(--text-tertiary)]">
                <ShieldCheck className="size-4 text-[var(--accent)]" strokeWidth={2} />
                <span>
                  {es
                    ? '$0 hoy · no se cobra hasta el día 15 · cancela cuando quieras'
                    : '$0 today · no charge until day 15 · cancel anytime'}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

      </motion.div>
    </SectionShell>
  );
}
