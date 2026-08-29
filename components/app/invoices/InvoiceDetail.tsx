'use client'

import { useState, useTransition, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  ChevronLeft, CheckCircle2, DollarSign, Send, Copy,
  MoreHorizontal, Phone, Mail, FileText, Calendar, Banknote, AlertTriangle,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCelebration } from '@/components/app/CelebrationToast'
import { recordPayment, updateInvoiceStatus, sendInvoice } from '@/app/actions/invoices'

const STATUS_META: Record<string, { label: string; color: string }> = {
  draft:   { label: 'Borrador',     color: 'bg-gray-100 text-gray-600' },
  sent:    { label: 'Enviada',      color: 'bg-blue-50 text-blue-600' },
  partial: { label: 'Pago parcial', color: 'bg-amber-50 text-amber-600' },
  paid:    { label: 'Pagada',       color: 'bg-green-50 text-green-700' },
  overdue: { label: 'Vencida',      color: 'bg-red-50 text-red-600' },
}

const METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo', check: 'Cheque', card: 'Tarjeta', transfer: 'Transferencia', other: 'Otro',
}

const METHOD_ICONS: Record<string, string> = {
  cash: '💵', check: '🏦', card: '💳', transfer: '⚡', other: '💰',
}

function fmt(cents: number) {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
}

type Payment = { id: string; amount_cents: number; method: string; paid_at: string; notes: string | null }
type QuoteItem = { id: string; name: string; description: string | null; qty: number; unit_price_cents: number; total_cents: number; unit: string | null }
type Invoice = {
  id: string
  status: string
  total_cents: number
  amount_paid_cents: number
  subtotal_cents: number
  tax_cents: number
  issued_at: string | null
  due_at: string | null
  notes: string | null
  payments: Payment[]
  clients: { id: string; name: string; email: string | null; phone: string | null } | null
  quotes: { id: string; quote_items: QuoteItem[] } | { id: string; quote_items: QuoteItem[] }[] | null
}

const spring = { type: 'spring' as const, stiffness: 400, damping: 40 }

export function InvoiceDetail({ invoice }: { invoice: Invoice }) {
  const router = useRouter()
  const celebrate = useCelebration()
  const [showPaySheet, setShowPaySheet] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const [method, setMethod] = useState<'cash' | 'check' | 'card' | 'transfer' | 'other'>('cash')
  const [amountInput, setAmountInput] = useState('')
  const [payNotes, setPayNotes] = useState('')
  const [paying, startPay] = useTransition()
  const [marking, startMark] = useTransition()
  const [sending, startSend] = useTransition()
  const [paidToast, setPaidToast] = useState(false)
  const [sentToast, setSentToast] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [origin, setOrigin] = useState('')

  useEffect(() => { setOrigin(window.location.origin) }, [])

  const st = STATUS_META[invoice.status] ?? STATUS_META.draft
  const remaining = invoice.total_cents - invoice.amount_paid_cents
  const pct = invoice.total_cents > 0 ? Math.min(100, Math.round(invoice.amount_paid_cents / invoice.total_cents * 100)) : 0
  const quotesData = Array.isArray(invoice.quotes) ? invoice.quotes[0] : invoice.quotes
  const items = quotesData?.quote_items ?? []
  const isPaid = invoice.status === 'paid'
  const publicUrl = `${origin}/invoice/${invoice.id}`

  function copyLink() {
    navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handlePay() {
    const cents = Math.round(parseFloat(amountInput) * 100)
    if (!cents || cents <= 0) return
    startPay(async () => {
      const { error } = await recordPayment(invoice.id, cents, method, payNotes || undefined)
      if (error) { alert(error); return }
      setPaidToast(true)
      celebrate('¡Pago registrado! 💰', '¡Excelente trabajo!')
      setShowPaySheet(false)
      setAmountInput('')
      setPayNotes('')
      setTimeout(() => { router.refresh(); setPaidToast(false) }, 2000)
    })
  }

  function markSent() {
    startMark(async () => {
      await updateInvoiceStatus(invoice.id, 'sent')
      setShowMore(false)
      router.refresh()
    })
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg)]">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)] px-4">
        <button onClick={() => router.back()}
          className="flex size-10 items-center justify-center rounded-full hover:bg-[var(--surface)]">
          <ChevronLeft size={20} color="var(--text-secondary)" />
        </button>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${st.color}`}>{st.label}</span>
        <button onClick={() => setShowMore(true)}
          className="flex size-10 items-center justify-center rounded-full hover:bg-[var(--surface)]">
          <MoreHorizontal size={20} color="var(--text-secondary)" />
        </button>
      </header>

      {/* Toast */}
      <AnimatePresence>
        {paidToast && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mx-5 mt-3 flex items-center gap-2 rounded-xl bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700">
            <CheckCircle2 size={15} /> Pago registrado correctamente
          </motion.div>
        )}
        {sentToast && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mx-5 mt-3 flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700">
            <Send size={15} /> Factura enviada por correo
          </motion.div>
        )}
        {sendError && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mx-5 mt-3 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600">
            {sendError}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto px-5 pb-40 pt-5 flex flex-col gap-5">

        {/* Document chain — back to source quote */}
        {quotesData?.id && (
          <button onClick={() => router.push(`/app/quotes/${quotesData.id}`)}
            className="flex items-center gap-2 text-xs text-[var(--text-tertiary)] hover:text-[var(--accent)] w-fit">
            <FileText size={12} /> Ver cotización original
          </button>
        )}

        {/* Client + amount */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-2xl font-black [font-family:var(--font-display)] text-[var(--text-primary)] leading-tight">
              {invoice.clients?.name ?? 'Sin cliente'}
            </p>
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">Emitida: {fmtDate(invoice.issued_at)}</p>
            <p className="text-xs text-[var(--text-tertiary)]">Vence: {fmtDate(invoice.due_at)}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-3xl font-black tabular-nums [font-family:var(--font-display)] text-[var(--accent)]">
              {fmt(invoice.total_cents)}
            </p>
          </div>
        </div>

        {/* Client contact */}
        {invoice.clients && (invoice.clients.phone || invoice.clients.email) && (
          <div className="flex gap-2">
            {invoice.clients.phone && (
              <a href={`tel:${invoice.clients.phone}`}
                className="flex flex-1 h-10 items-center justify-center gap-2 rounded-xl bg-[var(--surface)] text-sm font-semibold text-[var(--text-secondary)]">
                <Phone size={14} /> Llamar
              </a>
            )}
            {invoice.clients.email && (
              <a href={`mailto:${invoice.clients.email}`}
                className="flex flex-1 h-10 items-center justify-center gap-2 rounded-xl bg-[var(--surface)] text-sm font-semibold text-[var(--text-secondary)]">
                <Mail size={14} /> Email
              </a>
            )}
          </div>
        )}

        {/* Payment progress */}
        <div className="rounded-2xl bg-[var(--surface)] p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Progreso de pago</p>
            <p className="text-sm font-black text-[var(--accent)]">{pct}%</p>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--text-tertiary)_12%,transparent)]">
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${pct}%` }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className={`h-full rounded-full ${isPaid ? 'bg-green-500' : 'bg-[var(--accent)]'}`}
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[var(--bg)] px-3 py-2">
              <p className="text-[10px] text-[var(--text-tertiary)]">Pagado</p>
              <p className="text-base font-black tabular-nums text-green-500">{fmt(invoice.amount_paid_cents)}</p>
            </div>
            <div className="rounded-xl bg-[var(--bg)] px-3 py-2">
              <p className="text-[10px] text-[var(--text-tertiary)]">Pendiente</p>
              <p className={`text-base font-black tabular-nums ${remaining > 0 ? 'text-amber-500' : 'text-[var(--text-tertiary)]'}`}>{fmt(remaining)}</p>
            </div>
          </div>
        </div>

        {/* Items */}
        {items.length > 0 && (
          <div className="rounded-2xl bg-[var(--surface)] overflow-hidden">
            <p className="px-4 pt-4 pb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Servicios</p>
            {items.map((item, i) => (
              <div key={item.id} className={`flex items-start justify-between gap-3 px-4 py-3 ${i > 0 ? 'border-t border-[color-mix(in_oklab,var(--text-tertiary)_8%,transparent)]' : ''}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{item.name}</p>
                  {item.description && <p className="text-xs text-[var(--text-tertiary)]">{item.description}</p>}
                  <p className="text-xs text-[var(--text-tertiary)]">{item.qty} × {fmt(item.unit_price_cents)}{item.unit ? ` / ${item.unit}` : ''}</p>
                </div>
                <span className="text-sm font-bold tabular-nums text-[var(--text-primary)] shrink-0">{fmt(item.total_cents)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-[color-mix(in_oklab,var(--text-tertiary)_8%,transparent)] px-4 py-4 bg-[color-mix(in_oklab,var(--accent)_6%,transparent)]">
              <span className="text-base font-bold text-[var(--text-primary)]">Total</span>
              <span className="text-xl font-black tabular-nums [font-family:var(--font-display)] text-[var(--accent)]">{fmt(invoice.total_cents)}</span>
            </div>
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div className="flex items-start gap-3 rounded-2xl bg-[var(--surface)] px-4 py-3">
            <FileText size={15} className="shrink-0 text-[var(--text-tertiary)] mt-0.5" />
            <p className="text-sm text-[var(--text-secondary)]">{invoice.notes}</p>
          </div>
        )}

        {/* Due date */}
        {invoice.due_at && (
          <div className="flex items-center gap-3 rounded-2xl bg-[var(--surface)] px-4 py-3">
            <Calendar size={15} className="shrink-0 text-[var(--text-tertiary)]" />
            <p className="text-sm text-[var(--text-secondary)]">
              Vence el <span className="font-semibold text-[var(--text-primary)]">{fmtDate(invoice.due_at)}</span>
            </p>
          </div>
        )}

        {/* Payment history */}
        {invoice.payments.length > 0 && (
          <div className="rounded-2xl bg-[var(--surface)] overflow-hidden">
            <p className="px-4 pt-4 pb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Historial de pagos</p>
            {invoice.payments.map((pmt, i) => (
              <div key={pmt.id} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-[color-mix(in_oklab,var(--text-tertiary)_8%,transparent)]' : ''}`}>
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-green-50 text-lg">
                  {METHOD_ICONS[pmt.method] ?? '💰'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{METHOD_LABELS[pmt.method] ?? pmt.method}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {fmtDate(pmt.paid_at)}{pmt.notes ? ` · ${pmt.notes}` : ''}
                  </p>
                </div>
                <span className="text-sm font-black tabular-nums text-green-600 shrink-0">{fmt(pmt.amount_cents)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Link */}
        <div className="rounded-2xl bg-[var(--surface)] p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Link para el cliente</p>
          <div className="flex items-center gap-2">
            <p className="flex-1 truncate rounded-lg bg-[var(--bg)] px-3 py-2 font-mono text-xs text-[var(--text-tertiary)]">{publicUrl}</p>
            <button onClick={copyLink}
              className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]">
              {copied ? <CheckCircle2 size={16} color="var(--accent)" /> : <Copy size={16} color="var(--accent)" />}
            </button>
          </div>
        </div>

      </div>

      {/* Bottom actions */}
      <div className="fixed bottom-16 inset-x-0 border-t border-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)] bg-[var(--bg)] p-4 flex gap-2">
        {invoice.clients?.email ? (
          <button
            disabled={sending}
            onClick={() => {
              setSendError(null)
              startSend(async () => {
                const res = await sendInvoice(invoice.id)
                if (res.error) { setSendError(res.error); return }
                setSentToast(true)
                setTimeout(() => setSentToast(false), 3000)
              })
            }}
            className="flex h-13 flex-1 items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] text-sm font-semibold text-[var(--text-secondary)] disabled:opacity-60">
            {sending ? 'Enviando…' : sentToast ? <><CheckCircle2 size={15} className="text-green-600" /> Enviada</> : <><Send size={15} /> Enviar</>}
          </button>
        ) : (
          <button onClick={copyLink}
            className="flex h-13 flex-1 items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] text-sm font-semibold text-[var(--text-secondary)]">
            {copied ? <><CheckCircle2 size={15} /> Copiado</> : <><Send size={15} /> Copiar link</>}
          </button>
        )}
        {!isPaid && (
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowPaySheet(true)}
            className="flex h-13 flex-1 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] text-sm font-bold text-white [box-shadow:var(--shadow-cta)]">
            <DollarSign size={16} /> Registrar pago
          </motion.button>
        )}
        {isPaid && (
          <div className="flex h-13 flex-1 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-green-50 text-sm font-bold text-green-700">
            <CheckCircle2 size={16} /> Pagada completa
          </div>
        )}
      </div>

      {/* Pay sheet */}
      <AnimatePresence>
        {showPaySheet && (
          <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={() => setShowPaySheet(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={spring}
              onClick={e => e.stopPropagation()}
              className="w-full rounded-t-3xl bg-[var(--bg)] p-6">
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)]" />
              <p className="mb-1 text-lg font-black [font-family:var(--font-display)] text-[var(--text-primary)]">Registrar pago</p>
              <p className="mb-5 text-sm text-[var(--text-tertiary)]">Pendiente: {fmt(remaining)}</p>

              <div className="mb-4 flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Monto recibido</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--text-tertiary)]">$</span>
                  <input type="number" inputMode="decimal" step="0.01" min="0.01"
                    placeholder={(remaining / 100).toFixed(2)}
                    value={amountInput} onChange={e => setAmountInput(e.target.value)}
                    className="h-12 w-full rounded-2xl border border-[color-mix(in_oklab,var(--text-tertiary)_30%,transparent)] bg-[var(--surface)] pl-8 pr-4 text-sm font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" />
                </div>
                <button onClick={() => setAmountInput((remaining / 100).toFixed(2))}
                  className="self-start text-xs font-semibold text-[var(--accent)]">
                  Monto completo ({fmt(remaining)})
                </button>
              </div>

              <div className="mb-4 flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Método de pago</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['cash', 'transfer', 'card', 'check', 'other'] as const).map(m => (
                    <button key={m} onClick={() => setMethod(m)}
                      className={`h-10 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1 ${
                        method === m ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface)] text-[var(--text-secondary)]'
                      }`}>
                      {METHOD_ICONS[m]} {METHOD_LABELS[m]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-5 flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Notas (opcional)</label>
                <input type="text" placeholder="Ref. transferencia, cheque #, etc."
                  value={payNotes} onChange={e => setPayNotes(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-[color-mix(in_oklab,var(--text-tertiary)_30%,transparent)] bg-[var(--surface)] px-4 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" />
              </div>

              {/* Payment mismatch warning */}
              {(() => {
                const entered = Math.round(parseFloat(amountInput) * 100);
                if (!entered || !amountInput) return null;
                if (entered > remaining + 100) {
                  return (
                    <div className="mb-3 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-700">
                      <AlertTriangle size={13} className="shrink-0" />
                      Este monto supera el saldo pendiente ({fmt(remaining)}) — ¿es un pago adelantado?
                    </div>
                  );
                }
                if (entered < remaining - 100 && entered > 0) {
                  return (
                    <div className="mb-3 flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2.5 text-xs font-semibold text-blue-700">
                      <AlertTriangle size={13} className="shrink-0" />
                      Pago parcial — quedará un saldo de {fmt(remaining - entered)}.
                    </div>
                  );
                }
                return null;
              })()}
              <motion.button whileTap={{ scale: 0.97 }} onClick={handlePay} disabled={paying || !amountInput}
                className="flex h-13 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] text-base font-bold text-white [box-shadow:var(--shadow-cta)] disabled:opacity-50">
                <Banknote size={18} />
                {paying ? 'Guardando…' : 'Confirmar pago'}
              </motion.button>
              <button onClick={() => setShowPaySheet(false)} className="mt-3 w-full py-2 text-sm text-[var(--text-tertiary)]">Cancelar</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* More menu */}
      <AnimatePresence>
        {showMore && (
          <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={() => setShowMore(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={spring}
              onClick={e => e.stopPropagation()}
              className="w-full rounded-t-3xl bg-[var(--bg)] p-5 pb-8 flex flex-col gap-2">
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)]" />
              {invoice.status === 'draft' && (
                <button disabled={marking} onClick={markSent}
                  className="flex h-12 items-center gap-3 rounded-2xl bg-blue-50 px-4 text-sm font-semibold text-blue-700 disabled:opacity-60">
                  <Send size={16} /> Marcar como enviada
                </button>
              )}
              <button onClick={copyLink}
                className="flex h-12 items-center gap-3 rounded-2xl bg-[var(--surface)] px-4 text-sm font-semibold text-[var(--text-secondary)]">
                <Copy size={16} /> {copied ? 'Link copiado' : 'Copiar link del cliente'}
              </button>
              <button onClick={() => setShowMore(false)}
                className="flex h-12 items-center justify-center rounded-2xl bg-[var(--surface)] text-sm font-semibold text-[var(--text-secondary)]">
                Cancelar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
