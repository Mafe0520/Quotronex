'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, User, Briefcase, FileText, BookOpen, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Result = { type: string; id: string; title: string; sub: string; href: string };

const TYPE_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  client: { label: 'Cliente',      icon: <User size={13} />,      color: 'bg-sky-50 text-sky-600' },
  job:    { label: 'Trabajo',      icon: <Briefcase size={13} />, color: 'bg-amber-50 text-amber-700' },
  quote:  { label: 'Cotización',   icon: <FileText size={13} />,  color: 'bg-purple-50 text-purple-700' },
  price:  { label: 'Catálogo',     icon: <BookOpen size={13} />,  color: 'bg-green-50 text-green-700' },
};

export function GlobalSearch({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const search = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) { setResults([]); setLoading(false); return; }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results ?? []);
      } finally {
        setLoading(false);
      }
    }, 280);
  }, []);

  useEffect(() => { search(q); }, [q, search]);

  function navigate(href: string) {
    onClose();
    router.push(href);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-[var(--bg)]"
    >
      {/* Search bar */}
      <div className="flex items-center gap-3 px-4 pt-safe-top pt-3 pb-3 border-b border-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)]">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar clientes, trabajos, cotizaciones..."
            className="h-11 w-full rounded-2xl bg-[var(--surface)] pl-10 pr-10 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:ring-2 focus:ring-[color-mix(in_oklab,var(--accent)_20%,transparent)]"
          />
          {q && (
            <button onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
              <X size={15} />
            </button>
          )}
        </div>
        <button onClick={onClose} className="text-sm font-semibold text-[var(--accent)]">Cancelar</button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {/* Loading */}
        {loading && q.length >= 2 && (
          <div className="flex items-center gap-2 py-4 text-sm text-[var(--text-tertiary)]">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
              className="size-4 rounded-full border-2 border-[color-mix(in_oklab,var(--accent)_25%,transparent)] border-t-[var(--accent)]" />
            Buscando…
          </div>
        )}

        {/* Empty */}
        {!loading && q.length >= 2 && results.length === 0 && (
          <div className="py-10 text-center">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Sin resultados para "{q}"</p>
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">Intenta con otro nombre o número</p>
          </div>
        )}

        {/* Hint */}
        {q.length < 2 && (
          <div className="py-8 flex flex-col gap-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Busca en toda la app</p>
            {Object.entries(TYPE_META).map(([type, meta]) => (
              <div key={type} className="flex items-center gap-3">
                <div className={`flex size-8 items-center justify-center rounded-xl ${meta.color}`}>{meta.icon}</div>
                <p className="text-sm text-[var(--text-secondary)]">{meta.label}s</p>
              </div>
            ))}
          </div>
        )}

        {/* Results list */}
        <AnimatePresence>
          {results.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
              {/* Group by type */}
              {(['client', 'job', 'quote', 'price'] as const).map(type => {
                const group = results.filter(r => r.type === type);
                if (!group.length) return null;
                const meta = TYPE_META[type];
                return (
                  <div key={type} className="flex flex-col gap-1">
                    <p className="mt-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">{meta.label}s</p>
                    {group.map(r => (
                      <motion.button key={r.id} whileTap={{ scale: 0.98 }}
                        onClick={() => navigate(r.href)}
                        className="flex items-center gap-3 rounded-2xl bg-[var(--surface)] p-3.5 text-left w-full">
                        <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${meta.color}`}>
                          {meta.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{r.title}</p>
                          {r.sub && <p className="text-xs text-[var(--text-tertiary)] truncate">{r.sub}</p>}
                        </div>
                        <ArrowRight size={14} className="shrink-0 text-[var(--text-tertiary)]" />
                      </motion.button>
                    ))}
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
