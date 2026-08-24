'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, ChevronLeft, Briefcase, Search, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Job = {
  id: string;
  title: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  quotes: { total_cents: number; clients: { name: string } | null } | null;
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  scheduled:   { label: 'Programado',   color: 'bg-blue-50 text-blue-700' },
  in_progress: { label: 'En progreso',  color: 'bg-amber-50 text-amber-700' },
  completed:   { label: 'Completado',   color: 'bg-green-50 text-green-700' },
  on_hold:     { label: 'En pausa',     color: 'bg-gray-100 text-gray-600' },
  canceled:    { label: 'Cancelado',    color: 'bg-red-50 text-red-600' },
};

const FILTERS = ['Todos', 'Programado', 'En progreso', 'Completado', 'En pausa', 'Cancelado'];
const FILTER_MAP: Record<string, string> = {
  'Programado': 'scheduled', 'En progreso': 'in_progress',
  'Completado': 'completed', 'En pausa': 'on_hold', 'Cancelado': 'canceled',
};

const fmt = (c: number) => `$${(c / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
const transition = { duration: 0.25, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

export function JobsListClient({ jobs }: { jobs: Job[] }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('Todos');

  const visible = jobs.filter(j => {
    const matchStatus = filter === 'Todos' || j.status === FILTER_MAP[filter];
    const title = j.title ?? j.quotes?.clients?.name ?? '';
    const matchQ = !q.trim() || title.toLowerCase().includes(q.toLowerCase());
    return matchStatus && matchQ;
  });

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg)]">
      <header className="flex h-14 items-center justify-between px-4 border-b border-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)]">
        <button onClick={() => router.push('/app')}
          className="flex size-10 items-center justify-center rounded-full hover:bg-[var(--surface)]">
          <ChevronLeft size={20} color="var(--text-secondary)" />
        </button>
        <h1 className="text-base font-bold [font-family:var(--font-display)] text-[var(--text-primary)]">Trabajos</h1>
        <a href="/app" className="flex size-10 items-center justify-center rounded-full bg-[var(--accent)]" title="Nueva cotización">
          <Plus size={18} color="white" />
        </a>
      </header>

      <div className="flex flex-col gap-4 p-5">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input value={q} onChange={e => setQ(e.target.value)}
            placeholder="Buscar trabajo..."
            className="h-11 w-full rounded-2xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--surface)] pl-9 pr-4 text-sm outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)]" />
        </div>

        {/* Status filter pills */}
        <div className="flex gap-2 overflow-x-auto -mx-5 px-5 scrollbar-none">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === f ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface)] text-[var(--text-secondary)]'
              }`}>{f}</button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
            {visible.length} de {jobs.length} trabajos
          </span>
        </div>

        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <Briefcase size={36} className="text-[var(--text-tertiary)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--text-secondary)]">Sin trabajos</p>
              <p className="mt-1 text-xs text-[var(--text-tertiary)]">Los trabajos se crean al aceptar una cotización</p>
            </div>
            <a href="/app" className="flex items-center gap-2 rounded-2xl bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-white">
              <Plus size={15} /> Nueva cotización
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {visible.map((job, i) => {
              const meta = STATUS_META[job.status] ?? STATUS_META.scheduled;
              const title = job.title ?? job.quotes?.clients?.name ?? 'Trabajo';
              const client = job.quotes?.clients?.name;
              const total = job.quotes?.total_cents;
              return (
                <motion.a key={job.id} href={`/app/jobs/${job.id}`}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ ...transition, delay: i * 0.04 }}
                  whileTap={{ scale: 0.985 }}
                  className="flex items-center gap-3 rounded-2xl bg-[var(--surface)] p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]">
                    <Briefcase size={18} color="var(--accent)" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-[var(--text-primary)]">{title}</span>
                      <span className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${meta.color}`}>{meta.label}</span>
                    </div>
                    {client && <p className="mt-0.5 truncate text-xs text-[var(--text-tertiary)]">{client}</p>}
                    {total !== undefined && (
                      <p className="mt-1 text-sm font-bold tabular-nums [font-family:var(--font-display)] text-[var(--accent)]">{fmt(total)}</p>
                    )}
                  </div>
                  <ChevronRight size={16} className="shrink-0 text-[var(--text-tertiary)]" />
                </motion.a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
