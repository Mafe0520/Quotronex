'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Download } from 'lucide-react'

/* ─── Config ──────────────────────────────────────────────────────────────── */
const LS_DISMISSED = 'pwa-dismissed-at'
const LS_FIRST_SEEN = 'qx-first-seen'
const COOLDOWN_DAYS = 7      // days before showing again after dismiss
const SHOW_DELAY_MS = 20000  // 20 s after mount

/* ─── Types ───────────────────────────────────────────────────────────────── */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function isIOS() {
  if (typeof navigator === 'undefined') return false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream
}
function isAndroid() {
  if (typeof navigator === 'undefined') return false
  return /android/i.test(navigator.userAgent)
}
function isStandalone() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window.navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches
}
function isDismissedRecently() {
  try {
    const at = parseInt(localStorage.getItem(LS_DISMISSED) ?? '0', 10)
    return at > 0 && (Date.now() - at) / 86_400_000 < COOLDOWN_DAYS
  } catch { return false }
}
function getLang(): 'en' | 'es' {
  try { return (localStorage.getItem('quotly-lang') ?? 'es') === 'en' ? 'en' : 'es' } catch { return 'es' }
}

/* ─── Copy ────────────────────────────────────────────────────────────────── */
const COPY = {
  es: {
    title: 'Instala Quotronex',
    sub: 'Acceso rápido como una app real',
    install: 'Instalar',
    later: 'Ahora no',
    ios: {
      title: 'Agrega a tu pantalla de inicio',
      steps: [
        { label: 'Abre el menú compartir', hint: 'Toca el ícono de compartir en Safari' },
        { label: 'Toca "Agregar a pantalla de inicio"', hint: 'Desliza hacia abajo si no la ves de inmediato' },
        { label: 'Confirma tocando "Agregar"', hint: 'Puedes cambiar el nombre si quieres' },
      ],
    },
    android: {
      title: 'Instala Quotronex',
      steps: [
        { label: 'Abre el menú de Chrome', hint: 'Toca los tres puntos en la esquina superior derecha' },
        { label: 'Toca "Instalar aplicación"', hint: 'O "Agregar a pantalla de inicio"' },
        { label: 'Confirma la instalación', hint: 'Toca "Instalar" para continuar' },
      ],
    },
  },
  en: {
    title: 'Install Quotronex',
    sub: 'Quick access like a real app',
    install: 'Install',
    later: 'Not now',
    ios: {
      title: 'Add to your Home Screen',
      steps: [
        { label: 'Open the Share menu', hint: 'Tap the share icon in Safari' },
        { label: 'Tap "Add to Home Screen"', hint: 'Scroll down if you don\'t see it right away' },
        { label: 'Confirm by tapping "Add"', hint: 'You can rename it if you want' },
      ],
    },
    android: {
      title: 'Install Quotronex',
      steps: [
        { label: 'Open Chrome\'s menu', hint: 'Tap the three dots in the top-right corner' },
        { label: 'Tap "Install app"', hint: 'Or "Add to Home Screen"' },
        { label: 'Confirm the installation', hint: 'Tap "Install" to continue' },
      ],
    },
  },
}

/* ─── SVG Illustrations ───────────────────────────────────────────────────── */

// iOS Step 1: Safari bottom toolbar with share button highlighted
function IllustrationIOSStep1() {
  return (
    <svg viewBox="0 0 280 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
      {/* phone chrome bg */}
      <rect width="280" height="90" rx="12" fill="#1c1c1e" />
      {/* address bar */}
      <rect x="12" y="10" width="200" height="26" rx="8" fill="#2c2c2e" />
      <text x="112" y="27" textAnchor="middle" fill="#98989e" fontSize="10" fontFamily="system-ui">quotronex.app</text>
      {/* lock icon */}
      <rect x="22" y="19" width="6" height="5" rx="1" fill="none" stroke="#98989e" strokeWidth="1" />
      <path d="M25 19v-2a3 3 0 0 0-6 0" stroke="#98989e" strokeWidth="1" />
      {/* bottom toolbar */}
      <rect x="0" y="60" width="280" height="30" fill="#2c2c2e" />
      {/* back */}
      <path d="M22 76l-6-4 6-4" stroke="#98989e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* forward (dimmed) */}
      <path d="M42 76l6-4-6-4" stroke="#48484a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* SHARE BUTTON — highlighted */}
      <circle cx="140" cy="75" r="16" fill="#0a7aff" opacity="0.18" />
      <circle cx="140" cy="75" r="11" fill="#0a7aff" opacity="0.25" />
      {/* share icon */}
      <rect x="135" y="72" width="10" height="8" rx="1.5" fill="none" stroke="#0a7aff" strokeWidth="1.5" />
      <path d="M140 72v-6M137 69l3-3 3 3" stroke="#0a7aff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* tap arrow */}
      <path d="M158 85l6-6-6-2 2-6" stroke="#0a7aff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* bookmarks */}
      <rect x="168" y="69" width="8" height="10" rx="1" fill="none" stroke="#98989e" strokeWidth="1.2" />
      <path d="M170 69v-2h4v2" stroke="#98989e" strokeWidth="1" />
      {/* tabs */}
      <rect x="245" y="70" width="14" height="10" rx="2" fill="none" stroke="#98989e" strokeWidth="1.2" />
      <text x="252" y="78" textAnchor="middle" fill="#98989e" fontSize="7">1</text>
    </svg>
  )
}

// iOS Step 2: Share sheet with "Add to Home Screen" highlighted
function IllustrationIOSStep2() {
  return (
    <svg viewBox="0 0 280 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
      <rect width="280" height="120" rx="12" fill="#1c1c1e" />
      {/* blurred bg hint */}
      <rect x="0" y="0" width="280" height="50" rx="12" fill="#2c2c2e" opacity="0.6" />
      {/* sheet */}
      <rect x="0" y="40" width="280" height="80" rx="14" fill="#2c2c2e" />
      {/* drag handle */}
      <rect x="120" y="48" width="40" height="4" rx="2" fill="#48484a" />
      {/* app icon row */}
      <rect x="20" y="58" width="32" height="32" rx="8" fill="#3a3a3c" />
      <text x="36" y="79" textAnchor="middle" fill="#98989e" fontSize="8">Air</text>
      <rect x="62" y="58" width="32" height="32" rx="8" fill="#3a3a3c" />
      <text x="78" y="79" textAnchor="middle" fill="#98989e" fontSize="8">Msg</text>
      <rect x="104" y="58" width="32" height="32" rx="8" fill="#3a3a3c" />
      <text x="120" y="79" textAnchor="middle" fill="#98989e" fontSize="8">Mail</text>
      {/* HIGHLIGHTED row */}
      <rect x="8" y="97" width="264" height="20" rx="6" fill="#0a7aff" opacity="0.18" />
      <rect x="8" y="97" width="264" height="20" rx="6" fill="none" stroke="#0a7aff" strokeWidth="1.2" />
      {/* plus icon */}
      <rect x="16" y="101" width="12" height="12" rx="3" fill="#0a7aff" opacity="0.3" />
      <path d="M22 104v6M19 107h6" stroke="#0a7aff" strokeWidth="1.3" strokeLinecap="round" />
      {/* label */}
      <text x="36" y="110" fill="#0a7aff" fontSize="9" fontWeight="600" fontFamily="system-ui">Agregar a pantalla de inicio</text>
      {/* arrow */}
      <path d="M252 107l5 0" stroke="#0a7aff" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M255 104l3 3-3 3" stroke="#0a7aff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// iOS Step 3: Add confirmation dialog
function IllustrationIOSStep3() {
  return (
    <svg viewBox="0 0 280 110" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
      <rect width="280" height="110" rx="12" fill="#1c1c1e" />
      {/* modal card */}
      <rect x="20" y="12" width="240" height="86" rx="14" fill="#2c2c2e" />
      {/* header bar */}
      <text x="60" y="30" fill="#98989e" fontSize="9" fontFamily="system-ui">Cancelar</text>
      <text x="140" y="30" textAnchor="middle" fill="#ebebf5" fontSize="9" fontWeight="700" fontFamily="system-ui">Agregar a inicio</text>
      {/* app icon */}
      <rect x="116" y="40" width="48" height="48" rx="11" fill="#0a7aff" />
      <text x="140" y="69" textAnchor="middle" fill="white" fontSize="20" fontWeight="900" fontFamily="system-ui">Q</text>
      {/* name */}
      <text x="140" y="95" textAnchor="middle" fill="#ebebf5" fontSize="9" fontFamily="system-ui">Quotronex</text>
      {/* ADD button — highlighted */}
      <rect x="206" y="22" width="44" height="16" rx="8" fill="#0a7aff" />
      <text x="228" y="33" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="system-ui">Agregar</text>
    </svg>
  )
}

// Android Step 1: Chrome top bar with three-dot menu
function IllustrationAndroidStep1() {
  return (
    <svg viewBox="0 0 280 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
      <rect width="280" height="80" rx="12" fill="#202124" />
      {/* address bar */}
      <rect x="12" y="16" width="230" height="28" rx="6" fill="#303134" />
      <text x="80" y="34" fill="#bdc1c6" fontSize="10" fontFamily="system-ui">quotronex.app</text>
      {/* lock */}
      <rect x="20" y="25" width="6" height="5" rx="1" fill="none" stroke="#bdc1c6" strokeWidth="1" />
      <path d="M23 25v-2a3 3 0 0 0-6 0" stroke="#bdc1c6" strokeWidth="1" />
      {/* THREE DOTS — highlighted */}
      <circle cx="258" cy="30" r="16" fill="#4285f4" opacity="0.18" />
      <circle cx="258" cy="30" r="10" fill="#4285f4" opacity="0.2" />
      <circle cx="258" cy="24" r="1.8" fill="#4285f4" />
      <circle cx="258" cy="30" r="1.8" fill="#4285f4" />
      <circle cx="258" cy="36" r="1.8" fill="#4285f4" />
      {/* tap arrow */}
      <path d="M243 52l8-8" stroke="#4285f4" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M247 44l4 0 0 4" stroke="#4285f4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Android Step 2: Dropdown menu with "Install app" highlighted
function IllustrationAndroidStep2() {
  return (
    <svg viewBox="0 0 280 110" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
      <rect width="280" height="110" rx="12" fill="#202124" />
      {/* blurred bg */}
      <rect x="0" y="0" width="280" height="50" rx="12" fill="#303134" opacity="0.6" />
      {/* dropdown */}
      <rect x="130" y="8" width="142" height="95" rx="8" fill="#303134" />
      {/* menu items */}
      <text x="148" y="30" fill="#bdc1c6" fontSize="9" fontFamily="system-ui">Nueva pestaña</text>
      <line x1="138" y1="38" x2="264" y2="38" stroke="#3c3c3c" strokeWidth="1" />
      <text x="148" y="54" fill="#bdc1c6" fontSize="9" fontFamily="system-ui">Historial</text>
      <line x1="138" y1="62" x2="264" y2="62" stroke="#3c3c3c" strokeWidth="1" />
      {/* HIGHLIGHTED */}
      <rect x="130" y="65" width="142" height="22" rx="4" fill="#4285f4" opacity="0.18" />
      <rect x="130" y="65" width="142" height="22" rx="4" fill="none" stroke="#4285f4" strokeWidth="1.2" />
      <text x="148" y="80" fill="#4285f4" fontSize="9" fontWeight="700" fontFamily="system-ui">Instalar aplicación</text>
      <line x1="138" y1="90" x2="264" y2="90" stroke="#3c3c3c" strokeWidth="1" />
      <text x="148" y="102" fill="#bdc1c6" fontSize="9" fontFamily="system-ui">Configuración</text>
    </svg>
  )
}

// Android Step 3: Install confirmation dialog
function IllustrationAndroidStep3() {
  return (
    <svg viewBox="0 0 280 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
      <rect width="280" height="100" rx="12" fill="#202124" />
      {/* dialog */}
      <rect x="24" y="12" width="232" height="76" rx="10" fill="#303134" />
      {/* title */}
      <text x="38" y="32" fill="#e8eaed" fontSize="11" fontWeight="700" fontFamily="system-ui">¿Instalar Quotronex?</text>
      {/* app icon */}
      <rect x="38" y="42" width="28" height="28" rx="6" fill="#4285f4" />
      <text x="52" y="61" textAnchor="middle" fill="white" fontSize="14" fontWeight="900" fontFamily="system-ui">Q</text>
      {/* description */}
      <text x="74" y="54" fill="#9aa0a6" fontSize="8" fontFamily="system-ui">quotronex.app</text>
      <text x="74" y="65" fill="#9aa0a6" fontSize="8" fontFamily="system-ui">Quotronex</text>
      {/* buttons */}
      <text x="166" y="78" fill="#9aa0a6" fontSize="9" fontFamily="system-ui">Cancelar</text>
      {/* INSTALL button highlighted */}
      <rect x="200" y="67" width="50" height="18" rx="4" fill="#4285f4" />
      <text x="225" y="79" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="system-ui">Instalar</text>
    </svg>
  )
}

/* ─── Step card ───────────────────────────────────────────────────────────── */
function StepCard({
  number,
  label,
  hint,
  illustration: Illustration,
}: {
  number: number
  label: string
  hint: string
  illustration: React.FC
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-hidden rounded-xl border border-white/8">
        <Illustration />
      </div>
      <div className="flex items-start gap-2.5 px-1">
        <span
          className="flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white mt-0.5"
          style={{ background: 'var(--accent)' }}
        >
          {number}
        </span>
        <div>
          <p className="text-xs font-bold text-[var(--text-primary)] leading-snug">{label}</p>
          <p className="text-[11px] text-[var(--text-tertiary)] leading-snug">{hint}</p>
        </div>
      </div>
    </div>
  )
}

/* ─── Guide sheet ─────────────────────────────────────────────────────────── */
function GuideSheet({
  platform,
  lang,
  onClose,
}: {
  platform: 'ios' | 'android'
  lang: 'en' | 'es'
  onClose: () => void
}) {
  const c = COPY[lang]
  const guide = platform === 'ios' ? c.ios : c.android

  const iosIllustrations = [IllustrationIOSStep1, IllustrationIOSStep2, IllustrationIOSStep3]
  const androidIllustrations = [IllustrationAndroidStep1, IllustrationAndroidStep2, IllustrationAndroidStep3]
  const illustrations = platform === 'ios' ? iosIllustrations : androidIllustrations

  return (
    <motion.div
      key="guide-sheet"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 340, damping: 36 }}
      className="fixed inset-x-0 bottom-0 z-[9990] max-h-[90dvh] overflow-y-auto rounded-t-3xl shadow-2xl"
      style={{ background: 'var(--surface)', borderTop: '1px solid color-mix(in oklab, var(--text-tertiary) 14%, transparent)' }}
    >
      {/* handle */}
      <div className="sticky top-0 flex justify-center pt-3 pb-1" style={{ background: 'var(--surface)' }}>
        <div className="h-1 w-10 rounded-full" style={{ background: 'color-mix(in oklab, var(--text-tertiary) 30%, transparent)' }} />
      </div>

      <div className="px-5 pb-10">
        {/* header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl font-black text-white text-lg" style={{ background: 'var(--accent)' }}>Q</div>
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">{guide.title}</p>
              <p className="text-xs text-[var(--text-tertiary)]">
                {platform === 'ios' ? 'Safari · iPhone / iPad' : 'Chrome · Android'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full"
            style={{ background: 'color-mix(in oklab, var(--text-tertiary) 12%, transparent)' }}
          >
            <X size={15} color="var(--text-tertiary)" />
          </button>
        </div>

        {/* steps */}
        <div className="grid grid-cols-3 gap-3">
          {guide.steps.map((step, i) => (
            <StepCard
              key={i}
              number={i + 1}
              label={step.label}
              hint={step.hint}
              illustration={illustrations[i]}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Android install banner ──────────────────────────────────────────────── */
function AndroidBanner({
  lang,
  onInstall,
  onDismiss,
  onShowGuide,
}: {
  lang: 'en' | 'es'
  onInstall: () => void
  onDismiss: () => void
  onShowGuide: () => void
}) {
  const c = COPY[lang]
  return (
    <motion.div
      key="android-banner"
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 36 }}
      className="fixed bottom-20 inset-x-4 z-[9990] flex items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl md:bottom-8 md:left-auto md:right-6 md:max-w-sm"
      style={{
        background: 'var(--surface)',
        border: '1px solid color-mix(in oklab, var(--text-tertiary) 14%, transparent)',
      }}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl font-black text-white text-lg" style={{ background: 'var(--accent)' }}>Q</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[var(--text-primary)]">{c.title}</p>
        <p className="text-xs text-[var(--text-tertiary)]">{c.sub}</p>
      </div>
      <button
        onClick={onInstall}
        className="flex shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold text-white"
        style={{ background: 'var(--accent)' }}
      >
        <Download size={12} />
        {c.install}
      </button>
      <button
        onClick={onDismiss}
        className="flex size-8 shrink-0 items-center justify-center rounded-xl"
        style={{ background: 'color-mix(in oklab, var(--text-tertiary) 10%, transparent)' }}
      >
        <X size={14} color="var(--text-tertiary)" />
      </button>
    </motion.div>
  )
}

/* ─── iOS mini banner (to open guide) ────────────────────────────────────── */
function IOSBanner({ lang, onOpen, onDismiss }: { lang: 'en' | 'es'; onOpen: () => void; onDismiss: () => void }) {
  const c = COPY[lang]
  return (
    <motion.div
      key="ios-banner"
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 36 }}
      className="fixed bottom-20 inset-x-4 z-[9990] flex items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl md:bottom-8 md:left-auto md:right-6 md:max-w-sm"
      style={{
        background: 'var(--surface)',
        border: '1px solid color-mix(in oklab, var(--text-tertiary) 14%, transparent)',
      }}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl font-black text-white text-lg" style={{ background: 'var(--accent)' }}>Q</div>
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onOpen}>
        <p className="text-sm font-bold text-[var(--text-primary)]">{c.title}</p>
        <p className="text-xs text-[var(--text-tertiary)]">{c.sub}</p>
      </div>
      <button
        onClick={onOpen}
        className="flex shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold text-white"
        style={{ background: 'var(--accent)' }}
      >
        {lang === 'es' ? 'Cómo' : 'How'}
      </button>
      <button
        onClick={onDismiss}
        className="flex size-8 shrink-0 items-center justify-center rounded-xl"
        style={{ background: 'color-mix(in oklab, var(--text-tertiary) 10%, transparent)' }}
      >
        <X size={14} color="var(--text-tertiary)" />
      </button>
    </motion.div>
  )
}

/* ─── Main component ──────────────────────────────────────────────────────── */
export function PWAInit() {
  const [platform, setPlatform] = useState<'ios' | 'android' | null>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [lang, setLang] = useState<'en' | 'es'>('es')

  const dismiss = useCallback(() => {
    try { localStorage.setItem(LS_DISMISSED, String(Date.now())) } catch { /* */ }
    setShowBanner(false)
    setShowGuide(false)
  }, [])

  const openGuide = useCallback(() => {
    setShowBanner(false)
    setShowGuide(true)
  }, [])

  useEffect(() => {
    // Register SW
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }

    // Track first-seen for other features
    try {
      if (!localStorage.getItem(LS_FIRST_SEEN)) {
        localStorage.setItem(LS_FIRST_SEEN, String(Date.now()))
      }
    } catch { /* */ }

    setLang(getLang())

    if (isStandalone()) return // Already installed — nothing to do

    // Listen for Settings-triggered open
    const onOpen = () => { setShowGuide(true) }
    window.addEventListener('pwa:open-guide', onOpen)

    if (isDismissedRecently()) return () => window.removeEventListener('pwa:open-guide', onOpen)

    if (isIOS()) {
      setPlatform('ios')
      const t = setTimeout(() => setShowBanner(true), SHOW_DELAY_MS)
      return () => {
        clearTimeout(t)
        window.removeEventListener('pwa:open-guide', onOpen)
      }
    }

    if (isAndroid()) {
      setPlatform('android')
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setPlatform('android')
      const t = setTimeout(() => setShowBanner(true), SHOW_DELAY_MS)
      // store ref to clean up
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(handler as any)._timer = t
    }
    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('pwa:open-guide', onOpen)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const t = (handler as any)._timer
      if (t) clearTimeout(t as number)
    }
  }, [])

  async function handleAndroidInstall() {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
        setShowBanner(false)
        return
      }
    }
    // Fallback: show guide
    openGuide()
  }

  return (
    <AnimatePresence>
      {showBanner && platform === 'android' && (
        <AndroidBanner
          lang={lang}
          onInstall={handleAndroidInstall}
          onDismiss={dismiss}
          onShowGuide={openGuide}
        />
      )}
      {showBanner && platform === 'ios' && (
        <IOSBanner lang={lang} onOpen={openGuide} onDismiss={dismiss} />
      )}
      {showGuide && platform && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9989] bg-black/50"
            onClick={dismiss}
          />
          <GuideSheet platform={platform} lang={lang} onClose={dismiss} />
        </>
      )}
    </AnimatePresence>
  )
}

/* ─── Hook to open guide from anywhere (e.g. Settings) ───────────────────── */
export function openInstallGuide() {
  window.dispatchEvent(new CustomEvent('pwa:open-guide'))
}
