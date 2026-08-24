'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
}

function isInStandaloneMode() {
  return (window.navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches;
}

export function PWAInit() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    const dismissed = localStorage.getItem('pwa-dismissed');
    if (dismissed) return;

    if (isIOS() && !isInStandaloneMode()) {
      const onWin = () => setShowIOSGuide(true);
      window.addEventListener('quotronex:first-win', onWin, { once: true });
      return () => window.removeEventListener('quotronex:first-win', onWin);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      const onWin = () => setShowBanner(true);
      window.addEventListener('quotronex:first-win', onWin, { once: true });
      const t = setTimeout(() => setShowBanner(true), 30000);
      return () => { window.removeEventListener('quotronex:first-win', onWin); clearTimeout(t); };
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowBanner(false);
    }
  }

  function dismiss() {
    localStorage.setItem('pwa-dismissed', '1');
    setShowBanner(false);
    setShowIOSGuide(false);
  }

  return (
    <AnimatePresence>
      {showBanner && deferredPrompt && (
        <motion.div
          key="android-banner"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 40 }}
          className="fixed bottom-20 inset-x-4 z-50 flex items-center gap-3 rounded-2xl bg-[var(--surface)] border border-[color-mix(in_oklab,var(--text-tertiary)_15%,transparent)] px-4 py-3 shadow-xl"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-white font-black text-lg">Q</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[var(--text-primary)]">Instalar Quotronex</p>
            <p className="text-xs text-[var(--text-tertiary)]">Acceso rápido desde tu pantalla de inicio</p>
          </div>
          <button onClick={handleInstall}
            className="flex shrink-0 items-center gap-1 rounded-xl bg-[var(--accent)] px-3 py-2 text-xs font-bold text-white">
            <Download size={12} /> Instalar
          </button>
          <button onClick={dismiss} className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)]">
            <X size={14} color="var(--text-tertiary)" />
          </button>
        </motion.div>
      )}

      {showIOSGuide && (
        <motion.div
          key="ios-guide"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 40 }}
          className="fixed bottom-20 inset-x-4 z-50 rounded-2xl bg-[var(--surface)] border border-[color-mix(in_oklab,var(--text-tertiary)_15%,transparent)] p-4 shadow-xl"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-white font-black">Q</div>
              <p className="text-sm font-bold text-[var(--text-primary)]">Instalar en iPhone</p>
            </div>
            <button onClick={dismiss} className="flex size-7 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)]">
              <X size={13} color="var(--text-tertiary)" />
            </button>
          </div>
          <ol className="flex flex-col gap-2">
            <li className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--accent)_15%,transparent)] text-[10px] font-bold text-[var(--accent)]">1</span>
              Toca el botón <Share size={12} className="inline mx-1 text-[var(--accent)]" /> de compartir en Safari
            </li>
            <li className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--accent)_15%,transparent)] text-[10px] font-bold text-[var(--accent)]">2</span>
              Selecciona <strong className="text-[var(--text-primary)]">&ldquo;Agregar a pantalla de inicio&rdquo;</strong>
            </li>
            <li className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--accent)_15%,transparent)] text-[10px] font-bold text-[var(--accent)]">3</span>
              Toca <strong className="text-[var(--text-primary)]">Agregar</strong> — listo
            </li>
          </ol>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
