'use client';

// HERO BACKGROUND v8 — Radar con brazo degradado + píldoras HTML
// Brazo: linearGradient userSpaceOnUse → transparente al centro, esmeralda al borde.
// Píldoras: HTML absolutos con CSS @keyframes sincronizados al barrido. z-[5] (encima del
// SVG -z-10, debajo del contenido z-10).

import { useId } from 'react';
import { useReducedMotion } from 'motion/react';

const W   = 1440;
const H   = 780;
const CX  = 720;
const CY  = 350;
const R1  = 120;
const R2  = 215;
const R3  = 300;
const DUR = 10;   // segundos por revolución

function toRad(deg: number) { return (deg * Math.PI) / 180; }
function pxy(r: number, deg: number) {
  // Rounded to 2 decimals to prevent SSR/client hydration mismatch from floating-point drift
  return [
    Math.round((CX + r * Math.cos(toRad(deg))) * 100) / 100,
    Math.round((CY + r * Math.sin(toRad(deg))) * 100) / 100,
  ] as const;
}

// Sector de trail detrás del brazo
function trailPath(r: number) {
  const x1 = r * Math.cos(toRad(-22));
  const y1 = r * Math.sin(toRad(-22));
  return `M 0 0 L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 0 1 ${r} 0 Z`;
}

const TICK30 = Array.from({ length: 12 }, (_, i) => i * 30);
const TICK45 = Array.from({ length: 8 },  (_, i) => i * 45);

// Píldoras: angle = grados desde el este (0°), sentido horario
// pos = clases Tailwind de posicionamiento absoluto (dentro del <section relative>)
const PILLS = [
  {
    angle: 38,
    quote: '$4,100',
    status: 'ACCEPTED',
    statusColor: 'var(--accent)',
    pos: 'md:top-36 md:right-24 lg:right-32',
    mobileHide: true,
  },
  {
    angle: 112,
    quote: '$2,200',
    status: 'SENT ✓',
    statusColor: 'var(--accent-2)',
    pos: 'top-[43%] right-3 md:right-8',
    mobileHide: true,
  },
  {
    angle: 198,
    quote: '$1,840',
    status: 'SENT ✓',
    statusColor: 'var(--accent-2)',
    pos: 'bottom-[38%] left-3 md:left-8',
    mobileHide: true,
  },
  {
    angle: 282,
    quote: '$3,450',
    status: 'ACCEPTED',
    statusColor: 'var(--accent)',
    pos: 'md:bottom-40 md:left-24 lg:left-32',
    mobileHide: true,
  },
  {
    angle: 348,
    quote: '$980',
    status: 'VIEWED',
    statusColor: 'var(--text-tertiary)',
    pos: 'md:top-32 md:left-12 lg:left-16',
    mobileHide: true,
  },
] as const;

export function HeroBackground() {
  const uid    = useId();
  const reduce = useReducedMotion();
  const safe   = uid.replace(/[^a-zA-Z0-9]/g, '');

  const sweepCls  = `sw-${safe}`;
  const armGradId = `ag-${safe}`;
  const ambGradId = `amb-${safe}`;

  // Genera keyframes CSS para cada píldora
  // La píldora se ilumina cuando el brazo la barre (al % correspondiente a su ángulo)
  const pillCss = PILLS.map((p, i) => {
    const cls    = `pr-${i}-${safe}`;
    const pct    = (p.angle / 360) * 100;
    const pre    = Math.max(0, pct - 1.8).toFixed(1);
    const peak   = pct.toFixed(1);
    const dim1   = Math.min(100, pct + 7).toFixed(1);
    const dim2   = Math.min(100, pct + 22).toFixed(1);
    return {
      cls,
      kf: `
@keyframes ${cls} {
  0%, ${pre}%  { opacity:.22; transform:scale(1); box-shadow:none; }
  ${peak}%     { opacity:1;   transform:scale(1.05); box-shadow:0 0 16px rgba(16,185,129,.38); }
  ${dim1}%     { opacity:.58; transform:scale(1.02); box-shadow:0 0 7px rgba(16,185,129,.18); }
  ${dim2}%,100%{ opacity:.22; transform:scale(1); box-shadow:none; }
}
.${cls}{ animation:${cls} ${DUR}s linear infinite; opacity:.22; }`,
    };
  });

  return (
    <>
      {/* ── CSS animations ────────────────────────────────────────────── */}
      <style>{`
        @keyframes ${sweepCls}{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .${sweepCls}{transform-origin:0px 0px;animation:${sweepCls} ${DUR}s linear infinite}
        ${pillCss.map(p => p.kf).join('\n')}
      `}</style>

      {/* ── SVG Radar — z -10 (puramente decorativo) ──────────────── */}
      <div aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <svg width="100%" height="100%"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg">
          <defs>
            {/* Gradiente de ambiente radial */}
            <radialGradient id={ambGradId}
              cx={`${CX}px`} cy={`${CY}px`} r={`${R3 + 90}px`}
              gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stopColor="var(--accent)" stopOpacity="0.09" />
              <stop offset="50%"  stopColor="var(--accent)" stopOpacity="0.02" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0"    />
            </radialGradient>

            {/* Gradiente del brazo — userSpaceOnUse en el espacio local del brazo rotado.
                x1=0 (centro del radar), x2=R3+15 (punta del brazo).
                Con translate(CX,CY)+rotate(θ), las coords locales son: x=distancia al centro.
                Resultado: brazo invisible al centro, esmeralda en la punta. */}
            <linearGradient id={armGradId}
              x1="0" y1="0" x2={R3 + 15} y2="0"
              gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stopColor="var(--accent)" stopOpacity="0"    />
              <stop offset="22%"  stopColor="var(--accent)" stopOpacity="0"    />
              <stop offset="52%"  stopColor="var(--accent)" stopOpacity="0.42" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="1"    />
            </linearGradient>
          </defs>

          {/* Halo de ambiente */}
          <rect width={W} height={H} fill={`url(#${ambGradId})`} />

          {/* Arcos concéntricos */}
          <circle cx={CX} cy={CY} r={R1} fill="none" strokeWidth="0.5"
            style={{ stroke: 'var(--accent)' }} opacity="0.14" />
          <circle cx={CX} cy={CY} r={R2} fill="none" strokeWidth="0.5"
            style={{ stroke: 'var(--accent)' }} opacity="0.09" />
          <circle cx={CX} cy={CY} r={R3} fill="none" strokeWidth="0.5"
            style={{ stroke: 'var(--accent)' }} opacity="0.06" />

          {/* Ticks 30° — exterior */}
          <g opacity="0.14">
            {TICK30.map(deg => {
              const big = deg % 90 === 0;
              const [x1, y1] = pxy(R3 - (big ? 10 : 5), deg);
              const [x2, y2] = pxy(R3, deg);
              return (
                <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2}
                  style={{ stroke: 'var(--accent)' }}
                  strokeWidth={big ? 0.7 : 0.4} />
              );
            })}
          </g>

          {/* Ticks 45° — medio */}
          <g opacity="0.09">
            {TICK45.map(deg => {
              const [x1, y1] = pxy(R2 - 5, deg);
              const [x2, y2] = pxy(R2, deg);
              return (
                <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2}
                  style={{ stroke: 'var(--accent)' }} strokeWidth={0.35} />
              );
            })}
          </g>

          {/* Hub */}
          <line x1={CX - 14} y1={CY} x2={CX + 14} y2={CY}
            style={{ stroke: 'var(--text-tertiary)' }} strokeWidth="0.5" opacity="0.30" />
          <line x1={CX} y1={CY - 14} x2={CX} y2={CY + 14}
            style={{ stroke: 'var(--text-tertiary)' }} strokeWidth="0.5" opacity="0.30" />
          <circle cx={CX} cy={CY} r="3"
            style={{ fill: 'var(--accent)' }} opacity="0.55" />

          {/* Nodos decorativos en los ángulos de las píldoras */}
          {PILLS.map((p, i) => {
            const [nx, ny] = pxy(235, p.angle);
            return (
              <circle key={i} cx={nx} cy={ny} r="2.5"
                style={{ fill: 'var(--accent)' }} opacity="0.16" />
            );
          })}

          {/* Brazo de barrido — invisible al centro, esmeralda al borde */}
          {!reduce && (
            <g transform={`translate(${CX} ${CY})`}>
              <g className={sweepCls}>
                {/* Trail sector (sombra detrás del barrido) */}
                <path d={trailPath(R3 + 15)}
                  style={{ fill: 'var(--accent)' }} opacity="0.035" />
                {/* Halo ancho */}
                <line x1="0" y1="0" x2={R3 + 15} y2="0"
                  stroke={`url(#${armGradId})`}
                  strokeWidth="22" opacity="0.07"
                  strokeLinecap="round" />
                {/* Halo estrecho */}
                <line x1="0" y1="0" x2={R3 + 15} y2="0"
                  stroke={`url(#${armGradId})`}
                  strokeWidth="7" opacity="0.20"
                  strokeLinecap="round" />
                {/* Brazo nítido */}
                <line x1="0" y1="0" x2={R3 + 15} y2="0"
                  stroke={`url(#${armGradId})`}
                  strokeWidth="2" opacity="1"
                  strokeLinecap="round" />
                {/* Punta */}
                <circle cx={R3 + 8} cy="0" r="4"
                  style={{ fill: 'var(--accent)' }} opacity="0.85" />
              </g>
            </g>
          )}
        </svg>
      </div>

      {/* ── Píldoras HTML — z-[5] — encima del radar, debajo del contenido ── */}
      {!reduce && PILLS.map((pill, i) => (
        <div
          key={i}
          aria-hidden="true"
          className={[
            'pointer-events-none absolute z-[5]',
            pill.mobileHide ? 'hidden md:block' : 'block',
            pill.pos,
            pillCss[i].cls,
          ].join(' ')}
        >
          <div className="flex items-center gap-2 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--accent)_28%,transparent)] bg-[color-mix(in_oklab,var(--surface-2)_90%,transparent)] px-3 py-2 [backdrop-filter:blur(8px)]">
            <span className="tabular-nums font-mono text-sm font-bold text-[var(--text-primary)]">
              {pill.quote}
            </span>
            <span className="text-xs font-bold" style={{ color: pill.statusColor }}>
              {pill.status}
            </span>
          </div>
        </div>
      ))}
    </>
  );
}
