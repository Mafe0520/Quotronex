'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Receipt, Settings, Briefcase, Search } from 'lucide-react';
import { useState } from 'react';
import { GlobalSearch } from '@/components/app/GlobalSearch';
import { useT } from '@/lib/i18n';

export function AppNav() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const tr = useT();

  const NAV = [
    { href: '/app',          label: tr.nav.quotes,   Icon: FileText,  match: (p: string) => p === '/app' },
    { href: '/app/invoices', label: tr.nav.invoices,  Icon: Receipt,   match: (p: string) => p.startsWith('/app/invoices') },
    { search: true,          label: tr.nav.search,    Icon: Search,    match: () => false },
    { href: '/app/jobs',     label: tr.nav.jobs,      Icon: Briefcase, match: (p: string) => p.startsWith('/app/jobs') },
    { href: '/app/settings', label: tr.nav.settings,  Icon: Settings,  match: (p: string) => p.startsWith('/app/settings') },
  ] as const;

  return (
    <>
      <nav className="fixed bottom-0 inset-x-0 z-10 flex border-t border-[color-mix(in_oklab,var(--text-tertiary)_15%,transparent)] bg-[var(--bg)]">
        {NAV.map((item) => {
          if ('search' in item && item.search) {
            return (
              <button key="search" onClick={() => setSearchOpen(true)}
                className="relative flex flex-1 flex-col items-center gap-0.5 py-3 [touch-action:manipulation]">
                <Search size={22} strokeWidth={1.5} color="var(--text-tertiary)" />
                <span className="text-[9px] font-semibold leading-none text-[var(--text-tertiary)]">{item.label}</span>
              </button>
            );
          }
          const { href, label, Icon, match } = item as { href: string; label: string; Icon: typeof FileText; match: (p: string) => boolean };
          const active = match(pathname);
          return (
            <Link key={href} href={href}
              className="relative flex flex-1 flex-col items-center gap-0.5 py-3 [touch-action:manipulation]">
              {active && (
                <motion.div layoutId="appnav-dot"
                  className="absolute top-0 h-0.5 w-6 rounded-full bg-[var(--accent)]"
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }} />
              )}
              <Icon size={22} strokeWidth={active ? 2.2 : 1.5}
                color={active ? 'var(--accent)' : 'var(--text-tertiary)'} />
              <span className={`text-[9px] font-semibold leading-none ${active ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      <AnimatePresence>
        {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
