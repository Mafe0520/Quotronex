'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, User, Bell, ShieldCheck, LogOut } from 'lucide-react';
import { signOut } from '@/app/actions/auth';
import { useT } from '@/lib/i18n';

interface Props {
  user: { email: string };
  business: { id: string; name: string } | null;
}

export function SettingsView({ user, business }: Props) {
  const [signingOut, setSigningOut] = useState(false);
  const tr = useT();

  const rows = [
    { Icon: User,        label: tr.settings.account,      sub: user.email },
    { Icon: Bell,        label: tr.settings.notifications, sub: tr.settings.manageAlerts },
    { Icon: ShieldCheck, label: tr.settings.subscription,  sub: tr.settings.planBilling },
  ];

  return (
    <div className="flex flex-col gap-5 px-5 pt-2 pb-6">
      {business && (
        <div className="rounded-2xl bg-[var(--surface)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">{tr.settings.business}</p>
          <p className="mt-1 text-base font-bold [font-family:var(--font-display)] text-[var(--text-primary)]">{business.name}</p>
        </div>
      )}

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

      <motion.button
        whileTap={{ scale: 0.97 }}
        disabled={signingOut}
        onClick={async () => { setSigningOut(true); await signOut(); }}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] border border-red-200 text-sm font-semibold text-red-600 disabled:opacity-50 [touch-action:manipulation]"
      >
        <LogOut size={16} />
        {signingOut ? tr.settings.signingOut : tr.settings.signOut}
      </motion.button>
    </div>
  );
}
