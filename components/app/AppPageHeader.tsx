'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { useT } from '@/lib/i18n';

type SectionKey = 'customers' | 'priceBook' | 'settings' | 'quotes';

interface Props {
  section: SectionKey;
  newHref?: string;
  backHref?: string;
}

export function AppPageHeader({ section, newHref, backHref = '/app' }: Props) {
  const tr = useT();
  const router = useRouter();

  const titles: Record<SectionKey, string> = {
    customers: tr.customers.title,
    priceBook: tr.priceBook.title,
    settings:  tr.settings.title,
    quotes:    tr.quotes.title,
  };

  return (
    <header className="flex h-14 items-center justify-between px-4 border-b border-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)]">
      <button onClick={() => router.push(backHref)}
        className="flex size-10 items-center justify-center rounded-full hover:bg-[var(--surface)] [touch-action:manipulation]">
        <ChevronLeft size={20} color="var(--text-secondary)" />
      </button>
      <h1 className="text-base font-bold [font-family:var(--font-display)] text-[var(--text-primary)]">
        {titles[section]}
      </h1>
      {newHref ? (
        <Link href={newHref}
          className="flex h-9 items-center gap-1.5 rounded-full bg-[var(--accent)] px-4 text-xs font-bold text-white [touch-action:manipulation]">
          + {tr.common.new}
        </Link>
      ) : <div className="w-10" />}
    </header>
  );
}
