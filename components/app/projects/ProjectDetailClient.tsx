'use client';

import Link from 'next/link';
import { ChevronLeft, MapPin, FolderOpen } from 'lucide-react';
import { useT } from '@/lib/i18n';

const STATUS_COLOR: Record<string, string> = {
  lead:      'text-amber-600 bg-amber-50',
  active:    'text-blue-600 bg-blue-50',
  completed: 'text-green-700 bg-green-50',
  canceled:  'text-gray-500 bg-gray-100',
};

interface Props {
  id: string;
  name: string;
  status: string;
  jobAddress: string | null;
  client: { id: string; name: string } | null;
}

export function ProjectDetailClient({ id, name, status, jobAddress, client }: Props) {
  const tr = useT();

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg)]">
      <header className="flex h-14 items-center justify-between px-4">
        <Link
          href={client ? `/app/customers/${client.id}` : '/app/customers'}
          className="flex size-10 items-center justify-center rounded-full hover:bg-[var(--surface)] [touch-action:manipulation]"
          aria-label={tr.projects.back}
        >
          <ChevronLeft size={20} color="var(--text-secondary)" />
        </Link>
        <Link
          href={`/app/projects/${id}/edit`}
          className="flex h-9 items-center gap-1.5 rounded-full border border-[color-mix(in_oklab,var(--text-tertiary)_30%,transparent)] bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--text-primary)] [touch-action:manipulation]"
        >
          {tr.projects.edit}
        </Link>
      </header>

      <main className="flex flex-col gap-5 px-5 pt-2 pb-24">
        <div className="flex flex-col gap-2">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]">
            <FolderOpen size={22} color="var(--accent)" strokeWidth={1.5} />
          </div>
          <h1 className="text-xl font-bold [font-family:var(--font-display)] text-[var(--text-primary)]">{name}</h1>
          {client && (
            <Link href={`/app/customers/${client.id}`} className="text-sm text-[var(--accent)] font-medium">
              {client.name}
            </Link>
          )}
          <span className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLOR[status] ?? STATUS_COLOR.active}`}>
            {tr.projects.status[status as keyof typeof tr.projects.status] ?? status}
          </span>
        </div>

        {jobAddress && (
          <div className="flex items-start gap-3 rounded-2xl bg-[var(--surface)] p-4">
            <MapPin size={16} className="mt-0.5 shrink-0 text-[var(--accent)]" />
            <p className="text-sm text-[var(--text-primary)]">{jobAddress}</p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">{tr.projects.estimates}</p>
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] p-8 text-center">
            <p className="text-sm font-semibold text-[var(--text-primary)]">{tr.projects.noEstimates}</p>
            <p className="text-xs text-[var(--text-tertiary)]">{tr.projects.noEstimatesSub}</p>
            <button className="mt-1 flex h-10 items-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] px-4 text-sm font-semibold text-white [box-shadow:var(--shadow-cta)] [touch-action:manipulation]">
              {tr.projects.newEstimate}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
