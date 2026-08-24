'use client';

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Package, Plus, BookOpen, Star, Archive, ChevronRight, Eye, EyeOff, Clock, Upload } from 'lucide-react';
import Link from 'next/link';
import { useT } from '@/lib/i18n';
import { toggleFavorite, toggleActive } from '@/app/actions/price-book';
import { PriceBookImport } from '@/components/app/PriceBookImport';

type Item = {
  id: string;
  name: string;
  price_cents: number;
  unit: string | null;
  trade: string | null;
  description: string | null;
  active: boolean;
  favorite: boolean;
  is_optional: boolean;
  archived_at: string | null;
  last_used_at: string | null;
};

const fmtPrice = (c: number) =>
  `$${(c / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const anim = { duration: 0.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

function ItemRow({ item }: { item: Item }) {
  const [starring, startStar] = useTransition();
  const [toggling, startToggle] = useTransition();

  return (
    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={anim}
      className="flex items-center gap-3 rounded-2xl bg-[var(--surface)] p-4">
      {/* Favorite star */}
      <button onClick={() => startStar(async () => { await toggleFavorite(item.id, item.favorite); })}
        disabled={starring}
        className="flex size-8 shrink-0 items-center justify-center rounded-xl hover:bg-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)]">
        <Star size={15}
          fill={item.favorite ? '#f59e0b' : 'none'}
          color={item.favorite ? '#f59e0b' : 'var(--text-tertiary)'} />
      </button>

      {/* Info */}
      <Link href={`/app/price-book/${item.id}/edit`} className="min-w-0 flex-1">
        <p className={`truncate text-sm font-semibold ${item.active ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)] line-through'}`}>
          {item.name}
        </p>
        <div className="flex items-center gap-2">
          {item.trade && <span className="text-[10px] font-semibold text-[var(--text-tertiary)]">{item.trade}</span>}
          {item.unit && <span className="text-[10px] text-[var(--text-tertiary)]">· por {item.unit}</span>}
          {item.is_optional && <span className="text-[10px] font-semibold text-amber-500">Opcional</span>}
        </div>
        {item.description && (
          <p className="mt-0.5 truncate text-[10px] text-[var(--text-tertiary)]">{item.description}</p>
        )}
      </Link>

      <span className="shrink-0 text-sm font-bold tabular-nums [font-family:var(--font-display)] text-[var(--text-primary)]">
        {fmtPrice(item.price_cents)}
      </span>

      {/* Active toggle */}
      <button onClick={() => startToggle(async () => { await toggleActive(item.id, item.active); })}
        disabled={toggling}
        className="flex size-8 shrink-0 items-center justify-center rounded-xl hover:bg-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)]"
        title={item.active ? 'Desactivar' : 'Activar'}>
        {item.active
          ? <Eye size={15} color="var(--accent)" />
          : <EyeOff size={15} color="var(--text-tertiary)" />}
      </button>

      <Link href={`/app/price-book/${item.id}/edit`}
        className="flex size-8 shrink-0 items-center justify-center text-[var(--text-tertiary)]">
        <ChevronRight size={15} />
      </Link>
    </motion.div>
  );
}

export function PriceBookView({ items: initialItems }: { items: Item[] }) {
  const [items, setItems] = useState(initialItems);
  const [q, setQ] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Todas');
  const [showImport, setShowImport] = useState(false);
  const tr = useT();

  const visible = (items as Item[]).filter(i => showArchived ? !!i.archived_at : !i.archived_at);
  const archivedCount = items.filter(i => !!i.archived_at).length;

  const favorites = visible.filter(i => i.favorite && i.active);

  // Items used in the last 30 days, sorted most-recent first, max 5
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const recents = visible
    .filter(i => i.active && i.last_used_at && i.last_used_at > thirtyDaysAgo)
    .sort((a, b) => (b.last_used_at ?? '').localeCompare(a.last_used_at ?? ''))
    .slice(0, 5)

  const filtered = visible.filter(i => {
    const matchCat = activeCategory === 'Todas' || (i.trade ?? 'General') === activeCategory;
    const matchQ = !q.trim() ||
      i.name.toLowerCase().includes(q.toLowerCase()) ||
      i.trade?.toLowerCase().includes(q.toLowerCase()) ||
      i.description?.toLowerCase().includes(q.toLowerCase());
    return matchCat && matchQ;
  });

  const trades = ['Todas', ...([...new Set(visible.map(i => i.trade ?? 'General'))].sort())];

  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 py-20 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]">
          <BookOpen size={28} color="var(--accent)" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-base font-bold text-[var(--text-primary)]">{tr.priceBook.emptyTitle}</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{tr.priceBook.emptySub}</p>
        </div>
        <div className="flex flex-col gap-2 w-full max-w-xs">
          <Link href="/app/price-book/new"
            className="flex h-12 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] px-6 text-sm font-bold text-white [box-shadow:var(--shadow-cta)]">
            <Plus size={16} /> {tr.priceBook.addService}
          </Link>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowImport(true)}
            className="flex h-12 items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--surface)] text-sm font-semibold text-[var(--text-secondary)]">
            <Upload size={15} /> Importar lista existente
          </motion.button>
        </div>
        <AnimatePresence>
          {showImport && (
            <PriceBookImport onClose={() => setShowImport(false)} onDone={() => { setShowImport(false); window.location.reload(); }} />
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-5 pt-1 pb-24">
      {/* Search + add */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input type="search" placeholder={tr.priceBook.searchPh} value={q} onChange={e => setQ(e.target.value)}
            className="h-11 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--surface)] pl-9 pr-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[color-mix(in_oklab,var(--accent)_15%,transparent)]" />
        </div>
        <motion.button whileTap={{ scale: 0.94 }} onClick={() => setShowImport(true)}
          className="flex h-11 items-center gap-1.5 rounded-[var(--radius-button)] bg-[var(--surface)] border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] px-3 text-xs font-bold text-[var(--text-secondary)]">
          <Upload size={14} /> Importar
        </motion.button>
        <Link href="/app/price-book/new"
          className="flex h-11 items-center gap-1.5 rounded-[var(--radius-button)] bg-[var(--accent)] px-4 text-xs font-bold text-white">
          <Plus size={15} /> {tr.priceBook.add}
        </Link>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5 scrollbar-none">
        {trades.map(t => (
          <button key={t} onClick={() => setActiveCategory(t)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeCategory === t
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--surface)] text-[var(--text-secondary)]'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* Archived toggle */}
      {archivedCount > 0 && (
        <button onClick={() => setShowArchived(v => !v)}
          className="flex items-center gap-1.5 self-start text-xs font-semibold text-[var(--accent)]">
          <Archive size={12} />
          {showArchived ? 'Ver activos' : `Ver archivados (${archivedCount})`}
        </button>
      )}

      {/* Favorites + Recents sections */}
      <AnimatePresence>
        {!showArchived && !q.trim() && activeCategory === 'Todas' && favorites.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <Star size={12} fill="#f59e0b" color="#f59e0b" />
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Favoritos</p>
            </div>
            {favorites.map(item => <ItemRow key={item.id} item={item} />)}
          </motion.div>
        )}
        {!showArchived && !q.trim() && activeCategory === 'Todas' && recents.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <Clock size={12} color="var(--text-tertiary)" />
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Usados recientemente</p>
            </div>
            {recents.map(item => <ItemRow key={item.id} item={item} />)}
          </motion.div>
        )}
      </AnimatePresence>

      {/* No results */}
      {filtered.length === 0 && q.trim() && (
        <p className="py-8 text-center text-sm text-[var(--text-tertiary)]">{tr.priceBook.noResults} "{q}"</p>
      )}

      {/* Main list grouped by trade */}
      {[...new Set(filtered.map(i => i.trade ?? 'General'))].sort().map(trade => (
        <div key={trade} className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">{trade}</p>
          {filtered.filter(i => (i.trade ?? 'General') === trade).map(item => (
            <ItemRow key={item.id} item={item} />
          ))}
        </div>
      ))}

      <AnimatePresence>
        {showImport && (
          <PriceBookImport
            onClose={() => setShowImport(false)}
            onDone={(count) => {
              setShowImport(false);
              if (count > 0) window.location.reload();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
