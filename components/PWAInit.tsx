'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInit() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // Capture install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show banner after 10s on first visit
      const dismissed = sessionStorage.getItem('pwa-dismissed');
      if (!dismissed) setTimeout(() => setShowBanner(true), 10000);
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
    sessionStorage.setItem('pwa-dismissed', '1');
    setShowBanner(false);
  }

  return (
    <AnimatePresence>
      {showBanner && deferredPrompt && (
        <motion.div
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
    </AnimatePresence>
  );
}
