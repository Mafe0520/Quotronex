'use client';

// KIT DE LANDING — §1 HERO con Navbar completa
// Navbar: logo | nav links | EN/ES | Log in | Start free (desktop)
//         logo + EN/ES | hamburger (mobile, AnimatePresence)
// Hero:   h1 MARCADO · subtítulo · CTA primario + secundario · prueba social · visual

import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { CtaButton } from './ui';
import { LangSelector } from './LangSelector';
import { HeroBackground } from './HeroBackground';
import { MarkedCopy, truncarMarcado, warnCopy } from './MarkedCopy';

export interface NavLink {
  label: string;
  href: string;
}

export interface HeroProps {
  appName: string;
  logo?: ReactNode;
  navLinks?: NavLink[];
  loginHref?: string;
  loginLabel?: string;
  h1Marked: string;
  subtitleMarked: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  socialProof?: ReactNode;
  visual?: ReactNode;
  visualPlaceholderSugerencia?: string;
  id?: string;
}

export function Hero({
  appName,
  logo,
  navLinks = [],
  loginHref,
  loginLabel = 'Log in',
  h1Marked,
  subtitleMarked,
  ctaLabel,
  ctaHref,
  secondaryCtaLabel,
  secondaryCtaHref = '#solucion',
  socialProof,
  visual,
  id = 'hero',
}: HeroProps) {
  warnCopy('Hero → h1', h1Marked, 10);
  warnCopy('Hero → subtítulo', subtitleMarked, 14);
  const subtitulo = truncarMarcado(subtitleMarked, 14);

  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <section id={id} className="relative z-0 overflow-hidden bg-[var(--bg)]">
      {/* Capa 1: radar animado */}
      <HeroBackground />
      {/* Gradiente de disolución inferior — transición suave */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-48"
        style={{ background: 'linear-gradient(to bottom, transparent, var(--bg))' }}
      />

      <div className="mx-auto w-full max-w-6xl px-6">
        {/* ── NAVBAR ─────────────────────────────────────────────────────────── */}
        <header className="flex h-16 items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]">
            {logo ?? (
              <span aria-hidden="true" className="size-6 rounded-lg bg-[var(--accent)]" />
            )}
            {appName}
          </a>

          {/* Desktop nav */}
          <nav aria-label="Main navigation" className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop right actions */}
          <div className="hidden items-center gap-3 md:flex">
            <LangSelector />
            {loginHref && (
              <a
                href={loginHref}
                className="px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
              >
                {loginLabel}
              </a>
            )}
            <motion.a
              whileTap={{ scale: 0.97 }}
              href={ctaHref}
              className="inline-flex h-9 items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--bg)] transition-colors hover:bg-[color-mix(in_oklab,var(--accent)_88%,var(--text-primary))] [touch-action:manipulation]"
            >
              {ctaLabel}
            </motion.a>
          </div>

          {/* Mobile: EN/ES + login + hamburger */}
          <div className="flex items-center gap-3 md:hidden">
            <LangSelector />
            {loginHref && (
              <a
                href={loginHref}
                className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                {loginLabel}
              </a>
            )}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              className="flex size-8 items-center justify-center rounded text-[var(--text-secondary)]"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </header>

        {/* ── HERO CONTENT ───────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mx-auto flex max-w-3xl flex-col items-center pt-10 text-center md:pt-16"
        >
          <h1 className="text-balance text-4xl font-bold leading-[1.08] tracking-[-0.01em] text-[var(--text-primary)] [font-family:var(--font-display)] md:text-6xl">
            <MarkedCopy text={h1Marked} />
          </h1>

          <p className="mt-4 max-w-xl text-lg leading-relaxed text-[var(--text-secondary)]">
            <MarkedCopy text={subtitulo} />
          </p>

          {/* CTA group: primario + secundario */}
          <div className="mt-8 flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <CtaButton href={ctaHref}>{ctaLabel}</CtaButton>
            {secondaryCtaLabel && (
              <a
                href={secondaryCtaHref}
                className="inline-flex h-14 items-center justify-center px-8 text-base font-semibold text-[var(--ink)] underline-offset-2 opacity-70 transition-opacity hover:opacity-100 sm:h-auto sm:px-4"
              >
                {secondaryCtaLabel} →
              </a>
            )}
          </div>

          {socialProof && (
            <div className="mt-4 text-sm text-[var(--ink)] opacity-55">
              {socialProof}
            </div>
          )}

          {/* Visual del producto */}
          {visual && (
            <div className="mt-12 w-full max-w-3xl">
              <div className="overflow-hidden rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--accent)_18%,transparent)] shadow-[var(--shadow-2)]">
                {visual}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Mobile menu — fuera del contenedor de tokens invertidos para que el texto sea visible */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-x-0 top-16 z-50 border-b border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--bg)] px-6 py-6 md:hidden"
          >
            <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-3 text-base font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface)]"
                >
                  {link.label}
                </a>
              ))}
              {loginHref && (
                <a
                  href={loginHref}
                  onClick={() => setMenuOpen(false)}
                  className="mt-2 rounded-lg px-3 py-3 text-base font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface)]"
                >
                  {loginLabel}
                </a>
              )}
              <div className="mt-3">
                <motion.a
                  whileTap={{ scale: 0.97 }}
                  href={ctaHref}
                  onClick={() => setMenuOpen(false)}
                  className="flex h-12 w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] text-base font-semibold text-[var(--bg)] shadow-[var(--shadow-cta)] [touch-action:manipulation]"
                >
                  {ctaLabel}
                </motion.a>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
