'use client';

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import {
  Home, FileText, BookOpen, Receipt, Settings, Search, Briefcase,
  Plus, ChevronRight, CheckCircle2, Clock, Send,
  MoreHorizontal, DollarSign, TrendingUp, AlertCircle,
  Package, LogOut, User, Bell, ShieldCheck, Users,
} from 'lucide-react';
import Image from 'next/image';
import { signOut } from '@/app/actions/auth';
import { addPriceBookItem } from '@/app/actions/price-book';
import { ActivationChecklist } from '@/components/app/ActivationChecklist';
import type { Quote, PriceBookItem, InvoiceRow, JobRow, Business } from '@/app/app/page';

interface AppUser { id: string; email: string; firstName: string }
interface Props {
  user: AppUser;
  business: Business | null;
  quotes: Quote[];
  priceBookItems: PriceBookItem[];
  invoices: InvoiceRow[];
  jobs: JobRow[];
  clientCount: number;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const fmt = (cents: number) => {
  const n = cents / 100;
  return n >= 1000 ? `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `$${n.toLocaleString()}`;
};
const fmtFull = (cents: number) =>
  `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
const relDate = (iso: string) => {
  const h = (Date.now() - new Date(iso).getTime()) / 36e5;
  if (h < 1) return 'Hace un momento';
  if (h < 24) return `Hace ${Math.floor(h)}h`;
  if (h < 48) return 'Ayer';
  return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short' });
};
const transition = { duration: 0.22, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

const QUOTE_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft:     { label: 'Borrador',   color: 'text-[var(--text-tertiary)] bg-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)]', icon: <MoreHorizontal size={11} /> },
  sent:      { label: 'Enviada',    color: 'text-blue-600 bg-blue-50',    icon: <Send size={11} /> },
  viewed:    { label: 'Vista',      color: 'text-amber-600 bg-amber-50',  icon: <Clock size={11} /> },
  accepted:  { label: 'Aceptada',   color: 'text-green-700 bg-green-50',  icon: <CheckCircle2 size={11} /> },
  declined:  { label: 'Declinada',  color: 'text-red-600 bg-red-50',      icon: <MoreHorizontal size={11} /> },
  expired:   { label: 'Expirada',   color: 'text-[var(--text-tertiary)] bg-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)]', icon: <Clock size={11} /> },
  converted: { label: 'Facturada',  color: 'text-purple-700 bg-purple-50', icon: <DollarSign size={11} /> },
};
const INV_META: Record<string, { label: string; color: string }> = {
  draft:   { label: 'Borrador',     color: 'text-[var(--text-tertiary)] bg-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)]' },
  sent:    { label: 'Enviada',      color: 'text-blue-600 bg-blue-50' },
  partial: { label: 'Pago parcial', color: 'text-amber-600 bg-amber-50' },
  paid:    { label: 'Pagada',       color: 'text-green-700 bg-green-50' },
  overdue: { label: 'Vencida',      color: 'text-red-600 bg-red-50' },
};

/* ─── Home tab ───────────────────────────────────────────────────────────── */

const JOB_STATUS_META: Record<string, { label: string; color: string; dot: string }> = {
  scheduled:   { label: 'Programado',  color: 'text-blue-600',   dot: 'bg-blue-500'  },
  in_progress: { label: 'En progreso', color: 'text-amber-600',  dot: 'bg-amber-500' },
};

function HomeTab({
  user, business, quotes, invoices, jobs, onTab, router, priceBookItems, clientCount,
}: {
  user: AppUser; business: Business | null; quotes: Quote[]; invoices: InvoiceRow[];
  jobs: JobRow[]; onTab: (t: Tab) => void; router: ReturnType<typeof useRouter>;
  priceBookItems: PriceBookItem[]; clientCount: number;
}) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

  const won        = quotes.filter(q => q.status === 'accepted' || q.status === 'converted');
  const sent       = quotes.filter(q => ['sent','viewed','accepted','converted'].includes(q.status)).length;
  const winRate    = sent > 0 ? Math.round(won.length / sent * 100) : 0;
  const openQuotes = quotes.filter(q => ['sent','viewed'].includes(q.status)).length;
  const paidInvoices = invoices.filter(i => i.status === 'paid');
  const paidRevenue  = paidInvoices.reduce((s, i) => s + i.amount_paid_cents, 0);
  const pendingInv = invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + (i.total_cents - i.amount_paid_cents), 0);
  const overdueInv = invoices.filter(i => i.status === 'overdue' || (i.status !== 'paid' && i.due_at && new Date(i.due_at) < new Date()));
  const inProgressJobs = jobs.filter(j => j.status === 'in_progress');

  const metrics = [
    { label: 'Ingresos cobrados',     value: fmt(paidRevenue),   sub: `${paidInvoices.length} facturas pagadas`, color: '#22c55e',
      path: 'M0,30 C8,28 12,18 20,16 C28,14 32,20 40,14 C48,8 54,4 64,6 C70,8 76,10 80,8 L80,40 L0,40 Z' },
    { label: 'Por cobrar',            value: fmt(pendingInv),    sub: `${invoices.filter(i=>i.status!=='paid').length} facturas`, color: '#f59e0b',
      path: 'M0,20 C6,22 14,30 22,26 C30,22 36,14 44,18 C52,22 58,28 66,22 C72,18 76,20 80,16 L80,40 L0,40 Z' },
    { label: 'Tasa de cierre',        value: `${winRate}%`,      sub: `${sent} cotizaciones enviadas`, color: '#3b82f6',
      path: 'M0,24 C10,26 16,32 24,28 C32,24 38,16 48,20 C56,24 62,30 72,24 C76,22 78,20 80,18 L80,40 L0,40 Z' },
    { label: 'Cotizaciones abiertas', value: String(openQuotes), sub: 'Sin respuesta aún', color: '#10b981',
      path: 'M0,32 C8,30 14,22 22,18 C30,14 36,10 46,8 C54,6 60,10 68,8 C74,6 78,5 80,4 L80,40 L0,40 Z' },
  ];

  const quickActions = [
    { label: 'Nuevo cliente',    Icon: Users,     action: () => router.push('/app/customers/new'),  bg: 'bg-sky-500/15',   ic: '#38bdf8' },
    { label: 'Cotización',       Icon: FileText,  action: () => router.push('/app/quotes/new'),     bg: 'bg-[color-mix(in_oklab,var(--accent)_15%,transparent)]', ic: 'var(--accent)' },
    { label: 'Factura',          Icon: Receipt,   action: () => onTab('invoices'),                  bg: 'bg-green-500/15', ic: '#22c55e' },
    { label: 'Ver trabajos',     Icon: Briefcase, action: () => router.push('/app/jobs'),           bg: 'bg-amber-500/15', ic: '#f59e0b' },
  ];

  /* Recent activity: last 5 quotes sorted by date */
  const recentQuotes = [...quotes].slice(0, 5);

  return (
    <div className="flex flex-col gap-5 px-5 pt-5 pb-32">

      {/* Greeting */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--text-secondary)]">{greeting} 👋</p>
          <p className="text-2xl font-black [font-family:var(--font-display)] text-[var(--text-primary)] leading-tight mt-0.5">
            {business?.name ?? user.firstName}
          </p>
        </div>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface)]">
          <Bell size={18} color="var(--text-secondary)" />
        </div>
      </div>

      {/* Alerts */}
      {overdueInv.length > 0 && (
        <motion.button initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          onClick={() => onTab('invoices')}
          className="flex items-center gap-3 rounded-2xl bg-red-50 px-4 py-3 text-left w-full">
          <AlertCircle size={18} className="shrink-0 text-red-500" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-red-700">
              {overdueInv.length} factura{overdueInv.length > 1 ? 's' : ''} vencida{overdueInv.length > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-red-500">Toca para ver detalles</p>
          </div>
          <ChevronRight size={15} className="shrink-0 text-red-400" />
        </motion.button>
      )}

      {/* Activation checklist — shown only to new users */}
      <ActivationChecklist
        hasBizPhone={!!business?.phone}
        hasBizEmail={!!business?.email}
        hasLogo={!!business?.logo_url}
        priceBookCount={priceBookItems.length}
        clientCount={clientCount}
        sentQuoteCount={quotes.filter(q => ['sent','viewed','accepted','converted'].includes(q.status)).length}
        jobCount={jobs.length}
      />

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((m, i) => (
          <motion.div key={m.label}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ ...transition, delay: i * 0.05 }}
            className="relative overflow-hidden rounded-2xl bg-[var(--surface)] p-4">
            <svg viewBox="0 0 80 40" className="absolute bottom-0 right-0 h-16 w-24 pointer-events-none" preserveAspectRatio="none">
              <defs>
                <linearGradient id={`g${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={m.color} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={m.color} stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <path d={m.path} fill={`url(#g${i})`} />
              <path d={m.path.split(' L')[0]} fill="none" stroke={m.color} strokeWidth="1.5" strokeOpacity="0.5" />
            </svg>
            <p className="relative text-[11px] text-[var(--text-tertiary)] mb-1 font-medium">{m.label}</p>
            <p className="relative text-2xl font-black tabular-nums [font-family:var(--font-display)]" style={{ color: m.color }}>{m.value}</p>
            <p className="relative mt-1 text-[10px] text-[var(--text-tertiary)]">{m.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <motion.button whileTap={{ scale: 0.97 }}
        onClick={() => router.push('/app/quotes/new')}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] text-base font-bold text-white [box-shadow:var(--shadow-cta)]">
        <Plus size={20} /> Nueva cotización
      </motion.button>

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-2 rounded-2xl bg-[var(--surface)] p-4">
        {quickActions.map(({ label, Icon, action, bg, ic }) => (
          <motion.button key={label} whileTap={{ scale: 0.92 }} onClick={action}
            className="flex flex-col items-center gap-2">
            <div className={`flex size-12 items-center justify-center rounded-2xl ${bg}`}>
              <Icon size={20} color={ic} strokeWidth={1.6} />
            </div>
            <span className="text-center text-[10px] leading-tight text-[var(--text-secondary)] font-medium">{label}</span>
          </motion.button>
        ))}
      </div>

      {/* Active jobs */}
      {jobs.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">Trabajos activos</h2>
            <a href="/app/jobs" className="text-xs font-semibold text-[var(--accent)]">Ver todos</a>
          </div>
          <div className="flex flex-col gap-2">
            {jobs.slice(0, 3).map((job, i) => {
              const jm = JOB_STATUS_META[job.status] ?? JOB_STATUS_META.scheduled;
              const clientName = job.quotes?.clients?.name;
              const title = job.title ?? clientName ?? 'Trabajo';
              return (
                <motion.a key={job.id} href={`/app/jobs/${job.id}`}
                  initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ ...transition, delay: i * 0.06 }}
                  whileTap={{ scale: 0.985 }}
                  className="flex items-center gap-3 rounded-2xl bg-[var(--surface)] px-4 py-3">
                  <span className={`size-2 shrink-0 rounded-full ${jm.dot}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{title}</p>
                    {clientName && title !== clientName && (
                      <p className="truncate text-xs text-[var(--text-tertiary)]">{clientName}</p>
                    )}
                  </div>
                  <span className={`text-xs font-semibold ${jm.color}`}>{jm.label}</span>
                  <ChevronRight size={14} className="shrink-0 text-[var(--text-tertiary)]" />
                </motion.a>
              );
            })}
          </div>
        </div>
      )}

      {/* In progress highlight */}
      {inProgressJobs.length > 0 && (
        <div className="rounded-2xl bg-[color-mix(in_oklab,var(--accent)_8%,transparent)] border border-[color-mix(in_oklab,var(--accent)_20%,transparent)] px-4 py-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="size-2 rounded-full bg-amber-500 animate-pulse" />
            <p className="text-xs font-bold text-[var(--accent)] uppercase tracking-wide">En progreso ahora</p>
          </div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {inProgressJobs[0].title ?? inProgressJobs[0].quotes?.clients?.name ?? 'Trabajo'}
          </p>
        </div>
      )}

      {/* Recent quotes — "continue where you left off" */}
      {recentQuotes.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">Continúa donde lo dejaste</h2>
            <button onClick={() => onTab('quotes')} className="text-xs font-semibold text-[var(--accent)]">Ver todas</button>
          </div>
          <div className="flex flex-col gap-2">
            {recentQuotes.map((qt, i) => {
              const qm = QUOTE_META[qt.status] ?? QUOTE_META.draft;
              return (
                <motion.a key={qt.id} href={`/app/quotes/${qt.id}`}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ ...transition, delay: 0.1 + i * 0.04 }}
                  whileTap={{ scale: 0.985 }}
                  className="flex items-center gap-3 rounded-2xl bg-[var(--surface)] px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-[var(--text-primary)]">
                        {qt.clients?.name ?? 'Sin cliente'}
                      </span>
                      <span className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold flex items-center gap-0.5 ${qm.color}`}>
                        {qm.icon}{qm.label}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="text-xs text-[var(--text-tertiary)]">{relDate((qt as any).updated_at ?? qt.created_at)}</span>
                      <span className="text-xs font-bold tabular-nums text-[var(--text-primary)]">{fmt(qt.total_cents)}</span>
                    </div>
                  </div>
                  <ChevronRight size={14} className="shrink-0 text-[var(--text-tertiary)]" />
                </motion.a>
              );
            })}
          </div>
        </div>
      )}

      {/* Sections quick nav */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">Módulos</h2>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Clientes',   Icon: Users,    href: '/app/customers', bg: 'bg-sky-500/10',     ic: '#38bdf8' },
            { label: 'Proyectos',  Icon: ShieldCheck, href: '/app/projects', bg: 'bg-purple-500/10', ic: '#a855f7' },
            { label: 'Facturas',   Icon: Receipt,  href: null, onClick: () => onTab('invoices'), bg: 'bg-green-500/10', ic: '#22c55e' },
            { label: 'Catálogo',   Icon: BookOpen, href: null, onClick: () => onTab('pricebook'), bg: 'bg-amber-500/10', ic: '#f59e0b' },
          ].map(({ label, Icon, href, bg, ic, onClick }) => {
            const inner = (
              <div className="flex items-center gap-3 p-3">
                <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                  <Icon size={18} color={ic} strokeWidth={1.8} />
                </div>
                <span className="text-sm font-semibold text-[var(--text-primary)]">{label}</span>
                <ChevronRight size={14} className="ml-auto shrink-0 text-[var(--text-tertiary)]" />
              </div>
            );
            return href ? (
              <motion.a key={label} href={href} whileTap={{ scale: 0.97 }} className="rounded-2xl bg-[var(--surface)]">{inner}</motion.a>
            ) : (
              <motion.button key={label} onClick={onClick} whileTap={{ scale: 0.97 }} className="rounded-2xl bg-[var(--surface)] text-left w-full">{inner}</motion.button>
            );
          })}
        </div>
      </div>

    </div>
  );
}

/* ─── Quotes tab ─────────────────────────────────────────────────────────── */

const STATUS_FILTERS = ['Todas', 'Borrador', 'Enviada', 'Vista', 'Aceptada', 'Declinada', 'Expirada'] as const;
const STATUS_FILTER_MAP: Record<string, string> = {
  'Borrador': 'draft', 'Enviada': 'sent', 'Vista': 'viewed',
  'Aceptada': 'accepted', 'Declinada': 'declined', 'Expirada': 'expired',
};

function QuotesTab({ quotes }: { quotes: Quote[] }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todas');

  const won    = quotes.filter(x => x.status === 'accepted' || x.status === 'converted');
  const wonAmt = won.reduce((s, x) => s + x.total_cents, 0);
  const sent   = quotes.filter(x => ['sent', 'viewed', 'accepted', 'converted'].includes(x.status)).length;
  const winRate = sent > 0 ? Math.round(won.length / sent * 100) : 0;

  const visible = quotes.filter(x => {
    const matchStatus = statusFilter === 'Todas' || x.status === STATUS_FILTER_MAP[statusFilter];
    const matchQ = !q.trim() ||
      x.clients?.name.toLowerCase().includes(q.toLowerCase()) ||
      x.quote_items.some(it => it.name.toLowerCase().includes(q.toLowerCase()));
    return matchStatus && matchQ;
  });

  if (quotes.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 py-20 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]">
          <FileText size={28} color="var(--accent)" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-base font-bold text-[var(--text-primary)]">Sin cotizaciones aún</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Crea tu primera cotización en menos de 1 minuto.</p>
        </div>
        <motion.button whileTap={{ scale: 0.97 }}
          onClick={() => router.push('/app/quotes/new')}
          className="mt-2 flex h-12 items-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] px-6 text-sm font-bold text-white [box-shadow:var(--shadow-cta)]">
          <Plus size={16} /> Nueva cotización
        </motion.button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-5 pt-5 pb-32">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Valor ganado',  value: fmt(wonAmt),    sub: 'aceptadas',      Icon: TrendingUp },
          { label: 'Tasa cierre',   value: `${winRate}%`, sub: 'de enviadas',    Icon: CheckCircle2 },
          { label: 'Enviadas',      value: String(sent),  sub: 'cotizaciones',   Icon: Send },
        ].map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ ...transition, delay: i * 0.06 }}
            className="flex flex-col gap-1 rounded-2xl bg-[var(--surface)] p-3">
            <s.Icon size={14} color="var(--accent)" strokeWidth={2} />
            <span className="text-xl font-bold tabular-nums [font-family:var(--font-display)] text-[var(--text-primary)]">{s.value}</span>
            <span className="text-xs leading-tight text-[var(--text-tertiary)]">{s.sub}</span>
          </motion.div>
        ))}
      </div>
      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
        <input value={q} onChange={e => setQ(e.target.value)}
          placeholder="Buscar cliente o servicio..."
          className="h-11 w-full rounded-2xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--surface)] pl-9 pr-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)]" />
      </div>

      {/* Status filters */}
      <div className="flex gap-2 overflow-x-auto -mx-5 px-5 pb-1 scrollbar-none">
        {STATUS_FILTERS.map(f => (
          <button key={f} onClick={() => setStatusFilter(f)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              statusFilter === f ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface)] text-[var(--text-secondary)]'
            }`}>{f}</button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Cotizaciones</h2>
        <span className="text-xs text-[var(--text-tertiary)]">{visible.length} de {quotes.length}</span>
      </div>
      {visible.length === 0 && (
        <p className="py-8 text-center text-sm text-[var(--text-tertiary)]">Sin resultados</p>
      )}
      <div className="flex flex-col gap-2">
        {visible.map((qt, i) => {
          const meta = QUOTE_META[qt.status] ?? QUOTE_META.draft;
          const initials = (qt.clients?.name ?? 'Q').slice(0, 1).toUpperCase();
          const desc = qt.quote_items.slice(0, 2).map(it => it.name).join(' · ') || 'Sin ítems';
          return (
            <motion.a key={qt.id} href={`/app/quotes/${qt.id}`}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ ...transition, delay: 0.1 + i * 0.05 }}
              whileTap={{ scale: 0.985 }}
              className="flex items-center gap-3 rounded-2xl bg-[var(--surface)] p-4 text-left">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]">
                <span className="text-sm font-bold text-[var(--accent)]">{initials}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold text-[var(--text-primary)]">{qt.clients?.name ?? 'Sin cliente'}</span>
                  <span className={`ml-auto flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${meta.color}`}>
                    {meta.icon}{meta.label}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-[var(--text-tertiary)]">{desc}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-sm font-bold tabular-nums [font-family:var(--font-display)] text-[var(--text-primary)]">{fmt(qt.total_cents)}</span>
                  <span className="text-xs text-[var(--text-tertiary)]">· {relDate(qt.created_at)}</span>
                </div>
              </div>
              <ChevronRight size={16} className="shrink-0 text-[var(--text-tertiary)]" />
            </motion.a>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Invoices tab ───────────────────────────────────────────────────────── */

function daysUntil(iso: string | null) {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}
function fmtShort(iso: string) {
  return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
}

function InvoicesTab({ invoices, router }: { invoices: InvoiceRow[]; router: ReturnType<typeof useRouter> }) {
  if (invoices.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 py-20 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]">
          <Receipt size={28} color="var(--accent)" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-base font-bold text-[var(--text-primary)]">Sin facturas aún</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Convierte una cotización aceptada en factura para comenzar.</p>
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push('/app/quotes')}
          className="flex h-12 items-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] px-6 text-sm font-bold text-white [box-shadow:var(--shadow-cta)]">
          Ver cotizaciones aceptadas
        </motion.button>
      </div>
    );
  }

  // Order newest first for display
  const sorted = [...invoices].reverse();
  const totalBilled  = invoices.reduce((s, i) => s + i.total_cents, 0);
  const totalPaid    = invoices.reduce((s, i) => s + i.amount_paid_cents, 0);
  const totalPending = totalBilled - totalPaid;
  const overdue      = invoices.filter(i => i.status !== 'paid' && daysUntil(i.due_at) !== null && daysUntil(i.due_at)! < 0);
  const upcoming     = invoices.filter(i => i.status !== 'paid' && i.due_at);
  const paidPct      = totalBilled > 0 ? Math.round(totalPaid / totalBilled * 100) : 0;
  const thisMonth    = invoices.filter(i => {
    const d = new Date(i.issued_at ?? '');
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const stats = [
    { label: 'Total facturado',   value: fmt(totalBilled),      sub: '18.6% vs mes anterior', subColor: 'text-green-400', icon: '📋', iconBg: 'bg-[color-mix(in_oklab,var(--accent)_15%,transparent)]' },
    { label: 'Facturas emitidas', value: String(invoices.length), sub: 'Este mes',             subColor: 'text-blue-400',  icon: '📄', iconBg: 'bg-blue-500/15' },
    { label: 'Por cobrar',        value: fmt(totalPending),     sub: `${upcoming.length} facturas`, subColor: 'text-amber-400', icon: '🕐', iconBg: 'bg-amber-500/15' },
    { label: 'Pagadas',           value: fmt(totalPaid),        sub: `${paidPct}% del total`, subColor: 'text-purple-400', icon: '✅', iconBg: 'bg-purple-500/15' },
  ];

  return (
    <div className="flex flex-col gap-5 px-5 pt-5 pb-32">

      {/* Stats row — horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-5 px-5 scrollbar-none">
        {stats.map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ ...transition, delay: i * 0.05 }}
            className="flex shrink-0 w-36 flex-col gap-2 rounded-2xl bg-[var(--surface)] p-4">
            <div className={`flex size-10 items-center justify-center rounded-xl text-lg ${s.iconBg}`}>{s.icon}</div>
            <p className="text-xs text-[var(--text-tertiary)] leading-tight">{s.label}</p>
            <p className="text-xl font-black tabular-nums [font-family:var(--font-display)] text-[var(--text-primary)]">{s.value}</p>
            <p className={`text-[10px] font-semibold ${s.subColor}`}>{s.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* List */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-[var(--text-primary)]">Facturas recientes</h2>
        <span className="text-xs font-semibold text-[var(--accent)]">Ver todas ({invoices.length}) ›</span>
      </div>

      <div className="rounded-2xl bg-[var(--surface)] overflow-hidden">
        {sorted.map((inv, i) => {
          const num = String(invoices.length - i).padStart(5, '0');
          const isPaid = inv.status === 'paid';
          const days = daysUntil(inv.due_at);
          const project = (inv as any).projects?.name ?? null;
          return (
            <motion.a key={inv.id} href={`/app/invoices/${inv.id}`}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ ...transition, delay: 0.05 + i * 0.04 }}
              whileTap={{ scale: 0.99 }}
              className={`flex items-center gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-[color-mix(in_oklab,var(--text-tertiary)_8%,transparent)]' : ''}`}>
              {/* Icon */}
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--accent)_12%,transparent)]">
                <Receipt size={18} color="var(--accent)" strokeWidth={1.8} />
              </div>
              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[var(--text-primary)]">F-{num}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isPaid ? 'bg-green-500/15 text-green-400' : 'bg-amber-500/15 text-amber-400'
                  }`}>{isPaid ? 'Pagada' : 'Por cobrar'}</span>
                </div>
                <p className="mt-0.5 truncate text-xs text-[var(--text-tertiary)]">
                  {inv.clients?.name ?? 'Sin cliente'}{project ? ` · ${project}` : ''}
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)]">{fmtShort(inv.issued_at ?? inv.updated_at)}</p>
              </div>
              {/* Amount + due */}
              <div className="shrink-0 text-right">
                <p className={`text-sm font-black tabular-nums [font-family:var(--font-display)] ${isPaid ? 'text-green-400' : 'text-amber-400'}`}>
                  {!isPaid && inv.amount_paid_cents > 0
                    ? fmt(inv.total_cents - inv.amount_paid_cents)
                    : fmt(inv.total_cents)}
                </p>
                {!isPaid && inv.amount_paid_cents > 0 && (
                  <p className="text-[10px] text-[var(--text-tertiary)]">de {fmt(inv.total_cents)}</p>
                )}
                <p className="text-[10px] text-[var(--text-tertiary)]">
                  {isPaid
                    ? `Pagada el ${fmtShort(inv.updated_at)}`
                    : days !== null
                      ? days < 0 ? `Vencida hace ${Math.abs(days)}d` : days === 0 ? 'Vence hoy' : `Vence en ${days} días`
                      : ''}
                </p>
              </div>
              <ChevronRight size={14} className="shrink-0 text-[var(--text-tertiary)]" />
            </motion.a>
          );
        })}
      </div>

      {/* Cobros por vencer */}
      {upcoming.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-2xl bg-[var(--surface)] p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15">
            <Clock size={18} className="text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-[var(--text-primary)]">Cobros por vencer</p>
            <p className="text-xs text-[var(--text-tertiary)]">
              Tienes <span className="font-bold text-amber-400">{upcoming.length}</span> facturas por vencer
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-black text-amber-400">{fmt(totalPending)}</p>
          </div>
          <ChevronRight size={14} className="text-[var(--text-tertiary)]" />
        </motion.div>
      )}

      {/* CTA */}
      <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push('/app/quotes')}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] text-base font-bold text-white [box-shadow:var(--shadow-cta)]">
        <Plus size={18} /> Nueva factura
      </motion.button>
    </div>
  );
}

/* ─── Price Book tab ─────────────────────────────────────────────────────── */

/* icon colors per trade */
const TRADE_COLORS: Record<string, { bg: string; color: string }> = {
  Pintura:      { bg: 'bg-blue-500/15',   color: '#60a5fa' },
  Remodelación: { bg: 'bg-purple-500/15', color: '#a78bfa' },
  Plomería:     { bg: 'bg-cyan-500/15',   color: '#22d3ee' },
  Electricidad: { bg: 'bg-yellow-500/15', color: '#fbbf24' },
  HVAC:         { bg: 'bg-orange-500/15', color: '#fb923c' },
  General:      { bg: 'bg-[color-mix(in_oklab,var(--accent)_12%,transparent)]', color: 'var(--accent)' },
};
function tradeStyle(t: string | null) { return TRADE_COLORS[t ?? 'General'] ?? TRADE_COLORS.General; }

function PriceBookTab({ items }: { items: PriceBookItem[] }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todas');
  const [addOpen, setAddOpen] = useState(false);
  const [adding, startAdd] = useTransition();
  const [addError, setAddError] = useState<string | null>(null);

  const trades = ['Todas', ...([...new Set(items.map(i => i.trade ?? 'General'))].sort())];
  const filtered = items.filter(i => {
    const matchCat = activeCategory === 'Todas' || (i.trade ?? 'General') === activeCategory;
    const matchSearch = !search.trim() || i.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const active = items.filter(i => i.active);

  const addSheet = (
    <AnimatePresence>
      {addOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => { setAddOpen(false); setAddError(null); }} />
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            className="fixed bottom-0 inset-x-0 z-50 rounded-t-3xl bg-[var(--bg)] p-6 pb-10">
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-[color-mix(in_oklab,var(--text-tertiary)_30%,transparent)]" />
            <h2 className="mb-5 text-lg font-black text-[var(--text-primary)]">Agregar al catálogo</h2>
            <form onSubmit={e => {
              e.preventDefault();
              setAddError(null);
              const fd = new FormData(e.currentTarget);
              startAdd(async () => {
                const res = await addPriceBookItem(fd);
                if (res.error) { setAddError(res.error); return; }
                setAddOpen(false);
                (e.target as HTMLFormElement).reset();
              });
            }} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[var(--text-tertiary)]">Nombre *</label>
                <input name="name" required placeholder="Ej. Pintura de sala"
                  className="h-12 rounded-2xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--surface)] px-4 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--text-tertiary)]">Precio *</label>
                  <input name="price" type="number" min="0" step="0.01" required placeholder="0.00"
                    className="h-12 rounded-2xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--surface)] px-4 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--text-tertiary)]">Unidad</label>
                  <input name="unit" placeholder="hr, m², pie..."
                    className="h-12 rounded-2xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--surface)] px-4 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[var(--text-tertiary)]">Categoría</label>
                <input name="trade" placeholder="Pintura, Plomería, HVAC..."
                  className="h-12 rounded-2xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--surface)] px-4 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" />
              </div>
              {addError && <p className="text-xs text-red-500">{addError}</p>}
              <motion.button type="submit" disabled={adding} whileTap={{ scale: 0.97 }}
                className="flex h-14 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] text-sm font-bold text-white disabled:opacity-60 [box-shadow:var(--shadow-cta)]">
                {adding ? 'Guardando...' : <><Plus size={16} /> Agregar servicio</>}
              </motion.button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (items.length === 0) {
    return (
      <>
        {addSheet}
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 py-20 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]">
            <BookOpen size={28} color="var(--accent)" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-base font-bold text-[var(--text-primary)]">Tu catálogo está vacío</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Agrega servicios y productos para cotizar más rápido.</p>
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setAddOpen(true)}
            className="flex h-12 items-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] px-6 text-sm font-bold text-white [box-shadow:var(--shadow-cta)]">
            <Plus size={16} /> Agregar servicio
          </motion.button>
        </div>
      </>
    );
  }

  return (
    <>
      {addSheet}
    <div className="flex flex-col gap-5 px-5 pt-5 pb-32">

      {/* Search + filter + add */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar servicios y productos..."
            className="h-11 w-full rounded-2xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--surface)] pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)]" />
        </div>
        <button className="flex h-11 items-center gap-1.5 rounded-2xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--surface)] px-3 text-sm font-semibold text-[var(--text-secondary)]">
          <Settings size={14} /> Filtros
        </button>
        <motion.button whileTap={{ scale: 0.93 }} onClick={() => setAddOpen(true)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)] text-white [box-shadow:var(--shadow-cta)]">
          <Plus size={18} />
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Total ítems',    value: items.length,  sub: 'activos',              iconBg: 'bg-[color-mix(in_oklab,var(--accent)_12%,transparent)]', iconColor: 'var(--accent)',  icon: Package },
          { label: 'Servicios',      value: active.length, sub: 'activos',              iconBg: 'bg-blue-500/15',   iconColor: '#60a5fa', icon: FileText },
          { label: 'Productos',      value: items.length - active.length, sub: 'activos', iconBg: 'bg-purple-500/15', iconColor: '#a78bfa', icon: Package },
          { label: 'Vistas',         value: '—',           sub: '↑ este mes',           iconBg: 'bg-orange-500/15', iconColor: '#fb923c', icon: TrendingUp },
        ].map(({ label, value, sub, iconBg, iconColor, icon: Icon }) => (
          <div key={label} className="flex flex-col gap-1.5 rounded-2xl bg-[var(--surface)] p-3">
            <div className={`flex size-8 items-center justify-center rounded-lg ${iconBg}`}>
              <Icon size={14} color={iconColor} />
            </div>
            <p className="text-[10px] text-[var(--text-tertiary)] leading-tight">{label}</p>
            <p className="text-lg font-black [font-family:var(--font-display)] text-[var(--text-primary)]">{value}</p>
            <p className="text-[10px] font-semibold text-[var(--accent)]">{sub}</p>
          </div>
        ))}
      </div>

      {/* Categories */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-[var(--text-primary)]">Categorías</h2>
          <span className="text-xs font-semibold text-[var(--accent)]">Ver todas</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5 scrollbar-none">
          {trades.map(t => {
            const count = t === 'Todas' ? items.length : items.filter(i => (i.trade ?? 'General') === t).length;
            const active = t === activeCategory;
            const style = t === 'Todas' ? { bg: 'bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]', color: 'var(--accent)' } : tradeStyle(t);
            return (
              <button key={t} onClick={() => setActiveCategory(t)}
                className={`flex shrink-0 flex-col items-center gap-1.5 rounded-2xl p-3 min-w-[72px] border-2 transition-colors ${
                  active ? 'border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_8%,transparent)]' : 'border-transparent bg-[var(--surface)]'
                }`}>
                <div className={`flex size-10 items-center justify-center rounded-xl ${style.bg}`}>
                  <Package size={16} color={style.color} />
                </div>
                <span className={`text-xs font-bold ${active ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}`}>{t}</span>
                <span className={`text-[10px] ${active ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'}`}>{count} ítems</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Items list */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-[var(--text-primary)]">Servicios destacados</h2>
          <span className="text-xs font-semibold text-[var(--accent)]">Ver todos</span>
        </div>
        <div className="rounded-2xl bg-[var(--surface)] overflow-hidden">
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-[var(--text-tertiary)]">Sin resultados para "{search}"</p>
          )}
          {filtered.map((item, i) => {
            const style = tradeStyle(item.trade);
            return (
              <div key={item.id}
                className={`flex items-center gap-3 px-4 py-4 ${i > 0 ? 'border-t border-[color-mix(in_oklab,var(--text-tertiary)_8%,transparent)]' : ''}`}>
                {/* Placeholder thumbnail */}
                <div className={`flex size-16 shrink-0 items-center justify-center rounded-xl ${style.bg}`}>
                  <Package size={24} color={style.color} strokeWidth={1.5} />
                </div>
                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[var(--text-primary)]">{item.name}</p>
                  {item.trade && (
                    <div className="mt-1 flex gap-1.5">
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ background: style.bg, color: style.color }}>{item.trade}</span>
                    </div>
                  )}
                </div>
                {/* Price */}
                <div className="shrink-0 text-right">
                  <p className="text-[10px] text-[var(--text-tertiary)]">Desde</p>
                  <p className="text-base font-black tabular-nums [font-family:var(--font-display)] text-[var(--text-primary)]">
                    {fmtFull(item.price_cents)}
                  </p>
                  {item.unit && <p className="text-[10px] text-[var(--text-tertiary)]">por {item.unit}</p>}
                </div>
                <button className="flex size-7 shrink-0 items-center justify-center text-[var(--text-tertiary)]">
                  <MoreHorizontal size={16} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sync banner */}
      <div className="flex items-center gap-3 rounded-2xl bg-[var(--surface)] p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--accent)_12%,transparent)]">
          <TrendingUp size={18} color="var(--accent)" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-[var(--text-primary)]">Sincroniza tu catálogo</p>
          <p className="text-xs text-[var(--text-tertiary)]">Mantén tu catálogo actualizado en todos tus dispositivos.</p>
        </div>
        <button className="flex items-center gap-1.5 rounded-xl bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] px-3 py-2 text-xs font-bold text-[var(--accent)]">
          Sincronizar
        </button>
      </div>
    </div>
    </>
  );
}

/* ─── Settings tab ───────────────────────────────────────────────────────── */

function SettingsTab({ user, business }: { user: AppUser; business: Business | null }) {
  const [signingOut, setSigningOut] = useState(false);
  async function handleSignOut() { setSigningOut(true); await signOut(); }
  return (
    <div className="flex flex-col gap-5 px-5 pt-5 pb-32">
      {business && (
        <div className="rounded-2xl bg-[var(--surface)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Negocio</p>
          <p className="mt-1 text-base font-bold text-[var(--text-primary)]">{business.name}</p>
          <a href="/app/settings" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)]">
            Editar perfil del negocio <ChevronRight size={13} />
          </a>
        </div>
      )}
      <div className="flex flex-col gap-2">
        {[
          { Icon: User,       label: 'Mi cuenta',      sub: user.email,             href: '/app/settings' },
          { Icon: Bell,       label: 'Notificaciones', sub: 'Administrar alertas',  href: '#' },
          { Icon: ShieldCheck, label: 'Suscripción',   sub: 'Plan y facturación',   href: '#' },
          { Icon: Users,       label: 'Clientes',      sub: 'Ver y gestionar clientes', href: '/app/customers' },
        ].map(({ Icon, label, sub, href }) => (
          <motion.a key={label} href={href} whileTap={{ scale: 0.985 }}
            className="flex items-center gap-3 rounded-2xl bg-[var(--surface)] p-4 text-left">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--accent)_8%,transparent)]">
              <Icon size={16} color="var(--accent)" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--text-primary)]">{label}</p>
              <p className="truncate text-xs text-[var(--text-tertiary)]">{sub}</p>
            </div>
            <ChevronRight size={16} className="shrink-0 text-[var(--text-tertiary)]" />
          </motion.a>
        ))}
      </div>
      <motion.button whileTap={{ scale: 0.97 }} disabled={signingOut} onClick={handleSignOut}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] border border-red-200 text-sm font-semibold text-red-600 disabled:opacity-50">
        <LogOut size={16} />
        {signingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
      </motion.button>
    </div>
  );
}

/* ─── Nav config ─────────────────────────────────────────────────────────── */

const NAV = [
  { id: 'home',      label: 'Inicio',       Icon: Home,     href: null      },
  { id: 'quotes',    label: 'Cotizaciones', Icon: FileText, href: null      },
  { id: 'invoices',  label: 'Facturas',     Icon: Receipt,  href: null      },
  { id: 'jobs',      label: 'Trabajos',     Icon: Briefcase, href: '/app/jobs' },
  { id: 'pricebook', label: 'Catálogo',     Icon: BookOpen, href: null      },
  { id: 'settings',  label: 'Ajustes',      Icon: Settings, href: null      },
] as const;

type Tab = Exclude<typeof NAV[number]['id'], 'jobs'>;

/* ─── Shell ──────────────────────────────────────────────────────────────── */

export function AppShell({ user, business, quotes, priceBookItems, invoices, jobs, clientCount }: Props) {
  const [tab, setTab] = useState<Tab>('home');
  const router = useRouter();

  return (
    /* md+ = sidebar layout; <md = stacked with bottom nav */
    <div className="flex min-h-dvh bg-[var(--bg)]">

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-[color-mix(in_oklab,var(--text-tertiary)_12%,transparent)] bg-[var(--surface)] px-3 py-6 fixed inset-y-0 left-0 z-20">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-2 px-3">
          <Image src="/logo.png" alt="Quotronex" width={48} height={48} className="rounded-xl" />
          <span className="text-base font-black [font-family:var(--font-display)] text-[var(--text-primary)]">Quotronex</span>
        </div>

        {/* Nav items */}
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map(({ id, label, Icon, href }) => {
            const active = tab === id;
            const cls = `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors text-left w-full ${
              active
                ? 'bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] text-[var(--accent)]'
                : 'text-[var(--text-secondary)] hover:bg-[color-mix(in_oklab,var(--text-tertiary)_8%,transparent)]'
            }`;
            return href ? (
              <a key={id} href={href} className={cls}>
                <Icon size={18} strokeWidth={1.8} />{label}
              </a>
            ) : (
              <button key={id} onClick={() => setTab(id as Tab)} className={cls}>
                <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />{label}
              </button>
            );
          })}
        </nav>

        {/* Business + user */}
        <div className="mt-4 rounded-xl bg-[color-mix(in_oklab,var(--text-tertiary)_8%,transparent)] p-3">
          <p className="text-xs font-bold text-[var(--text-primary)] truncate">{business?.name ?? user.firstName}</p>
          <p className="text-xs text-[var(--text-tertiary)] truncate">{user.email}</p>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex flex-1 flex-col md:ml-56">
        {/* Mobile top bar */}
        <header className="flex h-14 md:hidden items-center justify-between border-b border-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)] px-5">
          <span className="flex items-center gap-2 text-sm font-black [font-family:var(--font-display)] text-[var(--text-primary)]">
            <Image src="/logo.png" alt="Quotronex" width={36} height={36} className="rounded-xl" />
            Quotronex
          </span>
          {/* Tab title */}
          <span className="text-sm font-semibold text-[var(--text-secondary)]">
            {NAV.find(n => n.id === tab)?.label}
          </span>
        </header>

        {/* Desktop page header */}
        <header className="hidden md:flex h-16 items-center justify-between border-b border-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)] px-8">
          <h1 className="text-lg font-black [font-family:var(--font-display)] text-[var(--text-primary)]">
            {NAV.find(n => n.id === tab)?.label}
          </h1>
          {tab === 'quotes' && (
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push('/app/quotes/new')}
              className="flex h-9 items-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] px-4 text-sm font-bold text-white [box-shadow:var(--shadow-cta)]">
              <Plus size={15} /> Nueva cotización
            </motion.button>
          )}
          {tab === 'invoices' && (
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push('/app/invoices/new')}
              className="flex h-9 items-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] px-4 text-sm font-bold text-white [box-shadow:var(--shadow-cta)]">
              <Plus size={15} /> Nueva factura
            </motion.button>
          )}
        </header>

        {/* Content */}
        <main className="flex flex-1 flex-col overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div key={tab} className="flex flex-1 flex-col"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}>
              {tab === 'home'      && <HomeTab user={user} business={business} quotes={quotes} invoices={invoices} jobs={jobs} onTab={setTab} router={router} priceBookItems={priceBookItems} clientCount={clientCount} />}
              {tab === 'quotes'    && <QuotesTab quotes={quotes} />}
              {tab === 'invoices'  && <InvoicesTab invoices={invoices} router={router} />}
              {tab === 'pricebook' && <PriceBookTab items={priceBookItems} />}
              {tab === 'settings'  && <SettingsTab user={user} business={business} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ── Mobile FAB ── */}
      {tab === 'quotes' && quotes.length > 0 && (
        <div className="fixed bottom-20 right-5 z-20 md:hidden">
          <motion.button whileTap={{ scale: 0.93 }} onClick={() => router.push('/app/quotes/new')}
            className="flex h-14 items-center gap-2 rounded-full bg-[var(--accent)] px-5 text-sm font-bold text-white [box-shadow:var(--shadow-cta)]">
            <Plus size={18} /> Nueva cotización
          </motion.button>
        </div>
      )}
      {tab === 'invoices' && invoices.length > 0 && (
        <div className="fixed bottom-20 right-5 z-20 md:hidden">
          <motion.button whileTap={{ scale: 0.93 }} onClick={() => router.push('/app/invoices/new')}
            className="flex h-14 items-center gap-2 rounded-full bg-[var(--accent)] px-5 text-sm font-bold text-white [box-shadow:var(--shadow-cta)]">
            <Plus size={18} /> Nueva factura
          </motion.button>
        </div>
      )}

      {/* ── Mobile bottom nav ── */}
      <nav className="fixed bottom-0 inset-x-0 z-10 md:hidden">
        {/* Arch background */}
        <div className="relative border-t border-[color-mix(in_oklab,var(--text-tertiary)_15%,transparent)] bg-[var(--bg)]">
          <div className="flex items-end">
            {/* Left 2 tabs */}
            {(['quotes','invoices'] as Tab[]).map(id => {
              const item = NAV.find(n => n.id === id)!;
              const active = tab === id;
              return (
                <button key={id} onClick={() => setTab(id as Tab)}
                  className="relative flex flex-1 flex-col items-center gap-0.5 py-3 [touch-action:manipulation]">
                  {active && (
                    <motion.div layoutId="nav-line"
                      className="absolute top-0 h-0.5 w-6 rounded-full bg-[var(--accent)]"
                      transition={{ type: 'spring', stiffness: 400, damping: 35 }} />
                  )}
                  <item.Icon size={22} strokeWidth={active ? 2.2 : 1.5}
                    color={active ? 'var(--accent)' : 'var(--text-tertiary)'} />
                  <span className={`text-[9px] font-semibold leading-none ${active ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}

            {/* Center home — elevated */}
            <div className="relative flex flex-col items-center" style={{ width: '20%' }}>
              <motion.button whileTap={{ scale: 0.92 }} onClick={() => setTab('home')}
                className="absolute -top-6 flex size-14 items-center justify-center rounded-full border-4 border-[var(--bg)] bg-[var(--accent)] shadow-lg [box-shadow:var(--shadow-cta)] [touch-action:manipulation]">
                <Home size={22} strokeWidth={2} color="white" />
              </motion.button>
              <div className="h-8" />
              <span className={`pb-2 text-[9px] font-semibold leading-none ${tab === 'home' ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'}`}>
                Inicio
              </span>
            </div>

            {/* Right 2 tabs: Jobs (route) + Settings (tab) */}
            {[{ id: 'jobs', href: '/app/jobs' }, { id: 'settings', href: null }].map(({ id, href }) => {
              const item = NAV.find(n => n.id === id)!;
              const active = tab === id;
              const content = (
                <>
                  {active && (
                    <motion.div layoutId="nav-line"
                      className="absolute top-0 h-0.5 w-6 rounded-full bg-[var(--accent)]"
                      transition={{ type: 'spring', stiffness: 400, damping: 35 }} />
                  )}
                  <item.Icon size={22} strokeWidth={active ? 2.2 : 1.5}
                    color={active ? 'var(--accent)' : 'var(--text-tertiary)'} />
                  <span className={`text-[9px] font-semibold leading-none ${active ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'}`}>
                    {item.label}
                  </span>
                </>
              );
              return href ? (
                <a key={id} href={href}
                  className="relative flex flex-1 flex-col items-center gap-0.5 py-3 [touch-action:manipulation]">
                  {content}
                </a>
              ) : (
                <button key={id} onClick={() => setTab(id as Tab)}
                  className="relative flex flex-1 flex-col items-center gap-0.5 py-3 [touch-action:manipulation]">
                  {content}
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
