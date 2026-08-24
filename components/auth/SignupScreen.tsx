'use client';

import { useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import Image from 'next/image';
import { User, Mail, ArrowRight, ChevronLeft } from 'lucide-react';

const T = { duration: 0.22, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan') ?? 'crew';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const planLabel = plan === 'annual' ? 'Anual · $32/mes' : plan === 'monthly' ? 'Mensual · $39/mes' : null;

  const trialEnd = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() + 14);
    return d.toLocaleDateString('es-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Ingresa tu nombre.'); return; }
    if (!email.trim() || !email.includes('@')) { setError('Ingresa un correo válido.'); return; }
    setLoading(true);
    router.push(`/checkout?plan=${plan}&email=${encodeURIComponent(email.trim())}&name=${encodeURIComponent(name.trim())}`);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg)]">
      <header className="flex h-14 shrink-0 items-center justify-between px-6">
        <a
          href="/paywall"
          className="flex size-10 items-center justify-center rounded-full hover:bg-[var(--surface)]"
          aria-label="Volver"
        >
          <ChevronLeft size={20} color="var(--text-secondary)" />
        </a>
        <a href="/" className="flex items-center gap-2 text-sm font-bold [font-family:var(--font-display)] text-[var(--text-primary)]">
          <Image src="/logo.png" alt="Quotronex" width={40} height={40} className="rounded-xl" />
          Quotronex
        </a>
        <div className="w-10" aria-hidden />
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-5 pb-12 pt-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={T}>
          {planLabel && (
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] px-3 py-1">
              <span className="size-1.5 rounded-full bg-[var(--accent)]" />
              <span className="text-xs font-semibold text-[var(--accent)]">{planLabel} · 14 días gratis</span>
            </div>
          )}

          <h1 className="text-3xl font-black leading-[1.08] [font-family:var(--font-display)] text-[var(--text-primary)]">
            Crea tu cuenta.
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Prueba 14 días gratis · No se cobra hasta el día 15
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-3">
          <div className="relative">
            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              autoComplete="name"
              placeholder="Nombre completo"
              value={name}
              onChange={e => setName(e.target.value)}
              className="h-13 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_30%,transparent)] bg-white pl-10 pr-4 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[var(--accent)] focus:ring-2 focus:ring-[color-mix(in_oklab,var(--accent)_15%,transparent)]"
            />
          </div>

          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="email"
              autoComplete="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="h-13 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_30%,transparent)] bg-white pl-10 pr-4 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[var(--accent)] focus:ring-2 focus:ring-[color-mix(in_oklab,var(--accent)_15%,transparent)]"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
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
              <>Continuar al pago <ArrowRight size={18} /></>
            )}
          </motion.button>

          <p className="text-center text-xs text-[var(--text-tertiary)]">
            $0 cobrados hoy · Cargo después del {trialEnd}
          </p>
        </form>

        <p className="mt-6 text-center text-xs leading-relaxed text-[var(--text-tertiary)]">
          Al crear tu cuenta aceptas los{' '}
          <a href="/terms" className="underline underline-offset-2">Términos</a>
          {' '}y la{' '}
          <a href="/privacy" className="underline underline-offset-2">Política de privacidad</a>.
        </p>

        <p className="mt-4 text-center text-xs text-[var(--text-tertiary)]">
          ¿Ya tienes cuenta?{' '}
          <a href="/login" className="font-medium text-[var(--accent)] underline underline-offset-2">
            Entrar
          </a>
        </p>
      </main>
    </div>
  );
}

export function SignupScreen() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
