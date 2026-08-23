'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ChevronLeft, User, Phone, Mail, FileText } from 'lucide-react';
import { createCustomer, updateCustomer } from '@/app/actions/clients';
import { useT } from '@/lib/i18n';

interface Props {
  mode: 'create';
  initial?: never;
  customerId?: never;
}

interface EditProps {
  mode: 'edit';
  customerId: string;
  initial: { name: string; email: string | null; phone: string | null; notes: string | null };
}

const t = { duration: 0.22, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] };

export function CustomerForm(props: Props | EditProps) {
  const router = useRouter();
  const tr = useT();
  const action = props.mode === 'edit'
    ? updateCustomer.bind(null, props.customerId)
    : createCustomer;

  const [error, formAction, pending] = useActionState(action, null);

  const initial = props.mode === 'edit' ? props.initial : null;

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg)]">
      {/* Header */}
      <header className="flex h-14 items-center gap-3 px-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex size-10 items-center justify-center rounded-full hover:bg-[var(--surface)] [touch-action:manipulation]"
          aria-label={tr.customers.back}
        >
          <ChevronLeft size={20} color="var(--text-secondary)" />
        </button>
        <h1 className="text-base font-bold [font-family:var(--font-display)] text-[var(--text-primary)]">
          {props.mode === 'create' ? tr.customers.newTitle : tr.customers.editTitle}
        </h1>
      </header>

      <main className="flex-1 px-5 pt-2 pb-12">
        <form action={formAction} className="flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
              {tr.customers.name} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                name="name"
                type="text"
                required
                defaultValue={initial?.name ?? ''}
                placeholder={tr.customers.namePh}
                className="h-13 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_30%,transparent)] bg-[var(--surface)] pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[color-mix(in_oklab,var(--accent)_15%,transparent)]"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">{tr.customers.phone}</label>
            <div className="relative">
              <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                name="phone"
                type="tel"
                defaultValue={initial?.phone ?? ''}
                placeholder={tr.customers.phonePh}
                className="h-13 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_30%,transparent)] bg-[var(--surface)] pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[color-mix(in_oklab,var(--accent)_15%,transparent)]"
              />
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">{tr.customers.email}</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                name="email"
                type="email"
                defaultValue={initial?.email ?? ''}
                placeholder={tr.customers.emailPh}
                className="h-13 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_30%,transparent)] bg-[var(--surface)] pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[color-mix(in_oklab,var(--accent)_15%,transparent)]"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">{tr.customers.notes}</label>
            <div className="relative">
              <FileText size={15} className="absolute left-3.5 top-3.5 text-[var(--text-tertiary)]" />
              <textarea
                name="notes"
                rows={3}
                defaultValue={initial?.notes ?? ''}
                placeholder={tr.customers.notesPh}
                className="w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_30%,transparent)] bg-[var(--surface)] pl-10 pr-4 pt-3 pb-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[color-mix(in_oklab,var(--accent)_15%,transparent)] resize-none"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <p role="alert" className="rounded-[var(--radius-button)] bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </p>
          )}

          {/* Save */}
          <motion.button
            type="submit"
            whileTap={{ scale: 0.97 }}
            disabled={pending}
            className="mt-2 flex h-14 w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] text-base font-semibold text-white [box-shadow:var(--shadow-cta)] disabled:opacity-60 [touch-action:manipulation]"
            transition={t}
          >
            {pending ? (
              <svg className="size-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".25" />
                <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            ) : props.mode === 'create' ? tr.customers.save : tr.customers.saveChanges}
          </motion.button>
        </form>
      </main>
    </div>
  );
}
