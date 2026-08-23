'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  ChevronLeft, ChevronRight, Pencil, Phone, Mail, FileText,
  FolderOpen, Plus, MapPin,
} from 'lucide-react';
import { archiveCustomer } from '@/app/actions/clients';
import { useT } from '@/lib/i18n';

type Customer = { id: string; name: string; email: string | null; phone: string | null; notes: string | null };
type Project  = { id: string; name: string; job_address: string | null; status: string; created_at: string };

interface Props { customer: Customer; projects: Project[] }

const STATUS_COLOR: Record<string, string> = {
  lead:      'text-amber-600 bg-amber-50',
  active:    'text-blue-600 bg-blue-50',
  completed: 'text-[var(--accent-2)] bg-green-50',
  canceled:  'text-[var(--text-tertiary)] bg-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)]',
};

const t = { duration: 0.2, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] };

export function CustomerDetail({ customer, projects }: Props) {
  const router = useRouter();
  const tr = useT();
  const initials = customer.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  async function handleArchive() {
    if (!confirm(tr.customers.archiveConfirm(customer.name))) return;
    await archiveCustomer(customer.id);
  }

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
        {(customer.phone || customer.email || customer.notes) && (
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
            {customer.notes && (
              <div className="flex items-start gap-3 px-4 py-3.5">
                <FileText size={15} color="var(--text-tertiary)" className="mt-0.5 shrink-0" />
                <span className="text-sm text-[var(--text-secondary)]">{customer.notes}</span>
              </div>
            )}
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

        {/* Actions */}
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
      </main>
    </div>
  );
}
