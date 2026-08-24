'use client'

import { useState, useTransition, useEffect } from 'react'
import { motion } from 'motion/react'
import { ChevronLeft, Send, Copy, CheckCircle2, Eye, ExternalLink, Mail, MessageSquare, FileCheck, Pencil, CopyPlus, Archive, Calendar, FileText, MoreHorizontal, Briefcase, AlertTriangle, Clock, BadgeDollarSign } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { updateQuoteStatus, duplicateQuote, archiveQuote, unarchiveQuote, sendQuote } from '@/app/actions/quotes'
import { convertQuoteToInvoice } from '@/app/actions/invoices'
import { convertQuoteToJob } from '@/app/actions/jobs'

const STATUS_META: Record<string, { label: string; color: string }> = {
  draft:     { label: 'Borrador',  color: 'bg-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)] text-[var(--text-tertiary)]' },
  sent:      { label: 'Enviado',   color: 'bg-blue-50 text-blue-600' },
  viewed:    { label: 'Visto',     color: 'bg-amber-50 text-amber-600' },
  accepted:  { label: 'Aceptado',  color: 'bg-green-50 text-green-700' },
  declined:  { label: 'Declinado', color: 'bg-red-50 text-red-600' },
  expired:   { label: 'Expirado',  color: 'bg-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)] text-[var(--text-tertiary)]' },
  converted: { label: 'Convertido',color: 'bg-purple-50 text-purple-700' },
}

function fmt(cents: number) {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

type QuoteItem = {
  id: string; name: string; description: string | null
  qty: number; unit_price_cents: number; total_cents: number; unit: string | null
  optional: boolean
}

type Quote = {
  id: string; status: string; total_cents: number; created_at: string
  voice_transcript: string | null; notes: string | null; expires_at: string | null
  deposit_cents: number | null; deposit_pct: number | null
  accepted_at: string | null; accepted_name: string | null
  clients: { id: string; name: string; email: string | null; phone: string | null } | null
  businesses: { name: string } | null
}

export function QuoteDetail({ quote, items, autoSend }: { quote: Quote; items: QuoteItem[]; autoSend?: boolean }) {
  const router = useRouter()
  const [updating, startUpdate] = useTransition()
  const [converting, startConvert] = useTransition()
  const [convertingJob, startConvertJob] = useTransition()
  const [duping, startDupe] = useTransition()
  const [archiving, startArchive] = useTransition()
  const [unarchiving, startUnarchive] = useTransition()
  const [sending, startSend] = useTransition()
  const [copied, setCopied] = useState(false)
  const [showSendSheet, setShowSendSheet] = useState(autoSend ?? false)
  const [showMore, setShowMore] = useState(false)
  const [sentToast, setSentToast] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [undoArchiveVisible, setUndoArchiveVisible] = useState(false)
  const [undoTimer, setUndoTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { if (autoSend) setShowSendSheet(true) }, [autoSend])

  const st = STATUS_META[quote.status] ?? STATUS_META.draft
  const [origin, setOrigin] = useState('')

  const expiryWarning = (() => {
    if (!quote.expires_at) return null
    const exp = new Date(quote.expires_at)
    const now = new Date()
    const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (daysLeft < 0) return { type: 'expired', label: `Expiró el ${fmtDate(quote.expires_at)}` }
    if (daysLeft <= 3) return { type: 'soon', label: `Expira en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}` }
    return null
  })()
  useEffect(() => { setOrigin(window.location.origin) }, [])
  const publicUrl = `${origin}/q/${quote.id}`

  function copyLink() {
    navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function markSent() {
    startUpdate(async () => {
      await updateQuoteStatus(quote.id, 'sent')
      setShowSendSheet(false)
      setSentToast(true)
      setTimeout(() => setSentToast(false), 3000)
    })
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg)]">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)] px-5">
        <button onClick={() => router.back()}
          className="flex size-9 items-center justify-center rounded-full hover:bg-[var(--surface)]">
          <ChevronLeft size={20} color="var(--text-secondary)" />
        </button>
        {quote.status !== 'sent' && (
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${st.color}`}>{st.label}</span>
        )}
        <button onClick={() => setShowMore(v => !v)}
          className="flex size-9 items-center justify-center rounded-full hover:bg-[var(--surface)]">
          <MoreHorizontal size={18} color="var(--text-secondary)" />
        </button>
      </header>

      {/* Sent toast */}
      {sentToast && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          className="mx-5 mt-3 flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-600"
        >
          <CheckCircle2 size={15} /> Cotización enviada
        </motion.div>
      )}

      {/* Undo archive toast */}
      {undoArchiveVisible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mx-5 mt-3 flex items-center justify-between gap-3 rounded-xl bg-[var(--surface)] border border-[color-mix(in_oklab,var(--text-tertiary)_15%,transparent)] px-4 py-2.5"
        >
          <span className="text-sm text-[var(--text-secondary)]">Cotización archivada</span>
          <button
            disabled={unarchiving}
            onClick={() => {
              if (undoTimer) clearTimeout(undoTimer)
              setUndoArchiveVisible(false)
              startUnarchive(async () => {
                await unarchiveQuote(quote.id)
              })
            }}
            className="text-sm font-bold text-[var(--accent)] disabled:opacity-60"
          >
            {unarchiving ? 'Restaurando…' : 'Deshacer'}
          </button>
        </motion.div>
      )}

      <div className="flex-1 overflow-y-auto px-5 pb-40">
        {/* Client & date */}
        <div className="mt-5 flex items-center justify-between">
          <div>
            <p className="text-xl font-black [font-family:var(--font-display)] text-[var(--text-primary)]">
              {quote.clients?.name ?? 'Sin cliente'}
            </p>
            <p className="text-xs text-[var(--text-tertiary)]">{fmtDate(quote.created_at)}</p>
          </div>
          <p className="text-2xl font-black tabular-nums [font-family:var(--font-display)] text-[var(--accent)]">
            {fmt(quote.total_cents)}
          </p>
        </div>

        {/* Expiry warning banner */}
        {expiryWarning && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            className={`mt-4 flex items-center gap-2 rounded-2xl px-4 py-3 ${expiryWarning.type === 'expired' ? 'bg-red-50' : 'bg-amber-50'}`}
          >
            <AlertTriangle size={14} className={expiryWarning.type === 'expired' ? 'text-red-500 shrink-0' : 'text-amber-500 shrink-0'} />
            <p className={`text-xs font-semibold ${expiryWarning.type === 'expired' ? 'text-red-600' : 'text-amber-700'}`}>{expiryWarning.label}</p>
          </motion.div>
        )}

        {/* Items */}
        <div className="mt-5 rounded-2xl bg-[var(--surface)] overflow-hidden">
          <p className="px-4 pt-4 pb-2 text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">Ítems</p>
          {items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-3 border-t border-[color-mix(in_oklab,var(--text-tertiary)_8%,transparent)] px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{item.name}</p>
                  {item.optional && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600 uppercase tracking-wide">Opcional</span>
                  )}
                </div>
                {item.description && <p className="text-xs text-[var(--text-tertiary)]">{item.description}</p>}
                <p className="text-xs text-[var(--text-tertiary)]">{item.qty} × {fmt(item.unit_price_cents)}{item.unit ? ` / ${item.unit}` : ''}</p>
              </div>
              <span className="text-sm font-bold tabular-nums text-[var(--text-primary)]">{fmt(item.total_cents)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-[color-mix(in_oklab,var(--text-tertiary)_8%,transparent)] px-4 py-4 bg-[color-mix(in_oklab,var(--accent)_6%,transparent)]">
            <span className="text-base font-bold text-[var(--text-primary)]">Total</span>
            <span className="text-xl font-black tabular-nums [font-family:var(--font-display)] text-[var(--accent)]">{fmt(quote.total_cents)}</span>
          </div>
        </div>

        {/* Deposit */}
        {(quote.deposit_cents || quote.deposit_pct) && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[var(--surface)] px-4 py-3">
            <BadgeDollarSign size={16} color="var(--accent)" className="shrink-0" />
            <div>
              <p className="text-xs font-semibold text-[var(--text-primary)]">Depósito requerido</p>
              <p className="text-xs text-[var(--text-secondary)]">
                {quote.deposit_cents ? fmt(quote.deposit_cents) : ''}
                {quote.deposit_pct ? `${quote.deposit_cents ? ' · ' : ''}${quote.deposit_pct}% del total` : ''}
              </p>
            </div>
          </div>
        )}

        {/* Expiration (no warning) */}
        {quote.expires_at && !expiryWarning && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-[var(--surface)] px-4 py-3">
            <Calendar size={14} color="var(--text-tertiary)" className="shrink-0" />
            <p className="text-xs text-[var(--text-secondary)]">
              Válida hasta <span className="font-semibold text-[var(--text-primary)]">{fmtDate(quote.expires_at)}</span>
            </p>
          </div>
        )}

        {/* Notes */}
        {quote.notes && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl bg-[var(--surface)] px-4 py-3">
            <FileText size={14} color="var(--text-tertiary)" className="mt-0.5 shrink-0" />
            <p className="text-xs text-[var(--text-secondary)]">{quote.notes}</p>
          </div>
        )}

        {/* Link */}
        <div className="mt-4 rounded-2xl bg-[var(--surface)] p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">Link del cliente</p>
          <div className="flex items-center gap-2">
            <p className="flex-1 truncate rounded-lg bg-[var(--bg)] px-3 py-2 font-mono text-xs text-[var(--text-tertiary)]">{publicUrl}</p>
            <button onClick={copyLink} className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]">
              {copied ? <CheckCircle2 size={16} color="var(--accent)" /> : <Copy size={16} color="var(--accent)" />}
            </button>
          </div>
        </div>

        {/* Accepted info + convert actions */}
        {quote.status === 'accepted' && (
          <div className="mt-4 rounded-2xl bg-green-50 p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-600" />
              <div>
                <p className="text-sm font-bold text-green-700">Cotización aceptada</p>
                {(quote.accepted_name || quote.accepted_at) && (
                  <p className="text-xs text-green-600">
                    {quote.accepted_name && `Por ${quote.accepted_name}`}{quote.accepted_name && quote.accepted_at ? ' · ' : ''}{quote.accepted_at && fmtDate(quote.accepted_at)}
                  </p>
                )}
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={convertingJob}
              onClick={() => startConvertJob(async () => { await convertQuoteToJob(quote.id) })}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-amber-500 text-sm font-bold text-white disabled:opacity-60"
            >
              <Briefcase size={16} />
              {convertingJob ? 'Creando trabajo…' : 'Crear trabajo'}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={converting}
              onClick={() => startConvert(async () => {
                const { id, error } = await convertQuoteToInvoice(quote.id)
                if (id) router.push(`/app/invoices/${id}`)
                else alert(error ?? 'Error al convertir')
              })}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-green-600 text-sm font-bold text-white disabled:opacity-60"
            >
              <FileCheck size={16} />
              {converting ? 'Creando factura…' : 'Convertir a factura'}
            </motion.button>
          </div>
        )}
        {quote.status === 'converted' && (
          <div className="mt-4 rounded-2xl bg-purple-50 p-4 flex items-center gap-2">
            <FileCheck size={16} className="text-purple-600" />
            <p className="text-sm font-bold text-purple-700">Factura creada</p>
          </div>
        )}
      </div>

      {/* Bottom actions — sits above AppNav (fixed bottom-16) */}
      <div className="fixed bottom-16 inset-x-0 border-t border-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)] bg-[var(--bg)] p-4 flex gap-2">
        <button onClick={() => window.open(`/q/${quote.id}`, '_blank')}
          className="flex h-13 flex-1 items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] text-sm font-semibold text-[var(--text-primary)]">
          <Eye size={16} /> Preview
        </button>
        <button onClick={copyLink}
          className="flex h-13 flex-1 items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] text-sm font-semibold text-[var(--text-primary)]">
          {copied ? <><CheckCircle2 size={16} /> Copiado</> : <><Copy size={16} /> Link</>}
        </button>
        {(quote.status === 'draft' || quote.status === 'sent') && (
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowSendSheet(true)}
            className="flex h-13 flex-1 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] text-sm font-bold text-white [box-shadow:var(--shadow-cta)]">
            <Send size={16} /> Enviar
          </motion.button>
        )}
      </div>

      {/* More menu */}
      {showMore && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={() => setShowMore(false)}>
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            onClick={e => e.stopPropagation()}
            className="w-full rounded-t-3xl bg-[var(--bg)] p-5 pb-8">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)]" />
            <div className="flex flex-col gap-2">
              {quote.status === 'draft' && (
                <button onClick={() => { setShowMore(false); router.push(`/app/quotes/${quote.id}/edit`) }}
                  className="flex h-13 items-center gap-3 rounded-2xl bg-[var(--surface)] px-4 text-sm font-semibold text-[var(--text-primary)]">
                  <Pencil size={16} color="var(--accent)" /> Editar cotización
                </button>
              )}
              <button disabled={duping} onClick={() => {
                setShowMore(false)
                startDupe(async () => {
                  const { newId, error } = await duplicateQuote(quote.id)
                  if (newId) router.push(`/app/quotes/${newId}/edit`)
                  else alert(error ?? 'Error al duplicar')
                })
              }} className="flex h-13 items-center gap-3 rounded-2xl bg-[var(--surface)] px-4 text-sm font-semibold text-[var(--text-primary)] disabled:opacity-60">
                <CopyPlus size={16} color="var(--accent)" /> {duping ? 'Duplicando...' : 'Duplicar cotización'}
              </button>
              {['sent', 'viewed'].includes(quote.status) && (
                <button disabled={sending} onClick={() => {
                  setShowMore(false)
                  setShowSendSheet(true)
                }} className="flex h-13 items-center gap-3 rounded-2xl bg-[var(--surface)] px-4 text-sm font-semibold text-[var(--text-primary)] disabled:opacity-60">
                  <Mail size={16} color="var(--accent)" /> Reenviar cotización
                </button>
              )}
              <button disabled={archiving} onClick={() => {
                setShowMore(false)
                startArchive(async () => {
                  await archiveQuote(quote.id)
                  setUndoArchiveVisible(true)
                  const t = setTimeout(() => {
                    setUndoArchiveVisible(false)
                    router.push('/app')
                  }, 5000)
                  setUndoTimer(t)
                })
              }} className="flex h-13 items-center gap-3 rounded-2xl bg-[var(--surface)] px-4 text-sm font-semibold text-red-500 disabled:opacity-60">
                <Archive size={16} /> {archiving ? 'Archivando...' : 'Archivar cotización'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Send sheet */}
      {showSendSheet && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={() => setShowSendSheet(false)}>
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            onClick={e => e.stopPropagation()}
            className="w-full rounded-t-3xl bg-[var(--bg)] p-6"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)]" />
            <p className="mb-1 text-lg font-black [font-family:var(--font-display)] text-[var(--text-primary)]">Enviar cotización</p>
            <p className="mb-5 text-sm text-[var(--text-tertiary)]">
              {quote.clients ? `Comparte el link con ${quote.clients.name}` : 'Copia el link y compártelo con tu cliente'}
            </p>

            {/* Link */}
            <div className="mb-4 flex items-center gap-2 rounded-2xl bg-[var(--surface)] p-3">
              <p className="flex-1 truncate font-mono text-xs text-[var(--text-tertiary)]">{publicUrl}</p>
              <button onClick={copyLink} className="flex size-8 items-center justify-center rounded-lg bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]">
                {copied ? <CheckCircle2 size={14} color="var(--accent)" /> : <Copy size={14} color="var(--accent)" />}
              </button>
            </div>

            {/* Send via email / SMS */}
            <div className="mb-4 flex flex-col gap-2">
              {sendError && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{sendError}</p>
              )}
              {quote.clients?.email && (
                <button
                  disabled={sending}
                  onClick={() => {
                    setSendError(null)
                    startSend(async () => {
                      const res = await sendQuote(quote.id)
                      if (res.error) { setSendError(res.error); return }
                      setShowSendSheet(false)
                      setSentToast(true)
                      setTimeout(() => setSentToast(false), 3000)
                      window.dispatchEvent(new Event('quotronex:first-win'))
                    })
                  }}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-blue-600 text-sm font-bold text-white disabled:opacity-60"
                >
                  <Mail size={16} /> {sending ? 'Enviando…' : `Enviar a ${quote.clients.email}`}
                </button>
              )}
              {quote.clients?.phone && (
                <button
                  onClick={() => {
                    markSent()
                    window.open(`sms:${quote.clients!.phone}?body=${encodeURIComponent(`Hola ${quote.clients!.name}, aquí está tu cotización: ${publicUrl}`)}`)
                  }}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-green-600 text-sm font-bold text-white"
                >
                  <MessageSquare size={16} /> Enviar por SMS
                </button>
              )}
              {!quote.clients?.email && !quote.clients?.phone && (
                <p className="text-center text-xs text-[var(--text-tertiary)]">El cliente no tiene correo ni teléfono guardado.</p>
              )}
            </div>

            {/* Preview PDF */}
            <button
              onClick={() => window.open(`/q/${quote.id}`, '_blank')}
              className="mb-4 flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] text-sm font-semibold text-[var(--text-primary)]"
            >
              <Eye size={15} /> Ver como cliente <ExternalLink size={13} className="text-[var(--text-tertiary)]" />
            </button>

            <motion.button whileTap={{ scale: 0.97 }} onClick={markSent} disabled={updating}
              className="flex h-13 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] text-base font-bold text-white [box-shadow:var(--shadow-cta)] disabled:opacity-50">
              {updating ? 'Guardando…' : '✓ Marcar como enviado'}
            </motion.button>
            <button onClick={() => setShowSendSheet(false)} className="mt-3 w-full py-2 text-sm text-[var(--text-tertiary)]">Cancelar</button>
          </motion.div>
        </div>
      )}
    </div>
  )
}
