'use client';

import { Globe } from 'lucide-react';
import { useLang } from '@/app/lang-context';

export function LangSelector({ className = '' }: { className?: string }) {
  const { lang, setLang } = useLang();

  return (
    <div className={`flex items-center gap-1 ${className}`} role="group" aria-label="Language selector">
      <Globe size={13} strokeWidth={2} aria-hidden="true" className="shrink-0 text-[var(--text-tertiary)]" />
      <button
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
        className={`rounded px-2 py-1 text-xs font-medium transition-colors duration-150 ${
          lang === 'en'
            ? 'text-[var(--text-primary)]'
            : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
        }`}
      >
        EN
      </button>
      <span aria-hidden="true" className="select-none text-xs text-[var(--text-tertiary)]">/</span>
      <button
        onClick={() => setLang('es')}
        aria-pressed={lang === 'es'}
        className={`rounded px-2 py-1 text-xs font-medium transition-colors duration-150 ${
          lang === 'es'
            ? 'text-[var(--text-primary)]'
            : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
        }`}
      >
        ES
      </button>
    </div>
  );
}
