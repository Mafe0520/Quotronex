'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Search, ChevronRight, Users, Plus } from 'lucide-react';
import { useT } from '@/lib/i18n';

type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  projects: { id: string; archived_at: string | null }[];
};

interface Props { customers: Customer[] }

const anim = { duration: 0.2, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] };

export function CustomerList({ customers }: Props) {
  const tr = useT();
  const [q, setQ] = useState('');

  const filtered = q.trim()
    ? customers.filter(c =>
        c.name.toLowerCase().includes(q.toLowerCase()) ||
        c.email?.toLowerCase().includes(q.toLowerCase()) ||
        c.phone?.includes(q)
      )
    : customers;

  if (customers.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 py-20 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]">
          <Users size={28} color="var(--accent)" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-base font-bold text-[var(--text-primary)]">{tr.customers.emptyTitle}</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{tr.customers.emptySub}</p>
        </div>
        <Link
          href="/app/customers/new"
          className="mt-2 flex h-12 items-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] px-6 text-sm font-bold text-white [box-shadow:var(--shadow-cta)] [touch-action:manipulation]"
        >
          <Plus size={16} />
          {tr.customers.addCustomer}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-5 pt-2 pb-4">
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
        <input
          type="search"
          placeholder={tr.customers.searchPh}
          value={q}
          onChange={e => setQ(e.target.value)}
          className="h-11 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--surface)] pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[color-mix(in_oklab,var(--accent)_15%,transparent)]"
        />
      </div>

      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
        {filtered.length} {filtered.length === 1 ? tr.customers.title.slice(0, -1) : tr.customers.title}
      </p>

      <div className="flex flex-col gap-2">
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-[var(--text-tertiary)]">{tr.customers.noResults} "{q}"</p>
        )}
        {filtered.map((c, i) => {
          const initials = c.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
          const activeProjects = c.projects.filter(p => !p.archived_at).length;
          const contact = c.phone ?? c.email;

          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...anim, delay: i * 0.04 }}
            >
              <Link
                href={`/app/customers/${c.id}`}
                className="flex items-center gap-3 rounded-2xl bg-[var(--surface)] p-4 [touch-action:manipulation]"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]">
                  <span className="text-sm font-bold text-[var(--accent)]">{initials}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{c.name}</p>
                  {contact && <p className="mt-0.5 truncate text-xs text-[var(--text-tertiary)]">{contact}</p>}
                  {activeProjects > 0 && (
                    <span className="mt-1 inline-flex items-center rounded-full bg-[color-mix(in_oklab,var(--accent)_8%,transparent)] px-2 py-0.5 text-xs font-semibold text-[var(--accent)]">
                      {tr.customers.activeProjects(activeProjects)}
                    </span>
                  )}
                </div>
                <ChevronRight size={16} className="shrink-0 text-[var(--text-tertiary)]" />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
