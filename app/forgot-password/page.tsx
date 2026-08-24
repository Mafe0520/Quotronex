'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, MailCheck, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { requestPasswordReset } from '@/app/actions/auth';
import { useLang } from '@/app/lang-context';

const T = { duration: 0.22, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

export default function ForgotPasswordPage() {
  const { lang } = useLang();
  const es = lang === 'es';

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    const result = await requestPasswordReset(email.trim());
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--bg)] px-6 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={T}
          className="flex flex-col items-center gap-5 max-w-sm">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-[color-mix(in_oklab,var(--accent)_12%,transparent)]">
            <MailCheck size={28} color="var(--accent)" />
          </div>
          <div>
            <h1 className="text-xl font-bold [font-family:var(--font-display)] text-[var(--text-primary)]">
              {es ? 'Revisa tu correo' : 'Check your email'}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
              {es
                ? <>Te enviamos un enlace a <strong className="text-[var(--text-primary)]">{email}</strong>. Haz clic en él para crear una nueva contraseña.</>
                : <>We sent a link to <strong className="text-[var(--text-primary)]">{email}</strong>. Click it to set a new password.</>}
            </p>
          </div>
          <a href="/login" className="text-xs font-medium text-[var(--accent)] underline underline-offset-2">
            {es ? 'Volver a iniciar sesión' : 'Back to sign in'}
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg)]">
      <header className="flex h-14 items-center px-6">
        <a href="/login" className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          <ArrowLeft size={16} />
          {es ? 'Volver' : 'Back'}
        </a>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-5 pb-12 pt-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={T} className="mb-8">
          <a href="/" className="mb-6 flex items-center gap-2 text-sm font-bold [font-family:var(--font-display)] text-[var(--text-primary)]">
            <Image src="/logo.png" alt="Quotronex" width={32} height={32} className="rounded-lg" />
            Quotronex
          </a>
          <h1 className="text-3xl font-black leading-[1.08] [font-family:var(--font-display)] text-[var(--text-primary)]">
            {es ? '¿Olvidaste tu contraseña?' : 'Forgot your password?'}
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {es
              ? 'Ingresa tu correo y te enviamos un enlace para crear una nueva.'
              : 'Enter your email and we\'ll send you a reset link.'}
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="email"
              autoComplete="email"
              placeholder={es ? 'tu@correo.com' : 'you@email.com'}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="h-13 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_30%,transparent)] bg-white pl-10 pr-4 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[var(--accent)] focus:ring-2 focus:ring-[color-mix(in_oklab,var(--accent)_15%,transparent)]"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
          )}

          <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={loading}
            className="mt-1 flex h-13 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] text-base font-bold text-[var(--bg)] [box-shadow:var(--shadow-cta)] disabled:opacity-60 [touch-action:manipulation]">
            {loading ? (
              <svg className="size-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".25" />
                <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            ) : (es ? 'Enviar enlace →' : 'Send reset link →')}
          </motion.button>
        </form>
      </main>
    </div>
  );
}
