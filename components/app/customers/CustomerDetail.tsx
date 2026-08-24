'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  ChevronLeft, ChevronRight, Pencil, Phone, Mail, FileText,
  FolderOpen, Plus, MapPin, Receipt, Tag, MessageCircle, ArchiveRestore,
} from 'lucide-react';
import { archiveCustomer, reactivateCustomer } from '@/app/actions/clients';
import { useT } from '@/lib/i18n';

type Customer = { id: string; name: string; email: string | null; phone: string | null; address: string | null; notes: string | null; tags?: string[]; contact_pref?: string | null; archived_at?: string | null };
type Project  = { id: string; name: string; job_address: string | null; status: string; created_at: string };
type QuoteRow = { id: string; status: string; total_cents: number; created_at: string; quote_items: { name: string }[] };
type InvoiceRow = { id: string; status: string; total_cents: number; amount_paid_cents: number; due_at: string | null };

interface Props { customer: Customer; projects: Project[]; quotes?: QuoteRow[]; invoices?: InvoiceRow[] }

const STATUS_COLOR: Record<string, string> = {
  lead:      'text-amber-600 bg-amber-50',
  active:    'text-blue-600 bg-blue-50',
  completed: 'text-[var(--accent-2)] bg-green-50',
  canceled:  'text-[var(--text-tertiary)] bg-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)]',
};

const t = { duration: 0.2, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] };

const QUOTE_STATUS: Record<string, { label: string; color: string }> = {
  draft:     { label: 'Borrador',  color: 'text-[var(--text-tertiary)] bg-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)]' },
  sent:      { label: 'Enviada',   color: 'text-blue-600 bg-blue-50' },
  viewed:    { label: 'Vista',     color: 'text-amber-600 bg-amber-50' },
  accepted:  { label: 'Aceptada',  color: 'text-green-700 bg-green-50' },
  declined:  { label: 'Declinada', color: 'text-red-600 bg-red-50' },
  expired:   { label: 'Expirada',  color: 'text-[var(--text-tertiary)] bg-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)]' },
  converted: { label: 'Facturada', color: 'text-purple-700 bg-purple-50' },
};
const INV_STATUS: Record<string, { label: string; color: string }> = {
  draft:   { label: 'Borrador',     color: 'text-[var(--text-tertiary)] bg-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)]' },
  sent:    { label: 'Enviada',      color: 'text-blue-600 bg-blue-50' },
  partial: { label: 'Pago parcial', color: 'text-amber-600 bg-amber-50' },
  paid:    { label: 'Pagada',       color: 'text-green-700 bg-green-50' },
  overdue: { label: 'Vencida',      color: 'text-red-600 bg-red-50' },
};
const fmtMoney = (c: number) => `$${(c / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export function CustomerDetail({ customer, projects, quotes = [], invoices = [] }: Props) {
  const router = useRouter();
  const tr = useT();
  const initials = customer.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const isArchived = !!customer.archived_at;

  async function handleArchive() {
    if (!confirm(tr.customers.archiveConfirm(customer.name))) return;
    await archiveCustomer(customer.id);
  }

  async function handleReactivate() {
    await reactivateCustomer(customer.id);
  }

  const CONTACT_PREF_LABEL: Record<string, string> = {
    phone: 'Llamada',
    sms:   'SMS / Texto',
    email: 'Email',
    any:   'Sin preferencia',
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg)]">
      {/* Header */}
      <header className="flex h-14 items-center justify-between px-4">
        <button
          type="button"
          onClick={() => router.push('/app/customers')}
          className="flex size-10 items-center justify-center rounded-full hover:bg-[var(--surface)] [touch-action:manipulation]"
          aria-label="Back"
        >
          <ChevronLeft size={20} color="var(--text-secondary)" />
        </button>
        <Link
          href={`/app/customers/${customer.id}/edit`}
          className="flex h-9 items-center gap-1.5 rounded-full border border-[color-mix(in_oklab,var(--text-tertiary)_30%,transparent)] bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--text-primary)] [touch-action:manipulation]"
        >
          <Pencil size={13} />
          {tr.customers.edit}
        </Link>
      </header>

      <main className="flex flex-col gap-5 px-5 pt-2 pb-12">
        {/* Avatar + name */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={t}
          className="flex items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]">
            <span className="text-2xl font-bold [font-family:var(--font-display)] text-[var(--accent)]">{initials}</span>
          </div>
          <div>
            <h1 className="text-xl font-bold [font-family:var(--font-display)] text-[var(--text-primary)]">{customer.name}</h1>
            {projects.length > 0 && (
              <p className="text-sm text-[var(--text-secondary)]">{tr.customers.activeProjects(projects.length)}</p>
            )}
          </div>
        </motion.div>

        {/* Contact info */}
        {(customer.phone || customer.email || customer.address || customer.notes) && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ...t, delay: 0.05 }}
            className="flex flex-col gap-0 overflow-hidden rounded-2xl bg-[var(--surface)]">
            {customer.phone && (
              <a href={`tel:${customer.phone}`} className="flex items-center gap-3 px-4 py-3.5 border-b border-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)] [touch-action:manipulation]">
                <Phone size={15} color="var(--accent)" />
                <span className="text-sm text-[var(--text-primary)]">{customer.phone}</span>
              </a>
            )}
            {customer.email && (
              <a href={`mailto:${customer.email}`} className="flex items-center gap-3 px-4 py-3.5 border-b border-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)] [touch-action:manipulation]">
                <Mail size={15} color="var(--accent)" />
                <span className="text-sm text-[var(--text-primary)]">{customer.email}</span>
              </a>
            )}
            {customer.address && (
              <div className="flex items-start gap-3 px-4 py-3.5 border-b border-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)]">
                <MapPin size={15} color="var(--accent)" className="mt-0.5 shrink-0" />
                <span className="text-sm text-[var(--text-primary)]">{customer.address}</span>
              </div>
            )}
            {customer.notes && (
              <div className="flex items-start gap-3 px-4 py-3.5">
                <FileText size={15} color="var(--text-tertiary)" className="mt-0.5 shrink-0" />
                <span className="text-sm text-[var(--text-secondary)]">{customer.notes}</span>
              </div>
            )}
          </motion.div>
        )}

        {/* Tags */}
        {(customer.tags ?? []).length > 0 && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ...t, delay: 0.08 }}
            className="flex flex-wrap gap-2">
            {customer.tags!.map(tag => (
              <span key={tag} className="flex items-center gap-1 rounded-full bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                <Tag size={11} /> {tag}
              </span>
            ))}
          </motion.div>
        )}

        {/* Contact preference */}
        {customer.contact_pref && customer.contact_pref !== 'any' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ...t, delay: 0.09 }}
            className="flex items-center gap-2 rounded-2xl bg-[var(--surface)] px-4 py-3">
            <MessageCircle size={15} color="var(--accent)" />
            <span className="text-sm text-[var(--text-secondary)]">
              Prefiere contacto por <span className="font-semibold text-[var(--text-primary)]">{CONTACT_PREF_LABEL[customer.contact_pref] ?? customer.contact_pref}</span>
            </span>
          </motion.div>
        )}

        {/* Archived banner */}
        {isArchived && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={t}
            className="flex items-center gap-3 rounded-2xl bg-amber-50 px-4 py-3">
            <ArchiveRestore size={16} className="text-amber-600 shrink-0" />
            <p className="flex-1 text-sm text-amber-700">Este cliente está archivado</p>
            <button onClick={handleReactivate}
              className="text-xs font-bold text-amber-700 underline">
              Reactivar
            </button>
          </motion.div>
        )}

        {/* Projects section */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ...t, delay: 0.1 }}
          className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">{tr.customers.projects}</h2>
            <Link
              href={`/app/customers/${customer.id}/projects/new`}
              className="flex h-8 items-center gap-1 rounded-full bg-[var(--accent)] px-3 text-xs font-bold text-white [touch-action:manipulation]"
            >
              <Plus size={13} />
              {tr.common.new}
            </Link>
          </div>

          {projects.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-[var(--surface)] py-8 px-5 text-center">
              <FolderOpen size={28} color="var(--text-tertiary)" strokeWidth={1.5} />
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{tr.customers.noProjects}</p>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{tr.customers.noProjectsSub}</p>
              </div>
              <Link
                href={`/app/customers/${customer.id}/projects/new`}
                className="flex h-10 items-center gap-1.5 rounded-[var(--radius-button)] bg-[var(--accent)] px-5 text-xs font-bold text-white [box-shadow:var(--shadow-cta)] [touch-action:manipulation]"
              >
                <Plus size={14} />
                {tr.customers.createProject}
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {projects.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ ...t, delay: 0.12 + i * 0.04 }}>
                  <Link href={`/app/projects/${p.id}`} className="flex items-center gap-3 rounded-2xl bg-[var(--surface)] p-4 [touch-action:manipulation]">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--accent)_8%,transparent)]">
                      <FolderOpen size={16} color="var(--accent)" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{p.name}</p>
                      {p.job_address && (
                        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-[var(--text-tertiary)]">
                          <MapPin size={11} />
                          {p.job_address}
                        </p>
                      )}
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[p.status] ?? STATUS_COLOR.active}`}>
                      {tr.projects.status[p.status as keyof typeof tr.projects.status] ?? p.status}
                    </span>
                    <ChevronRight size={16} className="shrink-0 text-[var(--text-tertiary)]" />
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Nueva cotización */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ...t, delay: 0.15 }}>
          <Link
            href={`/app/quotes/new?clientId=${customer.id}`}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] text-sm font-bold text-white [box-shadow:var(--shadow-cta)]"
          >
            <Plus size={16} /> Nueva cotización para {customer.name.split(' ')[0]}
          </Link>
        </motion.div>

        {/* Cotizaciones */}
        {quotes.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ...t, delay: 0.18 }}
            className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
              Cotizaciones ({quotes.length})
            </h2>
            <div className="flex flex-col gap-2">
              {quotes.map(q => {
                const meta = QUOTE_STATUS[q.status] ?? QUOTE_STATUS.draft;
                const desc = q.quote_items.slice(0, 2).map(i => i.name).join(' · ') || 'Sin ítems';
                return (
                  <Link key={q.id} href={`/app/quotes/${q.id}`}
                    className="flex items-center gap-3 rounded-2xl bg-[var(--surface)] px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold tabular-nums [font-family:var(--font-display)] text-[var(--text-primary)]">
                          {fmtMoney(q.total_cents)}
                        </span>
                        <span className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${meta.color}`}>
                          {meta.label}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-[var(--text-tertiary)]">{desc}</p>
                    </div>
                    <ChevronRight size={15} className="shrink-0 text-[var(--text-tertiary)]" />
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Facturas */}
        {invoices.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ...t, delay: 0.2 }}
            className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
              Facturas ({invoices.length})
            </h2>
            <div className="flex flex-col gap-2">
              {invoices.map(inv => {
                const meta = INV_STATUS[inv.status] ?? INV_STATUS.draft;
                const pct = inv.total_cents > 0 ? Math.round(inv.amount_paid_cents / inv.total_cents * 100) : 0;
                return (
                  <Link key={inv.id} href={`/app/invoices/${inv.id}`}
                    className="flex items-center gap-3 rounded-2xl bg-[var(--surface)] px-4 py-3">
                    <Receipt size={16} color="var(--accent)" className="shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold tabular-nums [font-family:var(--font-display)] text-[var(--text-primary)]">
                          {fmtMoney(inv.total_cents)}
                        </span>
                        <span className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${meta.color}`}>
                          {meta.label}
                        </span>
                      </div>
                      {inv.status !== 'paid' && (
                        <p className="text-xs text-[var(--text-tertiary)]">{pct}% cobrado</p>
                      )}
                    </div>
                    <ChevronRight size={15} className="shrink-0 text-[var(--text-tertiary)]" />
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Actions */}
        {!isArchived && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...t, delay: 0.2 }}
            className="mt-4">
            <button
              type="button"
              onClick={handleArchive}
              className="w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] py-3 text-sm font-semibold text-[var(--text-secondary)] [touch-action:manipulation]"
            >
              {tr.customers.archive}
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
