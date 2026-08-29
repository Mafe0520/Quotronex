'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Circle, ChevronRight, X, Rocket } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useT } from '@/lib/i18n';

type Step = {
  id: string;
  label: string;
  sub: string;
  href?: string;
  done: boolean;
};

const STORAGE_KEY = 'quotly-checklist-dismissed';

export function ActivationChecklist({
  hasBizPhone,
  hasBizEmail,
  hasLogo,
  priceBookCount,
  clientCount,
  sentQuoteCount,
  jobCount,
}: {
  hasBizPhone: boolean;
  hasBizEmail?: boolean;
  hasLogo?: boolean;
  priceBookCount: number;
  clientCount: number;
  sentQuoteCount: number;
  jobCount: number;
}) {
  const router = useRouter();
  const tr = useT();
  const c = tr.app.checklist;
  const [dismissed, setDismissed] = useState(true); // start hidden, set in effect
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    const d = localStorage.getItem(STORAGE_KEY);
    if (!d) setDismissed(false);
  }, []);

  const steps: Step[] = [
    {
      id: 'profile',
      label: c.profile,
      sub: hasBizPhone && hasBizEmail && hasLogo
        ? c.profileDone
        : [!hasLogo && 'logo', !hasBizPhone && (tr.nav.settings === 'Settings' ? 'phone' : 'teléfono'), !hasBizEmail && (tr.nav.settings === 'Settings' ? 'email' : 'correo')].filter(Boolean).join(', ') + ' ' + c.profilePending,
      href: '/app/settings',
      done: !!hasBizPhone && !!hasBizEmail && !!hasLogo,
    },
    {
      id: 'pricebook',
      label: c.pricebook,
      sub: c.pricebookSub(priceBookCount),
      href: '/app/price-book/new',
      done: priceBookCount >= 3,
    },
    {
      id: 'client',
      label: c.clientStep,
      sub: c.clientSub(clientCount),
      href: '/app/customers/new',
      done: clientCount > 0,
    },
    {
      id: 'quote',
      label: c.quoteStep,
      sub: c.quoteSub(sentQuoteCount),
      href: '/app/quotes/new',
      done: sentQuoteCount > 0,
    },
    {
      id: 'job',
      label: c.jobStep,
      sub: c.jobSub(jobCount),
      href: '/app/jobs',
      done: jobCount > 0,
    },
  ];

  const doneCount = steps.filter(s => s.done).length;
  const allDone = doneCount === steps.length;
  const pct = Math.round((doneCount / steps.length) * 100);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1');
    setDismissed(true);
  }

  if (dismissed || allDone) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-2xl border border-[color-mix(in_oklab,var(--accent)_20%,transparent)] bg-[color-mix(in_oklab,var(--accent)_4%,var(--surface))] overflow-hidden"
      >
        {/* Header */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setExpanded(v => !v)}
          onKeyDown={e => e.key === 'Enter' && setExpanded(v => !v)}
          className="flex w-full items-center gap-3 px-4 pt-4 pb-3 cursor-pointer"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--accent)_15%,transparent)]">
            <Rocket size={15} color="var(--accent)" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-[var(--text-primary)]">{c.title}</p>
            <p className="text-xs text-[var(--text-tertiary)]">{c.completed(doneCount, steps.length)}</p>
          </div>
          {/* Progress bar */}
          <div className="w-16 shrink-0">
            <div className="h-1.5 w-full rounded-full bg-[color-mix(in_oklab,var(--accent)_15%,transparent)]">
              <motion.div
                className="h-full rounded-full bg-[var(--accent)]"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
            <p className="mt-0.5 text-right text-[9px] font-bold text-[var(--accent)]">{pct}%</p>
          </div>
          <button
            onClick={e => { e.stopPropagation(); dismiss(); }}
            className="flex size-6 shrink-0 items-center justify-center rounded-full text-[var(--text-tertiary)] hover:bg-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)]"
          >
            <X size={13} />
          </button>
        </div>

        {/* Steps */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="flex flex-col divide-y divide-[color-mix(in_oklab,var(--text-tertiary)_8%,transparent)] px-4 pb-3">
                {steps.map(step => (
                  <motion.button
                    key={step.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => step.href && router.push(step.href)}
                    disabled={step.done}
                    className="flex items-center gap-3 py-3 text-left w-full"
                  >
                    {step.done ? (
                      <CheckCircle2 size={18} className="shrink-0 text-[var(--accent)]" />
                    ) : (
                      <Circle size={18} className="shrink-0 text-[color-mix(in_oklab,var(--text-tertiary)_40%,transparent)]" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold leading-snug ${step.done ? 'text-[var(--text-tertiary)] line-through' : 'text-[var(--text-primary)]'}`}>
                        {step.label}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)] truncate">{step.sub}</p>
                    </div>
                    {!step.done && <ChevronRight size={14} className="shrink-0 text-[var(--text-tertiary)]" />}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
