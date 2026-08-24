'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  ChevronLeft, MapPin, FolderOpen, Plus, ChevronRight,
  FileText, Receipt, DollarSign, Clock, CheckCircle2,
  AlertCircle, ArchiveRestore, FileCheck, Pencil, Briefcase,
} from 'lucide-react';
import { archiveProject, reactivateProject } from '@/app/actions/projects';

type Status = 'lead' | 'active' | 'completed' | 'canceled';

const STATUS: Record<Status, { label: string; color: string }> = {
  lead:      { label: 'Lead',        color: 'text-amber-600 bg-amber-50' },
  active:    { label: 'Activo',      color: 'text-blue-600 bg-blue-50' },
  completed: { label: 'Completado',  color: 'text-green-700 bg-green-50' },
  canceled:  { label: 'Cancelado',   color: 'text-gray-500 bg-gray-100' },
};

const QUOTE_STATUS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft:     { label: 'Borrador',   color: 'text-gray-500',  icon: <Clock size={13} /> },
  sent:      { label: 'Enviada',    color: 'text-blue-600',  icon: <FileText size={13} /> },
  viewed:    { label: 'Vista',      color: 'text-amber-600', icon: <FileText size={13} /> },
  accepted:  { label: 'Aceptada',   color: 'text-green-700', icon: <CheckCircle2 size={13} /> },
  declined:  { label: 'Declinada',  color: 'text-red-600',   icon: <AlertCircle size={13} /> },
  expired:   { label: 'Expirada',   color: 'text-gray-400',  icon: <Clock size={13} /> },
  converted: { label: 'Facturada',  color: 'text-purple-700',icon: <FileCheck size={13} /> },
};

const INV_STATUS: Record<string, { label: string; color: string }> = {
  draft:   { label: 'Borrador',      color: 'text-gray-500 bg-gray-100' },
  sent:    { label: 'Enviada',       color: 'text-blue-600 bg-blue-50' },
  partial: { label: 'Pago parcial',  color: 'text-amber-600 bg-amber-50' },
  paid:    { label: 'Pagada',        color: 'text-green-700 bg-green-50' },
  overdue: { label: 'Vencida',       color: 'text-red-600 bg-red-50' },
};

const fmt = (c: number) => `$${(c / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
const fmtDate = (s: string) => new Date(s).toLocaleDateString('es', { month: 'short', day: 'numeric', year: 'numeric' });
const t = { duration: 0.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

type Quote   = { id: string; status: string; total_cents: number; created_at: string; accepted_at: string | null; quote_items: { name: string }[] };
type Invoice = { id: string; status: string; total_cents: number; amount_paid_cents: number; due_at: string | null; issued_at: string | null };
type Payment = { id: string; amount_cents: number; method: string; paid_at: string; notes: string | null };
type Job     = { id: string; title: string | null; status: string; start_date: string | null; end_date: string | null };

const JOB_STATUS: Record<string, { label: string; color: string }> = {
  scheduled:   { label: 'Programado',  color: 'text-blue-600 bg-blue-50' },
  in_progress: { label: 'En progreso', color: 'text-amber-600 bg-amber-50' },
  completed:   { label: 'Completado',  color: 'text-green-700 bg-green-50' },
  on_hold:     { label: 'En pausa',    color: 'text-gray-500 bg-gray-100' },
  canceled:    { label: 'Cancelado',   color: 'text-red-600 bg-red-50' },
};

interface Props {
  id: string;
  name: string;
  status: Status;
  jobAddress: string | null;
  notes: string | null;
  archived_at: string | null;
  client: { id: string; name: string } | null;
  quotes: Quote[];
  invoices: Invoice[];
  payments: Payment[];
  jobs: Job[];
}

export function ProjectDetailClient({ id, name, status, jobAddress, notes, archived_at, client, quotes, invoices, payments, jobs }: Props) {
  const router = useRouter();
  const isArchived = !!archived_at;

  const totalRevenue = invoices.reduce((s, i) => s + i.total_cents, 0);
  const totalPaid    = payments.reduce((s, p) => s + p.amount_cents, 0);
  const totalPending = totalRevenue - totalPaid;

  async function handleArchive() {
    if (!confirm(`¿Archivar "${name}"?`)) return;
    await archiveProject(id, client?.id ?? '');
  }
  async function handleReactivate() {
    await reactivateProject(id, client?.id ?? '');
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg)]">
      {/* Header */}
      <header className="flex h-14 items-center justify-between px-4">
        <button onClick={() => router.push(client ? `/app/customers/${client.id}` : '/app/customers')}
          className="flex size-10 items-center justify-center rounded-full hover:bg-[var(--surface)]">
          <ChevronLeft size={20} color="var(--text-secondary)" />
        </button>
        <Link href={`/app/projects/${id}/edit`}
          className="flex h-9 items-center gap-1.5 rounded-full border border-[color-mix(in_oklab,var(--text-tertiary)_30%,transparent)] bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--text-primary)]">
          <Pencil size={12} /> Editar
        </Link>
      </header>

      <main className="flex flex-col gap-5 px-5 pt-2 pb-24">

        {/* Archived banner */}
        {isArchived && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={t}
            className="flex items-center gap-3 rounded-2xl bg-amber-50 px-4 py-3">
            <ArchiveRestore size={16} className="text-amber-600 shrink-0" />
            <p className="flex-1 text-sm text-amber-700">Este proyecto está archivado</p>
            <button onClick={handleReactivate} className="text-xs font-bold text-amber-700 underline">Reactivar</button>
          </motion.div>
        )}

        {/* Title + meta */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={t}
          className="flex flex-col gap-2">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]">
            <FolderOpen size={22} color="var(--accent)" strokeWidth={1.5} />
          </div>
          <h1 className="text-xl font-bold [font-family:var(--font-display)] text-[var(--text-primary)]">{name}</h1>
          {client && (
            <Link href={`/app/customers/${client.id}`} className="text-sm font-medium text-[var(--accent)]">
              {client.name}
            </Link>
          )}
          <span className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS[status]?.color ?? STATUS.active.color}`}>
            {STATUS[status]?.label ?? status}
          </span>
        </motion.div>

        {/* Info card */}
        {(jobAddress || notes) && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ...t, delay: 0.05 }}
            className="overflow-hidden rounded-2xl bg-[var(--surface)]">
            {jobAddress && (
              <div className="flex items-start gap-3 border-b border-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)] px-4 py-3.5">
                <MapPin size={15} color="var(--accent)" className="mt-0.5 shrink-0" />
                <p className="text-sm text-[var(--text-primary)]">{jobAddress}</p>
              </div>
            )}
            {notes && (
              <div className="flex items-start gap-3 px-4 py-3.5">
                <FileText size={15} color="var(--text-tertiary)" className="mt-0.5 shrink-0" />
                <p className="text-sm text-[var(--text-secondary)]">{notes}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Financial summary */}
        {totalRevenue > 0 && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ...t, delay: 0.07 }}
            className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total', value: fmt(totalRevenue), color: 'text-[var(--text-primary)]' },
              { label: 'Cobrado', value: fmt(totalPaid), color: 'text-green-700' },
              { label: 'Por cobrar', value: fmt(totalPending), color: totalPending > 0 ? 'text-amber-600' : 'text-[var(--text-tertiary)]' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex flex-col gap-1 rounded-2xl bg-[var(--surface)] p-3 text-center">
                <p className="text-[10px] text-[var(--text-tertiary)]">{label}</p>
                <p className={`text-sm font-black tabular-nums [font-family:var(--font-display)] ${color}`}>{value}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Estimates / Quotes */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ...t, delay: 0.1 }}
          className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
              Cotizaciones ({quotes.length})
            </h2>
            <Link href={`/app/quotes/new?project=${id}${client ? `&clientId=${client.id}` : ''}`}
              className="flex h-8 items-center gap-1 rounded-full bg-[var(--accent)] px-3 text-xs font-bold text-white">
              <Plus size={13} /> Nueva
            </Link>
          </div>
          {quotes.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] py-8 px-5 text-center">
              <FileText size={24} color="var(--text-tertiary)" strokeWidth={1.5} />
              <p className="text-sm text-[var(--text-tertiary)]">Sin cotizaciones aún</p>
              <Link href={`/app/quotes/new?project=${id}${client ? `&clientId=${client.id}` : ''}`}
                className="flex h-10 items-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] px-4 text-sm font-semibold text-white [box-shadow:var(--shadow-cta)]">
                <Plus size={14} /> Nueva cotización
              </Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl bg-[var(--surface)]">
              {quotes.map((q, i) => {
                const meta = QUOTE_STATUS[q.status] ?? QUOTE_STATUS.draft;
                const desc = q.quote_items.slice(0, 2).map(x => x.name).join(' · ') || 'Sin ítems';
                return (
                  <Link key={q.id} href={`/app/quotes/${q.id}`}
                    className={`flex items-center gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)]' : ''}`}>
                    <span className={meta.color}>{meta.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-[var(--text-secondary)]">{desc}</p>
                      <p className="text-[10px] text-[var(--text-tertiary)]">{fmtDate(q.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold tabular-nums [font-family:var(--font-display)] text-[var(--text-primary)]">{fmt(q.total_cents)}</p>
                      <p className={`text-[10px] font-semibold ${meta.color}`}>{meta.label}</p>
                    </div>
                    <ChevronRight size={14} className="shrink-0 text-[var(--text-tertiary)]" />
                  </Link>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Invoices */}
        {invoices.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ...t, delay: 0.13 }}
            className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
              Facturas ({invoices.length})
            </h2>
            <div className="overflow-hidden rounded-2xl bg-[var(--surface)]">
              {invoices.map((inv, i) => {
                const meta = INV_STATUS[inv.status] ?? INV_STATUS.draft;
                const pct = inv.total_cents > 0 ? Math.round(inv.amount_paid_cents / inv.total_cents * 100) : 0;
                return (
                  <Link key={inv.id} href={`/app/invoices/${inv.id}`}
                    className={`flex items-center gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)]' : ''}`}>
                    <Receipt size={15} color="var(--accent)" className="shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.color}`}>{meta.label}</span>
                      {inv.status !== 'paid' && <p className="mt-0.5 text-[10px] text-[var(--text-tertiary)]">{pct}% cobrado</p>}
                    </div>
                    <p className="text-sm font-bold tabular-nums [font-family:var(--font-display)] text-[var(--text-primary)]">{fmt(inv.total_cents)}</p>
                    <ChevronRight size={14} className="shrink-0 text-[var(--text-tertiary)]" />
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Payments */}
        {payments.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ...t, delay: 0.15 }}
            className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
              Pagos recibidos ({payments.length})
            </h2>
            <div className="overflow-hidden rounded-2xl bg-[var(--surface)]">
              {payments.map((p, i) => (
                <div key={p.id}
                  className={`flex items-center gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)]' : ''}`}>
                  <div className="flex size-8 items-center justify-center rounded-xl bg-green-50">
                    <DollarSign size={14} className="text-green-700" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--text-primary)] capitalize">{p.method}</p>
                    <p className="text-[10px] text-[var(--text-tertiary)]">{fmtDate(p.paid_at)}{p.notes ? ` · ${p.notes}` : ''}</p>
                  </div>
                  <p className="text-sm font-bold tabular-nums [font-family:var(--font-display)] text-green-700">+{fmt(p.amount_cents)}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Jobs */}
        {jobs.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ...t, delay: 0.16 }}
            className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
              Trabajos ({jobs.length})
            </h2>
            <div className="overflow-hidden rounded-2xl bg-[var(--surface)]">
              {jobs.map((job, i) => {
                const meta = JOB_STATUS[job.status] ?? JOB_STATUS.scheduled;
                return (
                  <Link key={job.id} href={`/app/jobs/${job.id}`}
                    className={`flex items-center gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)]' : ''}`}>
                    <Briefcase size={15} color="var(--accent)" className="shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{job.title ?? 'Trabajo'}</p>
                      {job.start_date && <p className="text-[10px] text-[var(--text-tertiary)]">{fmtDate(job.start_date)}</p>}
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.color}`}>{meta.label}</span>
                    <ChevronRight size={14} className="shrink-0 text-[var(--text-tertiary)]" />
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Timeline */}
        {(quotes.length > 0 || invoices.length > 0 || payments.length > 0) && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ...t, delay: 0.18 }}
            className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Timeline</h2>
            <div className="flex flex-col gap-2">
              {[
                ...quotes.map(q => ({ date: q.created_at, icon: <FileText size={13} />, iconBg: 'bg-blue-50', iconColor: 'text-blue-600', label: 'Cotización creada', sub: fmt(q.total_cents), href: `/app/quotes/${q.id}` })),
                ...quotes.filter(q => q.accepted_at).map(q => ({ date: q.accepted_at!, icon: <CheckCircle2 size={13} />, iconBg: 'bg-green-50', iconColor: 'text-green-700', label: 'Cotización aceptada', sub: fmt(q.total_cents), href: `/app/quotes/${q.id}` })),
                ...invoices.filter(i => i.issued_at).map(i => ({ date: i.issued_at!, icon: <Receipt size={13} />, iconBg: 'bg-purple-50', iconColor: 'text-purple-700', label: 'Factura emitida', sub: fmt(i.total_cents), href: `/app/invoices/${i.id}` })),
                ...payments.map(p => ({ date: p.paid_at, icon: <DollarSign size={13} />, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-700', label: 'Pago recibido', sub: `+${fmt(p.amount_cents)}`, href: null })),
              ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8).map((ev, i) => {
                const content = (
                  <div key={i} className="flex items-center gap-3 rounded-2xl bg-[var(--surface)] px-4 py-3">
                    <div className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${ev.iconBg}`}>
                      <span className={ev.iconColor}>{ev.icon}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{ev.label}</p>
                      <p className="text-[10px] text-[var(--text-tertiary)]">{fmtDate(ev.date)}</p>
                    </div>
                    <p className="text-sm font-bold tabular-nums [font-family:var(--font-display)] text-[var(--text-primary)]">{ev.sub}</p>
                    {ev.href && <ChevronRight size={14} className="shrink-0 text-[var(--text-tertiary)]" />}
                  </div>
                );
                return ev.href ? <Link key={i} href={ev.href}>{content}</Link> : content;
              })}
            </div>
          </motion.div>
        )}

        {/* Archive / Reactivate */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...t, delay: 0.2 }} className="mt-4">
          {isArchived ? (
            <button onClick={handleReactivate}
              className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] py-3 text-sm font-semibold text-[var(--accent)]">
              <ArchiveRestore size={15} /> Reactivar proyecto
            </button>
          ) : (
            <button onClick={handleArchive}
              className="w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] py-3 text-sm font-semibold text-[var(--text-secondary)]">
              Archivar proyecto
            </button>
          )}
        </motion.div>
      </main>
    </div>
  );
}
