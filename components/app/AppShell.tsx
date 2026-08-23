'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText, BookOpen, Briefcase, Settings,
  Plus, ChevronRight, CheckCircle2, Clock, Send,
  MoreHorizontal, DollarSign, TrendingUp,
  Package, LogOut, User, Bell, ShieldCheck,
} from 'lucide-react';
import { signOut } from '@/app/actions/auth';
import type { Quote, PriceBookItem } from '@/app/app/page';

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface AppUser { id: string; email: string; firstName: string }
interface Business { id: string; name: string }

interface Props {
  user: AppUser;
  business: Business | null;
  quotes: Quote[];
  priceBookItems: PriceBookItem[];
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft:     { label: 'Draft',     color: 'text-[var(--text-tertiary)] bg-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)]', icon: <MoreHorizontal size={11} /> },
  sent:      { label: 'Sent',      color: 'text-blue-600 bg-blue-50',    icon: <Send size={11} /> },
  viewed:    { label: 'Viewed',    color: 'text-amber-600 bg-amber-50',  icon: <Clock size={11} /> },
  accepted:  { label: 'Accepted',  color: 'text-green-700 bg-green-50',  icon: <CheckCircle2 size={11} /> },
  declined:  { label: 'Declined',  color: 'text-red-600 bg-red-50',      icon: <MoreHorizontal size={11} /> },
  expired:   { label: 'Expired',   color: 'text-[var(--text-tertiary)] bg-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)]', icon: <Clock size={11} /> },
  converted: { label: 'Job',       color: 'text-purple-700 bg-purple-50', icon: <DollarSign size={11} /> },
};

const fmt = (cents: number) => {
  const n = cents / 100;
  return n >= 1000 ? `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `$${n.toLocaleString()}`;
};

const fmtPrice = (cents: number) =>
  `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const relativeDate = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const h = diff / 36e5;
  if (h < 1) return 'Just now';
  if (h < 24) return `${Math.floor(h)}h ago`;
  if (h < 48) return 'Yesterday';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const transition = { duration: 0.22, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

/* ─── Quotes tab ─────────────────────────────────────────────────────────── */

function QuotesTab({ quotes }: { quotes: Quote[] }) {
  const won    = quotes.filter(q => q.status === 'accepted' || q.status === 'converted');
  const wonAmt = won.reduce((s, q) => s + q.total_cents, 0);
  const sent   = quotes.filter(q => ['sent', 'viewed', 'accepted', 'converted'].includes(q.status)).length;
  const winRate = sent > 0 ? Math.round(won.length / sent * 100) : 0;

  if (quotes.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 py-20 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]">
          <FileText size={28} color="var(--accent)" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-base font-bold text-[var(--text-primary)]">No quotes yet</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Tap the button below to generate your first quote in 30 seconds.</p>
        </div>
        <motion.a
          href="/onboarding"
          whileTap={{ scale: 0.97 }}
          className="mt-2 flex h-12 items-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] px-6 text-sm font-bold text-white [box-shadow:var(--shadow-cta)] [touch-action:manipulation]"
        >
          <Plus size={16} />
          Create first quote
        </motion.a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-5 pt-5 pb-32">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Won this month', value: fmt(wonAmt), sub: 'revenue', Icon: TrendingUp },
          { label: 'Win rate',       value: `${winRate}%`, sub: 'of sent quotes', Icon: CheckCircle2 },
          { label: 'Sent',           value: String(sent), sub: 'quotes out', Icon: Send },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ ...transition, delay: i * 0.06 }}
            className="flex flex-col gap-1 rounded-2xl bg-[var(--surface)] p-3"
          >
            <s.Icon size={14} color="var(--accent)" strokeWidth={2} />
            <span className="text-xl font-bold tabular-nums [font-family:var(--font-display)] text-[var(--text-primary)]">{s.value}</span>
            <span className="text-xs leading-tight text-[var(--text-tertiary)]">{s.sub}</span>
          </motion.div>
        ))}
      </div>

      {/* List header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Recent</h2>
        <span className="text-xs text-[var(--text-tertiary)]">{quotes.length} quotes</span>
      </div>

      {/* Quote cards */}
      <div className="flex flex-col gap-2">
        {quotes.map((q, i) => {
          const meta = STATUS_META[q.status] ?? STATUS_META.draft;
          const initials = (q.clients?.name ?? 'Q').slice(0, 1).toUpperCase();
          const desc = q.quote_items.slice(0, 2).map(it => it.name).join(' · ') || 'No items';
          return (
            <motion.button
              key={q.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ ...transition, delay: 0.1 + i * 0.05 }}
              whileTap={{ scale: 0.985 }}
              className="flex items-center gap-3 rounded-2xl bg-[var(--surface)] p-4 text-left [touch-action:manipulation]"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]">
                <span className="text-sm font-bold text-[var(--accent)]">{initials}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold text-[var(--text-primary)]">
                    {q.clients?.name ?? 'No client'}
                  </span>
                  <span className={`ml-auto flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${meta.color}`}>
                    {meta.icon}{meta.label}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-[var(--text-tertiary)]">{desc}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-sm font-bold tabular-nums [font-family:var(--font-display)] text-[var(--text-primary)]">
                    {fmt(q.total_cents)}
                  </span>
                  <span className="text-xs text-[var(--text-tertiary)]">· {relativeDate(q.created_at)}</span>
                </div>
              </div>
              <ChevronRight size={16} className="shrink-0 text-[var(--text-tertiary)]" />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Price Book tab ─────────────────────────────────────────────────────── */

function PriceBookTab({ items }: { items: PriceBookItem[] }) {
  const trades = [...new Set(items.map(i => i.trade ?? 'General'))].sort();

  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 py-20 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]">
          <BookOpen size={28} color="var(--accent)" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-base font-bold text-[var(--text-primary)]">Your Price Book is empty</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Add your first service to start generating accurate quotes instantly.</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          className="mt-2 flex h-12 items-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] px-6 text-sm font-bold text-white [box-shadow:var(--shadow-cta)] [touch-action:manipulation]"
        >
          <Plus size={16} />
          Add first service
        </motion.button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-5 pt-5 pb-32">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-[var(--text-primary)]">{items.length} services</h2>
        <motion.button
          whileTap={{ scale: 0.97 }}
          className="flex h-9 items-center gap-1.5 rounded-full bg-[var(--accent)] px-4 text-xs font-bold text-white [touch-action:manipulation]"
        >
          <Plus size={14} />
          Add service
        </motion.button>
      </div>

      {trades.map(trade => {
        const tradeItems = items.filter(i => (i.trade ?? 'General') === trade);
        return (
          <div key={trade} className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">{trade}</p>
            {tradeItems.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ ...transition, delay: i * 0.04 }}
                className="flex items-center gap-3 rounded-2xl bg-[var(--surface)] p-4"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--accent)_8%,transparent)]">
                  <Package size={16} color="var(--accent)" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{item.name}</p>
                  {item.unit && <p className="text-xs text-[var(--text-tertiary)]">per {item.unit}</p>}
                </div>
                <span className="shrink-0 text-sm font-bold tabular-nums [font-family:var(--font-display)] text-[var(--text-primary)]">
                  {fmtPrice(item.price_cents)}
                </span>
              </motion.div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Settings tab ───────────────────────────────────────────────────────── */

function SettingsTab({ user, business }: { user: AppUser; business: Business | null }) {
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
  }

  const rows = [
    { Icon: User,       label: 'Account',       sub: user.email },
    { Icon: Bell,       label: 'Notifications',  sub: 'Manage alerts' },
    { Icon: ShieldCheck, label: 'Subscription',  sub: 'Manage plan & billing' },
  ];

  return (
    <div className="flex flex-col gap-5 px-5 pt-5 pb-32">
      {/* Business name */}
      {business && (
        <div className="rounded-2xl bg-[var(--surface)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Business</p>
          <p className="mt-1 text-base font-bold text-[var(--text-primary)]">{business.name}</p>
        </div>
      )}

      {/* Settings rows */}
      <div className="flex flex-col gap-2">
        {rows.map(({ Icon, label, sub }) => (
          <motion.button
            key={label}
            whileTap={{ scale: 0.985 }}
            className="flex items-center gap-3 rounded-2xl bg-[var(--surface)] p-4 text-left [touch-action:manipulation]"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--accent)_8%,transparent)]">
              <Icon size={16} color="var(--accent)" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--text-primary)]">{label}</p>
              <p className="truncate text-xs text-[var(--text-tertiary)]">{sub}</p>
            </div>
            <ChevronRight size={16} className="shrink-0 text-[var(--text-tertiary)]" />
          </motion.button>
        ))}
      </div>

      {/* Sign out */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        disabled={signingOut}
        onClick={handleSignOut}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] border border-red-200 text-sm font-semibold text-red-600 disabled:opacity-50 [touch-action:manipulation]"
      >
        <LogOut size={16} />
        {signingOut ? 'Signing out…' : 'Sign out'}
      </motion.button>
    </div>
  );
}

/* ─── Nav ────────────────────────────────────────────────────────────────── */

const NAV = [
  { id: 'quotes',    label: 'Quotes',     Icon: FileText  },
  { id: 'pricebook', label: 'Price Book', Icon: BookOpen  },
  { id: 'jobs',      label: 'Jobs',       Icon: Briefcase },
  { id: 'settings',  label: 'Settings',   Icon: Settings  },
] as const;

type Tab = typeof NAV[number]['id'];

/* ─── Shell ──────────────────────────────────────────────────────────────── */

export function AppShell({ user, business, quotes, priceBookItems }: Props) {
  const [tab, setTab] = useState<Tab>('quotes');

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg)]">
      {/* Top bar */}
      <header className="flex h-14 items-center justify-between px-5">
        <div>
          <p className="text-xs text-[var(--text-tertiary)]">{greeting} 👋</p>
          <p className="text-sm font-bold [font-family:var(--font-display)] text-[var(--text-primary)]">
            {user.firstName}
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-sm font-bold [font-family:var(--font-display)] text-[var(--text-primary)]">
          <span className="size-5 rounded bg-[var(--accent)]" aria-hidden />
          Quotronex
        </span>
      </header>

      {/* Content */}
      <main className="flex flex-1 flex-col overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            className="flex flex-1 flex-col"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            {tab === 'quotes'    && <QuotesTab quotes={quotes} />}
            {tab === 'pricebook' && <PriceBookTab items={priceBookItems} />}
            {tab === 'jobs'      && (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-[var(--text-tertiary)]">
                <Briefcase size={32} strokeWidth={1.5} />
                <p className="text-sm font-medium">Jobs — coming soon</p>
              </div>
            )}
            {tab === 'settings'  && <SettingsTab user={user} business={business} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* FAB — New Quote */}
      {tab === 'quotes' && (
        <div className="fixed bottom-20 right-5 z-20">
          <motion.a
            href="/onboarding"
            whileTap={{ scale: 0.93 }}
            className="flex h-14 items-center gap-2 rounded-full bg-[var(--accent)] px-5 text-sm font-bold text-white [box-shadow:var(--shadow-cta)] [touch-action:manipulation]"
          >
            <Plus size={18} />
            New Quote
          </motion.a>
        </div>
      )}

      {/* Bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 z-10 flex border-t border-[color-mix(in_oklab,var(--text-tertiary)_15%,transparent)] bg-[var(--bg)]">
        {NAV.map(({ id, label, Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
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
            </button>
          );
        })}
      </nav>
    </div>
  );
}
