'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { Eye, EyeOff, Mail, Lock, ArrowRight, MailCheck } from 'lucide-react';
import Image from 'next/image';
import { signIn, resendConfirmation } from '@/app/actions/auth';
import { createClient } from '@/lib/supabase/browser';
import { useT } from '@/lib/i18n';

const transition = { duration: 0.22, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tr = useT();

  const urlError   = searchParams.get('error');
  const urlConfirm = searchParams.get('confirm');
  const [email, setEmail] = useState(urlConfirm ?? '');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(urlError ?? '');
  const [pendingConfirmation, setPendingConfirmation] = useState(!!urlConfirm);
  const [resending, setResending] = useState(false);
  const [resendDone, setResendDone] = useState(false);

  async function handleGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/app`,
      },
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) { setError(tr.auth.passwordShort); return; }
    setLoading(true);

    const result = await signIn(email.trim(), password);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push(result.redirectTo ?? '/app');
    router.refresh();
  }

  if (pendingConfirmation) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--bg)] px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={transition}
          className="flex flex-col items-center gap-5"
        >
          <div className="flex size-16 items-center justify-center rounded-2xl bg-[color-mix(in_oklab,var(--accent)_12%,transparent)]">
            <MailCheck size={28} color="var(--accent)" />
          </div>
          <div>
            <h1 className="text-xl font-bold [font-family:var(--font-display)] text-[var(--text-primary)]">
              {tr.auth.confirmTitle}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
              {tr.auth.confirmSub}{' '}
              <span className="font-semibold text-[var(--text-primary)]">{email}</span>
              {tr.auth.confirmSub2}
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            {resendDone ? (
              <p className="text-xs text-[var(--accent)]">{tr.auth.resendDone}</p>
            ) : (
              <button
                disabled={resending}
                onClick={async () => {
                  setResending(true);
                  await resendConfirmation(email);
                  setResending(false);
                  setResendDone(true);
                }}
                className="text-xs font-medium text-[var(--accent)] underline underline-offset-2 disabled:opacity-50"
              >
                {resending ? tr.auth.resending : tr.auth.resend}
              </button>
            )}
            <button
              onClick={() => { setPendingConfirmation(false); setResendDone(false); setError(''); }}
              className="text-xs text-[var(--text-tertiary)] underline underline-offset-2"
            >
              {tr.auth.backToForm}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg)]">
      <header className="flex h-14 items-center px-6">
        <a href="/" className="flex items-center gap-2 text-sm font-bold [font-family:var(--font-display)] text-[var(--text-primary)]">
          <Image src="/logo.png" alt="Quotronex" width={40} height={40} className="rounded-xl" />
          Quotronex
        </a>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-5 pb-12 pt-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={transition}>
          <h1 className="text-3xl font-black leading-[1.08] [font-family:var(--font-display)] text-[var(--text-primary)]">
            {tr.auth.loginTitle}
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{tr.auth.loginSub}</p>
        </motion.div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={handleGoogle}
          className="mt-8 flex h-13 w-full items-center justify-center gap-3 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_30%,transparent)] bg-white text-sm font-semibold text-gray-900 shadow-sm [touch-action:manipulation]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path fillRule="evenodd" clipRule="evenodd" d="M23.04 12.26c0-.85-.08-1.67-.22-2.46H12v4.65h6.19a5.29 5.29 0 0 1-2.3 3.47v2.88h3.72c2.18-2 3.43-4.96 3.43-8.54ZM12 24c3.11 0 5.72-1.03 7.62-2.79l-3.72-2.89c-1.03.69-2.35 1.1-3.9 1.1-3 0-5.54-2.02-6.45-4.74H1.72v2.98A11.5 11.5 0 0 0 12 24ZM5.55 14.68A6.9 6.9 0 0 1 5.19 12c0-.93.16-1.83.36-2.68V6.34H1.72A11.5 11.5 0 0 0 .5 12c0 1.86.44 3.61 1.22 5.16l3.83-2.48ZM12 4.58c1.69 0 3.2.58 4.4 1.72l3.3-3.3C17.71 1.08 15.1 0 12 0A11.5 11.5 0 0 0 1.72 6.34l3.83 2.98C6.46 6.6 9 4.58 12 4.58Z" fill="currentColor" opacity=".7"/>
          </svg>
          {tr.auth.google}
        </motion.button>

        <div className="mt-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)]" />
          <span className="text-xs text-[var(--text-tertiary)]">{tr.auth.orWith}</span>
          <div className="h-px flex-1 bg-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)]" />
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-5 flex flex-col gap-3">
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="email"
              autoComplete="email"
              placeholder={tr.auth.emailPh}
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="h-13 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_30%,transparent)] bg-white pl-10 pr-4 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[var(--accent)] focus:ring-2 focus:ring-[color-mix(in_oklab,var(--accent)_15%,transparent)]"
            />
          </div>

          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder={tr.auth.passwordCurrent}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="h-13 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_30%,transparent)] bg-white pl-10 pr-11 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[var(--accent)] focus:ring-2 focus:ring-[color-mix(in_oklab,var(--accent)_15%,transparent)]"
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
              aria-label={showPw ? tr.auth.hidePw : tr.auth.showPw}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <a href="/forgot-password" className="self-end text-xs font-medium text-[var(--accent)]">
            {tr.auth.forgotPassword}
          </a>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </p>
          )}

          <motion.button
            type="submit"
            whileTap={{ scale: 0.97 }}
            disabled={loading}
            className="mt-1 flex h-13 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] text-base font-bold text-[var(--bg)] [box-shadow:var(--shadow-cta)] disabled:opacity-60 [touch-action:manipulation]"
          >
            {loading ? (
              <svg className="size-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".25" />
                <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            ) : (
              <>{tr.auth.ctaLogin} <ArrowRight size={18} /></>
            )}
          </motion.button>
        </form>

        <p className="mt-6 text-center text-xs text-[var(--text-tertiary)]">
          ¿No tienes cuenta?{' '}
          <a href="/signup" className="font-medium text-[var(--accent)] underline underline-offset-2">
            Empieza gratis
          </a>
        </p>
      </main>
    </div>
  );
}

export function LoginScreen() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
