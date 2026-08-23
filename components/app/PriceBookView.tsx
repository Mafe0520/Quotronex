'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Package, Plus, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useT } from '@/lib/i18n';

type Item = { id: string; name: string; price_cents: number; unit: string | null; trade: string | null; active: boolean };

const fmtPrice = (c: number) =>
  `$${(c / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const t = { duration: 0.2, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] };

export function PriceBookView({ items }: { items: Item[] }) {
  const [q, setQ] = useState('');
  const tr = useT();

  const filtered = q.trim()
    ? items.filter(i => i.name.toLowerCase().includes(q.toLowerCase()) || i.trade?.toLowerCase().includes(q.toLowerCase()))
    : items;

  const trades = [...new Set(filtered.map(i => i.trade ?? 'General'))].sort();

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
        <Link
          href="/app/price-book/new"
          className="mt-2 flex h-12 items-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] px-6 text-sm font-bold text-white [box-shadow:var(--shadow-cta)] [touch-action:manipulation]"
        >
          <Plus size={16} />
          {tr.priceBook.addService}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-5 pt-1 pb-6">
      {/* Search + add */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="search"
            placeholder={tr.priceBook.searchPh}
            value={q}
            onChange={e => setQ(e.target.value)}
            className="h-11 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--surface)] pl-9 pr-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[color-mix(in_oklab,var(--accent)_15%,transparent)]"
          />
        </div>
        <Link
          href="/app/price-book/new"
          className="flex h-11 items-center gap-1.5 rounded-[var(--radius-button)] bg-[var(--accent)] px-4 text-xs font-bold text-white [touch-action:manipulation]"
        >
          <Plus size={15} />
          {tr.priceBook.add}
        </Link>
      </div>

      {filtered.length === 0 && (
        <p className="py-8 text-center text-sm text-[var(--text-tertiary)]">{tr.priceBook.noResults} "{q}"</p>
      )}

      {trades.map(trade => {
        const tradeItems = filtered.filter(i => (i.trade ?? 'General') === trade);
        return (
          <div key={trade} className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">{trade}</p>
            {tradeItems.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                transition={{ ...t, delay: i * 0.03 }}
              >
                <Link
                  href={`/app/price-book/${item.id}/edit`}
                  className="flex items-center gap-3 rounded-2xl bg-[var(--surface)] p-4 [touch-action:manipulation]"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--accent)_8%,transparent)]">
                    <Package size={15} color="var(--accent)" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{item.name}</p>
                    {item.unit && <p className="text-xs text-[var(--text-tertiary)]">{tr.priceBook.perUnit} {item.unit}</p>}
                  </div>
                  <span className="shrink-0 text-sm font-bold tabular-nums [font-family:var(--font-display)] text-[var(--text-primary)]">
                    {fmtPrice(item.price_cents)}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
