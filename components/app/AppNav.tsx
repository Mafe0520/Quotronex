'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { FileText, Users, BookOpen, Settings } from 'lucide-react';
import { useT } from '@/lib/i18n';

export function AppNav() {
  const pathname = usePathname();
  const tr = useT();

  const NAV = [
    { href: '/app',            label: tr.nav.quotes,    Icon: FileText, exact: true  },
    { href: '/app/customers',  label: tr.nav.customers, Icon: Users,    exact: false },
    { href: '/app/price-book', label: tr.nav.priceBook, Icon: BookOpen, exact: false },
    { href: '/app/settings',   label: tr.nav.settings,  Icon: Settings, exact: false },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-10 flex border-t border-[color-mix(in_oklab,var(--text-tertiary)_15%,transparent)] bg-[var(--bg)]">
      {NAV.map(({ href, label, Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className="relative flex flex-1 flex-col items-center gap-1 py-3 [touch-action:manipulation]"
          >
            {active && (
              <motion.div
                layoutId="nav-indicator"
                className="absolute top-0 h-0.5 w-8 rounded-full bg-[var(--accent)]"
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              />
            )}
            <Icon
              size={22}
              strokeWidth={active ? 2.2 : 1.6}
              color={active ? 'var(--accent)' : 'var(--text-tertiary)'}
            />
            <span className={`text-xs font-semibold ${active ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'}`}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
