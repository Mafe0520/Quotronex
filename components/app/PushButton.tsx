'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, BellRing } from 'lucide-react'

function urlBase64ToUint8Array(b64: string) {
  const padding = '='.repeat((4 - (b64.length % 4)) % 4)
  const base64 = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  return new Uint8Array([...raw].map((c) => c.charCodeAt(0)))
}

export function PushButton({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [status, setStatus] = useState<'unknown' | 'granted' | 'denied' | 'loading'>('unknown')
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setSupported(true)
      if (Notification.permission === 'granted') setStatus('granted')
      else if (Notification.permission === 'denied') setStatus('denied')
    }
  }, [])

  async function enable() {
    setStatus('loading')
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
      const existing = await reg.pushManager.getSubscription()
      if (existing) { setStatus('granted'); return }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      })
      const json = sub.toJSON()
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      })
      setStatus('granted')
    } catch {
      setStatus(Notification.permission === 'denied' ? 'denied' : 'unknown')
    }
  }

  if (!supported || !isLoggedIn) return null

  if (status === 'granted') {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-[var(--surface)] p-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]">
          <BellRing size={16} color="var(--accent)" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--text-primary)]">Notificaciones activas</p>
          <p className="text-xs text-[var(--text-tertiary)]">Te avisamos cuando haya actividad</p>
        </div>
      </div>
    )
  }

  if (status === 'denied') {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-[var(--surface)] p-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
          <BellOff size={16} className="text-red-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--text-primary)]">Notificaciones bloqueadas</p>
          <p className="text-xs text-[var(--text-tertiary)]">Habilítalas en Ajustes del sitio</p>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={enable}
      disabled={status === 'loading'}
      className="flex items-center gap-3 rounded-2xl bg-[var(--surface)] p-4 text-left w-full disabled:opacity-60"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]">
        <Bell size={16} color="var(--accent)" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {status === 'loading' ? 'Activando…' : 'Activar notificaciones'}
        </p>
        <p className="text-xs text-[var(--text-tertiary)]">
          {status === 'loading' ? 'Acepta el permiso del navegador' : 'Te avisamos cuando haya actividad'}
        </p>
      </div>
    </button>
  )
}
