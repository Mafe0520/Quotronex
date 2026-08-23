'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { Clock, TrendingUp } from 'lucide-react';
import { SectionShell, useReveal, VIEWPORT_ONCE } from './ui';

interface RoiCalculatorProps {
  titulo:    string;
  subtitulo: string;
  labelEstimados: string;
  labelValor:     string;
  labelHoras:     string;
  labelFactura:   string;
  descHoras:      string;
  descFactura:    string;
}

function AnimatedNumber({ target, prefix = '', suffix = '' }: { target: number; prefix?: string; suffix?: string }) {
  const mv = useMotionValue(0);
  const display = useTransform(mv, v =>
    `${prefix}${Math.round(v).toLocaleString('en-US')}${suffix}`
  );

  useEffect(() => {
    const ctrl = animate(mv, target, { type: 'spring', stiffness: 60, damping: 18 });
    return () => ctrl.stop();
  }, [mv, target]);

  return <motion.span className="tabular-nums">{display}</motion.span>;
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[var(--text-primary)]">{label}</span>
        <span className="text-base font-black text-[var(--accent)] [font-family:var(--font-display)] tabular-nums">
          {display}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full outline-none [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent)_60%,transparent)] [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white"
        style={{
          background: `linear-gradient(to right, var(--accent) ${pct}%, var(--surface-2) ${pct}%)`,
        }}
      />
    </div>
  );
}

export function RoiCalculator({
  titulo,
  subtitulo,
  labelEstimados,
  labelValor,
  labelHoras,
  labelFactura,
  descHoras,
  descFactura,
}: RoiCalculatorProps) {
  const [qty, setQty]   = useState(27);
  const [avg, setAvg]   = useState(1800);
  const { contenedor, item } = useReveal(0.07);

  // Fórmulas: 1.5h ahorradas por cotización · 15% más trabajos ganados
  const horasAhorradas  = Math.round(qty * 1.5);
  const facturaExtra    = Math.round(qty * 0.15 * avg / 10) * 10;

  return (
    <SectionShell elevacion="elevada">
      <motion.div
        variants={contenedor}
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT_ONCE}
        className="flex flex-col items-center text-center gap-3 mb-10"
      >
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

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={VIEWPORT_ONCE}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-3xl rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-2)] p-8"
      >
        {/* Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Slider
            label={labelEstimados}
            value={qty}
            min={1}
            max={60}
            step={1}
            display={String(qty)}
            onChange={setQty}
          />
          <Slider
            label={labelValor}
            value={avg}
            min={500}
            max={8000}
            step={100}
            display={`$${avg.toLocaleString('en-US')}`}
            onChange={setAvg}
          />
        </div>

        <div className="h-px bg-[var(--border-subtle)] mb-8" />

        {/* Resultado cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border-subtle)] p-5 flex flex-col items-center gap-2">
            <Clock className="size-7 text-[var(--accent-2)]" strokeWidth={1.5} />
            <p className="text-4xl font-black text-[var(--text-primary)] [font-family:var(--font-display)] tabular-nums">
              ~<AnimatedNumber target={horasAhorradas} suffix=" hrs" />
            </p>
            <p className="text-sm text-[var(--text-tertiary)] text-center leading-snug">{descHoras}</p>
          </div>
          <div className="rounded-[var(--radius-card)] bg-[var(--surface)] border border-[color-mix(in_oklab,var(--accent)_30%,transparent)] p-5 flex flex-col items-center gap-2">
            <TrendingUp className="size-7 text-[var(--accent)]" strokeWidth={1.5} />
            <p className="text-4xl font-black text-[var(--accent)] [font-family:var(--font-display)] tabular-nums">
              +<AnimatedNumber target={facturaExtra} prefix="$" />
            </p>
            <p className="text-sm text-[var(--text-tertiary)] text-center leading-snug">{descFactura}</p>
          </div>
        </div>
      </motion.div>
    </SectionShell>
  );
}
