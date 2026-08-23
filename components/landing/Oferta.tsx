'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Star, ShieldCheck, Clock, Users } from 'lucide-react';
import { CheckCustom, CtaButton, Hairline, Kicker, SectionShell, useReveal, VIEWPORT_ONCE } from './ui';
import { MarkedCopy } from './MarkedCopy';
import { useLang } from '@/app/lang-context';

export interface PlanOferta {
  nombre: string;
  precioMes: string;
  sufijo?: string;
  descomposicionDia?: string;
  ctaLabel: string;
  ctaHref: string;
  features: string[];
}

export interface OfertaProps {
  kicker?: string;
  tituloMarked: string;
  trialDias?: number;
  anual: PlanOferta & {
    totalAnual: string;
    ahorro: string;
    badge?: string;
  };
  mensual: PlanOferta;
  stack?: {
    lineas: { resultado: string; valor: string }[];
    totalTachado: string;
    nota?: string;
  };
  id?: string;
}

// Contador de fundadores — se reinicia en 47 al cargar (urgencia real de sesión)
function FounderCounter() {
  const { lang } = useLang();
  const [spots, setSpots] = useState(47);

  useEffect(() => {
    const saved = sessionStorage.getItem('qx-spots');
    if (saved) { setSpots(Number(saved)); return; }
    const n = Math.floor(Math.random() * 8) + 43; // 43–50
    setSpots(n);
    sessionStorage.setItem('qx-spots', String(n));
  }, []);

  return (
    <div className="flex items-center justify-center gap-2 rounded-full bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] border border-[color-mix(in_oklab,var(--accent)_25%,transparent)] px-4 py-2">
      <Users className="size-4 text-[var(--accent)]" strokeWidth={2} />
      <span className="text-sm font-bold text-[var(--accent)]">
        {lang === 'es'
          ? `Solo quedan ${spots} lugares al precio de fundadores`
          : `Only ${spots} spots left at founder pricing`}
      </span>
    </div>
  );
}

function TrialBadge({ dias }: { dias: number }) {
  const { lang } = useLang();
  return (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[color-mix(in_oklab,var(--accent)_13%,transparent)] px-3 py-1 text-xs font-bold uppercase tracking-[0.06em] text-[var(--accent)]">
      <Star size={11} strokeWidth={2.5} aria-hidden />
      {lang === 'es' ? `${dias} días gratis` : `${dias}-day free trial`}
    </span>
  );
}

export function Oferta({
  kicker = 'LA OFERTA',
  tituloMarked,
  trialDias,
  anual,
  mensual,
  stack,
  id = 'oferta',
}: OfertaProps) {
  const { contenedor, item } = useReveal();
  const { lang } = useLang();

  const es = lang === 'es';

  return (
    <SectionShell id={id} elevacion="base" ariaLabel="Planes y precios">
      <motion.div variants={contenedor} initial="hidden" whileInView="visible" viewport={VIEWPORT_ONCE}>

        {/* Header */}
        <motion.div variants={item} className="mx-auto max-w-2xl text-center mb-8">
          <Kicker>{kicker}</Kicker>
          <h2 className="text-balance text-3xl font-black leading-[1.08] text-[var(--text-primary)] [font-family:var(--font-display)] md:text-4xl mt-3">
            <MarkedCopy text={tituloMarked} />
          </h2>
        </motion.div>

        {/* Ancla emocional — comparación genérica vs campo */}
        <motion.div variants={item} className="mx-auto max-w-xl mb-8">
          <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface)] divide-y divide-[var(--border-subtle)] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5">
              <span className="text-sm text-[var(--text-tertiary)]">
                {es ? 'Otras apps de servicio de campo' : 'Other field service apps'}
              </span>
              <span className="text-sm font-semibold text-[var(--text-secondary)] tabular-nums">
                {es ? '$69–$149/mes · cobran por función' : '$69–$149/mo · charge per feature'}
              </span>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5 bg-[color-mix(in_oklab,var(--accent)_5%,transparent)]">
              <span className="text-sm font-bold text-[var(--text-primary)]">Quotronex</span>
              <span className="text-sm font-bold text-[var(--accent)] tabular-nums">
                {es ? '$32/mes · todo incluido' : '$32/mo · everything included'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Urgencia fundadores */}
        <motion.div variants={item} className="flex justify-center mb-10">
          <FounderCounter />
        </motion.div>

        {/* Cards de precio */}
        <div className="mx-auto max-w-4xl grid grid-cols-1 items-start gap-6 md:grid-cols-2">

          {/* ── ANUAL (recomendado) ── */}
          <motion.div variants={item} className="relative md:-translate-y-2">
            {anual.badge && (
              <span className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full border border-[color-mix(in_oklab,var(--accent)_25%,transparent)] bg-[var(--accent)] px-4 py-1 text-xs font-bold uppercase tracking-[0.06em] text-[var(--bg)]">
                {anual.badge}
              </span>
            )}
            <Hairline emphasis surface="surface" className="shadow-[0_12px_36px_color-mix(in_oklab,var(--accent)_16%,transparent)]">
              <div className="rounded-[var(--radius-card)] bg-[color-mix(in_oklab,var(--accent)_5%,transparent)] p-6 md:p-8">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">{anual.nombre}</h3>
                  {trialDias !== undefined && <TrialBadge dias={trialDias} />}
                </div>

                {/* Precio héroe */}
                <div className="mb-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black tabular-nums text-[var(--text-primary)] [font-family:var(--font-display)]">
                      {anual.precioMes}
                    </span>
                    <span className="text-base text-[var(--text-secondary)]">
                      {anual.sufijo ?? (es ? '/mes' : '/mo')}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">{anual.totalAnual}</p>
                  <p className="text-sm font-bold text-[var(--accent)] mt-2">{anual.ahorro}</p>
                </div>

                {/* Stack de valor dentro de la card */}
                {stack && (
                  <div className="my-4 rounded-xl border border-[color-mix(in_oklab,var(--border-subtle)_60%,transparent)] bg-[var(--surface)] divide-y divide-[var(--border-subtle)]">
                    {stack.lineas.map((l, i) => (
                      <div key={i} className="flex items-start justify-between gap-4 px-4 py-2.5 text-sm">
                        <span className="flex items-start gap-2 text-[var(--text-secondary)]">
                          <CheckCustom />
                          <span>{l.resultado}</span>
                        </span>
                        <span className="shrink-0 tabular-nums font-semibold text-[var(--text-tertiary)] line-through text-xs pt-0.5">{l.valor}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-xs text-[var(--text-tertiary)]">
                        {es ? 'Valor total:' : 'Total value:'}{' '}
                        <span className="tabular-nums line-through">{stack?.totalTachado}</span>
                      </span>
                      <span className="text-sm font-black text-[var(--accent)] tabular-nums">{anual.precioMes}{es ? '/mes' : '/mo'}</span>
                    </div>
                  </div>
                )}

                {!stack && (
                  <ul className="my-5 flex flex-col gap-3">
                    {anual.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm leading-snug text-[var(--text-primary)]">
                        <CheckCustom /><span>{f}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <CtaButton href={anual.ctaHref} fullMobile>
                  {anual.ctaLabel}
                </CtaButton>

                {/* Garantía pegada al CTA */}
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[var(--text-tertiary)]">
                  <ShieldCheck className="size-4 text-[var(--accent)]" strokeWidth={2} />
                  <span>
                    {es
                      ? 'Prueba 14 días gratis · No se cobra hasta el día 15 · Cancela cuando quieras'
                      : '14-day free trial · No charge until day 15 · Cancel anytime'}
                  </span>
                </div>
              </div>
            </Hairline>
          </motion.div>

          {/* ── MENSUAL ── */}
          <motion.div
            variants={item}
            className="rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] p-6 shadow-[var(--shadow-1)] md:p-7"
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">{mensual.nombre}</h3>
              {trialDias !== undefined && <TrialBadge dias={trialDias} />}
            </div>

            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-4xl font-black tabular-nums text-[var(--text-primary)] [font-family:var(--font-display)]">
                {mensual.precioMes}
              </span>
              <span className="text-base text-[var(--text-secondary)]">
                {mensual.sufijo ?? (es ? '/mes' : '/mo')}
              </span>
            </div>
            {mensual.descomposicionDia && (
              <p className="text-xs text-[var(--text-secondary)] mb-4">{mensual.descomposicionDia}</p>
            )}

            <ul className="my-4 flex flex-col gap-3">
              {mensual.features.map((f, i) => (
                <li key={i} className="flex items-start gap-3 text-sm leading-snug text-[var(--text-primary)]">
                  <CheckCustom /><span>{f}</span>
                </li>
              ))}
            </ul>

            <motion.a
              whileTap={{ scale: 0.97 }}
              href={mensual.ctaHref}
              className="flex h-12 w-full items-center justify-center rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--accent)_45%,transparent)] text-base font-semibold text-[var(--accent)] transition-colors duration-150 hover:bg-[var(--chip-bg)] [touch-action:manipulation]"
            >
              {mensual.ctaLabel}
            </motion.a>

            {/* Comparativa de ahorro */}
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-[color-mix(in_oklab,var(--accent)_7%,transparent)] px-3 py-2.5">
              <Clock className="size-4 shrink-0 text-[var(--accent)]" strokeWidth={2} />
              <p className="text-xs text-[var(--text-secondary)]">
                {es
                  ? `Con el plan anual ahorras $84 — equivale a ${Math.round(84 / 32)} meses gratis`
                  : `Annual plan saves you $84 — that's ${Math.round(84 / 39)} months free`}
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </SectionShell>
  );
}
