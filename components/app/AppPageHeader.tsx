'use client';

import Link from 'next/link';
import { useT } from '@/lib/i18n';

type SectionKey = 'customers' | 'priceBook' | 'settings' | 'quotes';

interface Props {
  section: SectionKey;
  newHref?: string;
}

export function AppPageHeader({ section, newHref }: Props) {
  const tr = useT();

  const titles: Record<SectionKey, string> = {
    customers: tr.customers.title,
    priceBook: tr.priceBook.title,
    settings:  tr.settings.title,
    quotes:    tr.quotes.title,
  };

  return (
    <header className="flex h-14 items-center justify-between px-5">
      <h1 className="text-lg font-bold [font-family:var(--font-display)] text-[var(--text-primary)]">
        {titles[section]}
      </h1>
      {newHref && (
        <Link
          href={newHref}
          className="flex h-9 items-center gap-1.5 rounded-full bg-[var(--accent)] px-4 text-xs font-bold text-white [touch-action:manipulation]"
        >
          + {tr.common.new}
        </Link>
      )}
    </header>
  );
}
