'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { motion } from 'motion/react'
import { ChevronLeft, Send, Copy, CheckCircle2, Eye, ExternalLink, Mail, FileCheck, Pencil, CopyPlus, Archive, Calendar, FileText, MoreHorizontal, Briefcase, AlertTriangle, Clock, BadgeDollarSign, MessageSquare, ClipboardList, Link2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/app/lang-context'
import { updateQuoteStatus, duplicateQuote, archiveQuote, unarchiveQuote, sendQuote, sendQuoteToSelf, logShareInitiated } from '@/app/actions/quotes'
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

export function QuoteDetail({ quote, items, autoSend, linkedInvoiceId, changeRequest, revisions = [] }: { quote: Quote; items: QuoteItem[]; autoSend?: boolean; linkedInvoiceId?: string | null; changeRequest?: { message: string; created_at: string } | null; revisions?: { id: string; version_number: number; created_at: string; snapshot: unknown }[] }) {
  const router = useRouter()
  const { lang } = useLang()
  const [updating, startUpdate] = useTransition()
  const [converting, startConvert] = useTransition()
  const [convertingJob, startConvertJob] = useTransition()
  const [duping, startDupe] = useTransition()
  const [archiving, startArchive] = useTransition()
  const [unarchiving, startUnarchive] = useTransition()
  const [sending, startSend] = useTransition()
  const [copied, setCopied] = useState(false)
  const [copiedMsg, setCopiedMsg] = useState(false)
  const [showSendSheet, setShowSendSheet] = useState(autoSend ?? false)
  const [showMore, setShowMore] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [sentToast, setSentToast] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [undoArchiveVisible, setUndoArchiveVisible] = useState(false)
  const [undoTimer, setUndoTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [shareMessage, setShareMessage] = useState('')
  const [sendingToSelf, startSendToSelf] = useTransition()
  const [selfSentToast, setSelfSentToast] = useState(false)

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
    logShareInitiated(quote.id, 'copy_link', quote.clients?.id ?? null)
  }

  function markSent() {
    startUpdate(async () => {
      await updateQuoteStatus(quote.id, 'sent')
      setShowSendSheet(false)
      setSentToast(true)
      setTimeout(() => setSentToast(false), 3000)
    })
  }

  const buildDefaultMessage = useCallback((url: string) => {
    const clientName = quote.clients?.name ?? 'there'
    const businessName = quote.businesses?.name ?? 'us'
    if (lang === 'es') {
      return `Hola ${clientName}, aquí está tu estimado de ${businessName}. Revísalo cuando puedas y déjame saber si tienes alguna pregunta:\n${url}`
    }
    return `Hi ${clientName}, here's your estimate from ${businessName}. Please review it when you have a chance and let me know if you have any questions:\n${url}`
  }, [quote.clients?.name, quote.businesses?.name, lang])

  useEffect(() => {
    if (showSendSheet && publicUrl) {
      setShareMessage(buildDefaultMessage(publicUrl))
    }
  }, [showSendSheet, publicUrl, buildDefaultMessage])

  function cleanPhoneForWA(phone: string) {
    const digits = phone.replace(/\D/g, '')
    return digits.length === 10 ? `1${digits}` : digits
  }

  function openSMS() {
    const phone = quote.clients?.phone ?? ''
    logShareInitiated(quote.id, 'sms', quote.clients?.id ?? null)
    window.location.href = `sms:${phone}?body=${encodeURIComponent(shareMessage)}`
  }

  function openWhatsApp() {
    const phone = cleanPhoneForWA(quote.clients?.phone ?? '')
    logShareInitiated(quote.id, 'whatsapp', quote.clients?.id ?? null)
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(shareMessage)}`, '_blank')
  }

  function copyMessage() {
    navigator.clipboard.writeText(shareMessage)
    setCopiedMsg(true)
    setTimeout(() => setCopiedMsg(false), 2000)
    logShareInitiated(quote.id, 'copy_message', quote.clients?.id ?? null)
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

        {/* Change request banner */}
        {changeRequest && (
          <div className="mt-4 rounded-2xl bg-blue-50 border border-blue-200 p-4">
            <div className="flex items-start gap-2">
              <MessageSquare size={16} className="text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-blue-700">El cliente solicitó cambios</p>
                <p className="mt-1 text-sm text-blue-800">"{changeRequest.message}"</p>
                <p className="mt-1 text-xs text-blue-500">{fmtDate(changeRequest.created_at)}</p>
              </div>
            </div>
          </div>
        )}

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
          <button
            onClick={() => linkedInvoiceId ? router.push(`/app/invoices/${linkedInvoiceId}`) : undefined}
            className={`mt-4 rounded-2xl bg-purple-50 p-4 flex items-center justify-between gap-2 w-full ${linkedInvoiceId ? 'hover:bg-purple-100' : ''}`}
          >
            <div className="flex items-center gap-2">
              <FileCheck size={16} className="text-purple-600" />
              <p className="text-sm font-bold text-purple-700">Factura creada</p>
            </div>
            {linkedInvoiceId && <span className="text-xs font-semibold text-purple-500">Ver →</span>}
          </button>
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
              {revisions.length > 0 && (
                <button onClick={() => { setShowMore(false); setShowHistory(true) }}
                  className="flex h-13 items-center gap-3 rounded-2xl bg-[var(--surface)] px-4 text-sm font-semibold text-[var(--text-primary)]">
                  <Clock size={16} color="var(--accent)" /> Historial de versiones ({revisions.length})
                </button>
              )}
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

      {/* Version history sheet */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={() => setShowHistory(false)}>
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-h-[70dvh] overflow-y-auto rounded-t-3xl bg-[var(--bg)] p-5 pb-8">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)]" />
            <h2 className="text-base font-black [font-family:var(--font-display)] text-[var(--text-primary)] mb-4">Historial de versiones</h2>
            <div className="flex flex-col gap-2">
              {revisions.map((rev) => {
                const snap = rev.snapshot as { total_cents?: number; items?: { name: string }[] } | null
                const total = snap?.total_cents ?? 0
                const firstItem = snap?.items?.[0]?.name
                return (
                  <div key={rev.id} className="rounded-2xl bg-[var(--surface)] p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--accent)]">v{rev.version_number}</span>
                      <span className="text-xs text-[var(--text-tertiary)]">{new Date(rev.created_at).toLocaleDateString('es-MX', { dateStyle: 'medium' })} {new Date(rev.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">${(total / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    {firstItem && <p className="text-xs text-[var(--text-tertiary)] truncate">{firstItem}{(snap?.items?.length ?? 0) > 1 ? ` +${(snap?.items?.length ?? 1) - 1} más` : ''}</p>}
                  </div>
                )
              })}
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
            className="w-full max-h-[92dvh] overflow-y-auto rounded-t-3xl bg-[var(--bg)] p-6 pb-10"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)]" />
            <p className="mb-1 text-lg font-black [font-family:var(--font-display)] text-[var(--text-primary)]">
              {lang === 'es' ? 'Compartir estimado' : 'Share estimate'}
            </p>
            <p className="mb-4 text-sm text-[var(--text-tertiary)]">
              {quote.clients
                ? (lang === 'es' ? `Para ${quote.clients.name}` : `For ${quote.clients.name}`)
                : (lang === 'es' ? 'Copia el link y compártelo con tu cliente' : 'Copy the link and share it with your client')}
            </p>

            {/* Sanity warnings */}
            {items.length === 0 && (
              <div className="mb-3 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-700">
                <AlertTriangle size={13} className="shrink-0" />
                {lang === 'es' ? 'Esta cotización no tiene ítems.' : 'This estimate has no items.'}
              </div>
            )}
            {quote.total_cents === 0 && items.length > 0 && (
              <div className="mb-3 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-700">
                <AlertTriangle size={13} className="shrink-0" />
                {lang === 'es' ? 'El total es $0.00 — ¿revisaste los precios?' : 'Total is $0.00 — did you check the prices?'}
              </div>
            )}
            {!quote.clients && (
              <div className="mb-3 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-700">
                <AlertTriangle size={13} className="shrink-0" />
                {lang === 'es' ? 'No hay cliente asignado.' : 'No client assigned.'}
              </div>
            )}

            {/* Editable message */}
            <div className="mb-4">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
                {lang === 'es' ? 'Mensaje' : 'Message'}
              </p>
              <textarea
                value={shareMessage}
                onChange={e => setShareMessage(e.target.value)}
                rows={5}
                className="w-full rounded-2xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[color-mix(in_oklab,var(--accent)_12%,transparent)] resize-none"
              />
            </div>

            {/* Share options */}
            {sendError && (
              <p className="mb-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{sendError}</p>
            )}

            <div className="mb-4 flex flex-col gap-2">
              {/* Email — server-side send */}
              {quote.clients?.email ? (
                <button
                  disabled={sending}
                  onClick={() => {
                    setSendError(null)
                    startSend(async () => {
                      logShareInitiated(quote.id, 'email', quote.clients?.id ?? null)
                      const res = await sendQuote(quote.id)
                      if (res.error) { setSendError(res.error); return }
                      setShowSendSheet(false)
                      setSentToast(true)
                      setTimeout(() => setSentToast(false), 3000)
                      window.dispatchEvent(new Event('quotronex:first-win'))
                    })
                  }}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] text-sm font-bold text-white disabled:opacity-60"
                >
                  <Mail size={16} />
                  {sending ? (lang === 'es' ? 'Enviando…' : 'Sending…') : `Email — ${quote.clients.email}`}
                </button>
              ) : (
                <div className="flex h-12 w-full items-center gap-2 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] px-4 text-sm text-[var(--text-tertiary)] opacity-50 cursor-not-allowed">
                  <Mail size={16} />
                  {lang === 'es' ? 'Email — sin correo guardado' : 'Email — no email on file'}
                </div>
              )}

              {/* SMS — sms: deep link */}
              {quote.clients?.phone ? (
                <button
                  onClick={openSMS}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[color-mix(in_oklab,var(--text-primary)_8%,transparent)] border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] text-sm font-semibold text-[var(--text-primary)]"
                >
                  <MessageSquare size={16} />
                  SMS — {quote.clients.phone}
                </button>
              ) : (
                <div className="flex h-12 w-full items-center gap-2 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] px-4 text-sm text-[var(--text-tertiary)] opacity-50 cursor-not-allowed">
                  <MessageSquare size={16} />
                  SMS
                </div>
              )}

              {/* WhatsApp — wa.me deep link */}
              {quote.clients?.phone ? (
                <button
                  onClick={openWhatsApp}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[#25D366] text-sm font-bold text-white"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </button>
              ) : (
                <div className="flex h-12 w-full items-center gap-2 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] px-4 text-sm text-[var(--text-tertiary)] opacity-50 cursor-not-allowed">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </div>
              )}

              {!quote.clients?.phone && (
                <p className="text-center text-xs text-[var(--text-tertiary)]">
                  {lang === 'es'
                    ? 'Agrega un teléfono al cliente para compartir por SMS o WhatsApp.'
                    : 'Add a customer phone number to share by SMS or WhatsApp.'}
                </p>
              )}

              {/* Copy message & Copy link */}
              <div className="flex gap-2 mt-1">
                <button
                  onClick={copyMessage}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] text-sm font-semibold text-[var(--text-primary)]"
                >
                  {copiedMsg
                    ? <><CheckCircle2 size={15} color="var(--accent)" /> {lang === 'es' ? 'Copiado' : 'Copied'}</>
                    : <><ClipboardList size={15} /> {lang === 'es' ? 'Copiar mensaje' : 'Copy message'}</>}
                </button>
                <button
                  onClick={copyLink}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] text-sm font-semibold text-[var(--text-primary)]"
                >
                  {copied
                    ? <><CheckCircle2 size={15} color="var(--accent)" /> {lang === 'es' ? 'Copiado' : 'Copied'}</>
                    : <><Link2 size={15} /> {lang === 'es' ? 'Copiar link' : 'Copy link'}</>}
                </button>
              </div>
            </div>

            {/* Preview as client */}
            <button
              onClick={() => window.open(`/q/${quote.id}`, '_blank')}
              className="mb-4 flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] text-sm font-semibold text-[var(--text-primary)]"
            >
              <Eye size={15} />
              {lang === 'es' ? 'Ver como cliente' : 'Preview as client'}
              <ExternalLink size={13} className="text-[var(--text-tertiary)]" />
            </button>

            <motion.button whileTap={{ scale: 0.97 }} onClick={markSent} disabled={updating}
              className="flex h-13 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[color-mix(in_oklab,var(--text-tertiary)_12%,transparent)] text-sm font-semibold text-[var(--text-secondary)] disabled:opacity-50">
              {updating
                ? (lang === 'es' ? 'Guardando…' : 'Saving…')
                : (lang === 'es' ? '✓ Marcar como enviado' : '✓ Mark as sent')}
            </motion.button>

            {/* Send to myself (test) */}
            {selfSentToast ? (
              <p className="mt-3 text-center text-xs font-semibold text-green-600">
                {lang === 'es' ? '✓ Enviado a tu correo' : '✓ Sent to your email'}
              </p>
            ) : (
              <button
                disabled={sendingToSelf}
                onClick={() => startSendToSelf(async () => {
                  await sendQuoteToSelf(quote.id)
                  setSelfSentToast(true)
                  setTimeout(() => setSelfSentToast(false), 4000)
                })}
                className="mt-2 w-full py-2 text-xs text-[var(--text-tertiary)] disabled:opacity-60"
              >
                {sendingToSelf
                  ? (lang === 'es' ? 'Enviando…' : 'Sending…')
                  : (lang === 'es' ? 'Enviarme una copia de prueba' : 'Send myself a test copy')}
              </button>
            )}

            <button onClick={() => setShowSendSheet(false)} className="mt-1 w-full py-2 text-sm text-[var(--text-tertiary)]">
              {lang === 'es' ? 'Cancelar' : 'Cancel'}
            </button>
          </motion.div>
        </div>
      )}
    </div>
  )
}
