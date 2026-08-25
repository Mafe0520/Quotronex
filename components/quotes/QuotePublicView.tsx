'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Download, CheckCircle, AlertTriangle, Calendar, BadgeDollarSign, Plus, Minus, ThumbsUp, ThumbsDown, X } from 'lucide-react'

const STATUS_ES: Record<string, { label: string; color: string }> = {
  draft:     { label: 'Borrador',   color: 'bg-gray-100 text-gray-600' },
  sent:      { label: 'Enviada',    color: 'bg-blue-100 text-blue-700' },
  viewed:    { label: 'Vista',      color: 'bg-amber-100 text-amber-700' },
  accepted:  { label: 'Aceptada',   color: 'bg-green-100 text-green-700' },
  declined:  { label: 'Declinada',  color: 'bg-red-100 text-red-700' },
  expired:   { label: 'Expirada',   color: 'bg-gray-100 text-gray-500' },
  converted: { label: 'Convertida', color: 'bg-purple-100 text-purple-700' },
}

function fmt(cents: number) {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

type QuoteItem = {
  id: string; name: string; description: string | null
  qty: number; unit_price_cents: number; total_cents: number; unit: string | null
  optional: boolean
}

type Quote = {
  id: string; status: string; total_cents: number; created_at: string
  accepted_at: string | null; accepted_name: string | null
  expires_at: string | null; notes: string | null
  deposit_cents: number | null; deposit_pct: number | null
  clients: { name: string; email: string | null; phone: string | null } | null
  businesses: { name: string; phone: string | null; email: string | null; address: string | null; website: string | null; tagline: string | null; logo_url?: string | null; zelle_tag?: string | null; cashapp_tag?: string | null; venmo_tag?: string | null } | null
}

export function QuotePublicView({ quote, items }: { quote: Quote; items: QuoteItem[] }) {
  const [downloading, setDownloading] = useState(false)
  const [selectedOptionals, setSelectedOptionals] = useState<Set<string>>(new Set())
  // Accept flow
  const [acceptName, setAcceptName] = useState('')
  const [accepting, setAccepting] = useState(false)
  const [localStatus, setLocalStatus] = useState(quote.status)
  const [localAcceptedName, setLocalAcceptedName] = useState(quote.accepted_name)
  // Decline flow
  const [showDecline, setShowDecline] = useState(false)
  const [declineReason, setDeclineReason] = useState('')
  const [declining, setDeclining] = useState(false)
  // Change request flow
  const [showChangeRequest, setShowChangeRequest] = useState(false)
  const [changeMessage, setChangeMessage] = useState('')
  const [requestingChange, setRequestingChange] = useState(false)
  const [changeRequestSent, setChangeRequestSent] = useState(false)

  async function handleAccept(e: React.FormEvent) {
    e.preventDefault()
    if (!acceptName.trim()) return
    setAccepting(true)
    await fetch(`/api/quotes/${quote.id}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: acceptName.trim() }),
    })
    setLocalStatus('accepted')
    setLocalAcceptedName(acceptName.trim())
    setAccepting(false)
  }

  async function handleDecline(e: React.FormEvent) {
    e.preventDefault()
    setDeclining(true)
    await fetch(`/api/quotes/${quote.id}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decline: true, reason: declineReason.trim() }),
    })
    setLocalStatus('declined')
    setDeclining(false)
    setShowDecline(false)
  }

  async function handleChangeRequest(e: React.FormEvent) {
    e.preventDefault()
    if (!changeMessage.trim()) return
    setRequestingChange(true)
    const { requestQuoteChanges } = await import('@/app/actions/quotes')
    await requestQuoteChanges(quote.id, changeMessage.trim())
    setChangeRequestSent(true)
    setRequestingChange(false)
    setShowChangeRequest(false)
  }

  // Mark as viewed on mount
  useEffect(() => {
    if (quote.status === 'sent') {
      fetch(`/api/quotes/${quote.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ viewOnly: true }),
      }).catch(() => {})
    }
  }, [quote.id, quote.status])

  const baseItems = items.filter(i => !i.optional)
  const optionalItems = items.filter(i => i.optional)

  const total = useMemo(() => {
    const base = baseItems.reduce((s, i) => s + i.total_cents, 0)
    const addons = optionalItems
      .filter(i => selectedOptionals.has(i.id))
      .reduce((s, i) => s + i.total_cents, 0)
    return base + addons
  }, [baseItems, optionalItems, selectedOptionals])

  const depositAmount = useMemo(() => {
    if (quote.deposit_cents) return quote.deposit_cents
    if (quote.deposit_pct) return Math.round(total * quote.deposit_pct / 100)
    return null
  }, [quote.deposit_cents, quote.deposit_pct, total])

  const quoteNumber = quote.id.slice(0, 8).toUpperCase()
  const biz = quote.businesses

  const expiryWarning = (() => {
    if (!quote.expires_at) return null
    const exp = new Date(quote.expires_at)
    const daysLeft = Math.ceil((exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (daysLeft < 0) return { type: 'expired', label: `Esta cotización expiró el ${fmtDate(quote.expires_at)}` }
    if (daysLeft <= 3) return { type: 'soon', label: `Válida por ${daysLeft} día${daysLeft !== 1 ? 's' : ''} más` }
    return null
  })()

  function toggleOptional(id: string) {
    setSelectedOptionals(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleDownloadPDF() {
    setDownloading(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const W = 210
      const M = 18
      let y = 0

      pdf.setFillColor(17, 24, 39)
      pdf.rect(0, 0, W, 52, 'F')
      pdf.setFillColor(5, 150, 105)
      pdf.rect(0, 52, W, 2.5, 'F')

      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(255, 255, 255)
      pdf.text(biz?.name ?? 'Mi Negocio', M, 18)
      if (biz?.tagline) {
        pdf.setFontSize(8.5)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(167, 243, 208)
        pdf.text(biz.tagline, M, 24)
      }

      let by = 13
      const R = W - M
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(209, 213, 219)
      if (biz?.phone)   { pdf.text(biz.phone,   R, by, { align: 'right' }); by += 5 }
      if (biz?.email)   { pdf.text(biz.email,   R, by, { align: 'right' }); by += 5 }
      if (biz?.address) { pdf.text(biz.address, R, by, { align: 'right' }); by += 5 }
      if (biz?.website) {
        pdf.setTextColor(167, 243, 208)
        pdf.text(biz.website, R, by, { align: 'right' })
      }

      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(156, 163, 175)
      pdf.text('COTIZACIÓN', M, 42)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(209, 213, 219)
      pdf.text(`#${quoteNumber}`, M + 26, 42)
      pdf.text(fmtDate(quote.created_at), R, 42, { align: 'right' })

      y = 66

      if (quote.clients) {
        pdf.setFontSize(7)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(156, 163, 175)
        pdf.text('PARA', M, y)
        y += 5
        pdf.setFontSize(11)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(17, 24, 39)
        pdf.text(quote.clients.name, M, y)
        y += 5
        pdf.setFontSize(8.5)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(107, 114, 128)
        if (quote.clients.email) { pdf.text(quote.clients.email, M, y); y += 4.5 }
        if (quote.clients.phone) { pdf.text(quote.clients.phone, M, y); y += 4.5 }
        y += 4
      }

      pdf.setDrawColor(229, 231, 235)
      pdf.setLineWidth(0.3)
      pdf.line(M, y, W - M, y)
      y += 8

      pdf.setFillColor(249, 250, 251)
      pdf.rect(M, y - 4, W - M * 2, 10, 'F')
      pdf.setFontSize(7)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(107, 114, 128)
      pdf.text('DESCRIPCIÓN', M + 2, y + 2)
      pdf.text('CANT.', 132, y + 2, { align: 'center' })
      pdf.text('P. UNIT.', 158, y + 2, { align: 'right' })
      pdf.text('TOTAL', W - M - 2, y + 2, { align: 'right' })
      y += 10

      const allIncluded = [
        ...baseItems,
        ...optionalItems.filter(i => selectedOptionals.has(i.id)),
      ]
      allIncluded.forEach((item, i) => {
        if (i % 2 === 1) {
          pdf.setFillColor(249, 250, 251)
          pdf.rect(M, y - 4, W - M * 2, item.description ? 13 : 9, 'F')
        }
        pdf.setFontSize(9.5)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(17, 24, 39)
        pdf.text(item.name, M + 2, y + 1)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(75, 85, 99)
        pdf.text(String(item.qty), 132, y + 1, { align: 'center' })
        pdf.text(fmt(item.unit_price_cents), 158, y + 1, { align: 'right' })
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(17, 24, 39)
        pdf.text(fmt(item.total_cents), W - M - 2, y + 1, { align: 'right' })
        y += 6
        if (item.description) {
          pdf.setFontSize(7.5)
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(156, 163, 175)
          pdf.text(item.description, M + 2, y)
          y += 6
        }
      })

      y += 4
      pdf.setFillColor(17, 24, 39)
      pdf.rect(W - M - 58, y - 4, 58 + M, 14, 'F')
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(156, 163, 175)
      pdf.text('TOTAL', W - M - 52, y + 4)
      pdf.setFontSize(14)
      pdf.setTextColor(255, 255, 255)
      pdf.text(fmt(total), W - M - 2, y + 5, { align: 'right' })
      y += 22

      if (quote.accepted_at && quote.accepted_name) {
        pdf.setFillColor(236, 253, 245)
        pdf.roundedRect(M, y, W - M * 2, 16, 2, 2, 'F')
        pdf.setFillColor(5, 150, 105)
        pdf.roundedRect(M, y, 3, 16, 1, 1, 'F')
        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(6, 95, 70)
        pdf.text(`Aceptado por ${quote.accepted_name}`, M + 7, y + 6)
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(8)
        pdf.setTextColor(4, 120, 87)
        pdf.text(fmtDate(quote.accepted_at), M + 7, y + 12)
        y += 22
      }

      pdf.setFillColor(243, 244, 246)
      pdf.rect(0, 282, W, 15, 'F')
      pdf.setFontSize(7.5)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(156, 163, 175)
      pdf.text('Generado con Quotronex', M, 289)
      if (biz?.website) {
        pdf.setTextColor(5, 150, 105)
        pdf.text(biz.website, W - M, 289, { align: 'right' })
      }

      pdf.save(`cotizacion-${quoteNumber}.pdf`)
    } finally {
      setDownloading(false)
    }
  }

  const statusMeta = STATUS_ES[localStatus] ?? STATUS_ES.draft
  const canAct = localStatus === 'sent' || localStatus === 'viewed'

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-page { box-shadow: none !important; margin: 0 !important; max-width: 100% !important; }
        }
      `}</style>

      <div className="min-h-screen bg-gray-50 py-8 px-4">

        {/* Expiry banner */}
        {expiryWarning && (
          <div className={`no-print mx-auto mb-4 max-w-2xl flex items-center gap-3 rounded-xl px-4 py-3 ${expiryWarning.type === 'expired' ? 'bg-red-50 border border-red-100' : 'bg-amber-50 border border-amber-100'}`}>
            <AlertTriangle size={16} className={expiryWarning.type === 'expired' ? 'text-red-500 shrink-0' : 'text-amber-500 shrink-0'} />
            <p className={`text-sm font-semibold ${expiryWarning.type === 'expired' ? 'text-red-700' : 'text-amber-700'}`}>{expiryWarning.label}</p>
          </div>
        )}

        {/* Accepted banner */}
        {localStatus === 'accepted' && (
          <div className="no-print mx-auto mb-4 max-w-2xl flex items-center gap-3 rounded-xl bg-green-50 border border-green-100 px-4 py-3">
            <CheckCircle size={16} className="text-green-600 shrink-0" />
            <p className="text-sm font-semibold text-green-700">Esta cotización fue aceptada{localAcceptedName ? ` por ${localAcceptedName}` : ''}</p>
          </div>
        )}

        {/* Declined banner */}
        {localStatus === 'declined' && (
          <div className="no-print mx-auto mb-4 max-w-2xl flex items-center gap-3 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
            <X size={16} className="text-red-500 shrink-0" />
            <p className="text-sm font-semibold text-red-700">Cotización rechazada</p>
          </div>
        )}

        {/* Download button */}
        <div className="no-print mx-auto mb-4 flex max-w-2xl justify-end">
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-60"
          >
            <Download size={15} /> {downloading ? 'Generando…' : 'Descargar PDF'}
          </button>
        </div>

        {/* Quote document */}
        <div className="print-page mx-auto max-w-2xl rounded-2xl bg-white shadow-lg overflow-hidden">

          {/* Header */}
          <div className="bg-gray-900 px-8 py-7 text-white">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {biz?.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={biz.logo_url} alt={biz.name} className="size-6 rounded object-cover" />
                  ) : (
                    <div className="size-5 rounded bg-emerald-400" />
                  )}
                  <span className="text-sm font-bold tracking-wide">{biz?.name ?? 'Quotronex'}</span>
                </div>
                {biz?.tagline && <p className="text-xs text-emerald-300 mt-0.5">{biz.tagline}</p>}
                <h1 className="text-2xl font-black mt-3">Cotización</h1>
                <p className="text-gray-400 text-sm mt-0.5">#{quoteNumber}</p>
              </div>
              <div className="text-right">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta.color}`}>
                  {statusMeta.label}
                </span>
                <p className="text-xs text-gray-400 uppercase tracking-widest mt-3">Fecha</p>
                <p className="text-sm font-semibold mt-0.5">{fmtDate(quote.created_at)}</p>
                {quote.expires_at && !expiryWarning && (
                  <div className="mt-2 flex items-center gap-1 justify-end">
                    <Calendar size={11} className="text-gray-400" />
                    <p className="text-xs text-gray-400">Válida hasta {fmtDate(quote.expires_at)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Business contact */}
            {(biz?.phone || biz?.email || biz?.address) && (
              <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-x-5 gap-y-1">
                {biz?.phone   && <p className="text-xs text-gray-400">{biz.phone}</p>}
                {biz?.email   && <p className="text-xs text-gray-400">{biz.email}</p>}
                {biz?.address && <p className="text-xs text-gray-400">{biz.address}</p>}
                {biz?.website && <p className="text-xs text-emerald-400">{biz.website}</p>}
              </div>
            )}
          </div>

          {/* Client info */}
          {quote.clients && (
            <div className="border-b border-gray-100 px-8 py-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Para</p>
              <p className="text-base font-bold text-gray-900">{quote.clients.name}</p>
              {quote.clients.email && <p className="text-sm text-gray-500 mt-0.5">{quote.clients.email}</p>}
              {quote.clients.phone && <p className="text-sm text-gray-500">{quote.clients.phone}</p>}
            </div>
          )}

          {/* Base items */}
          <div className="px-8 py-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold uppercase tracking-widest text-gray-400">
                  <th className="pb-3 text-left">Descripción</th>
                  <th className="pb-3 text-center w-16">Cant.</th>
                  <th className="pb-3 text-right w-28">Precio unit.</th>
                  <th className="pb-3 text-right w-28">Total</th>
                </tr>
              </thead>
              <tbody>
                {baseItems.map((item, i) => (
                  <tr key={item.id} className={`border-b border-gray-50 ${i % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                    <td className="py-3.5 pr-4">
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      {item.description && <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>}
                      {item.unit && <p className="text-xs text-gray-400">por {item.unit}</p>}
                    </td>
                    <td className="py-3.5 text-center text-gray-600">{item.qty}</td>
                    <td className="py-3.5 text-right text-gray-600">{fmt(item.unit_price_cents)}</td>
                    <td className="py-3.5 text-right font-semibold text-gray-900">{fmt(item.total_cents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total */}
            <div className="mt-6 flex justify-end">
              <div className="w-56">
                {optionalItems.length > 0 && selectedOptionals.size > 0 && (
                  <div className="flex justify-between py-2 text-sm text-gray-500">
                    <span>Servicios base</span>
                    <span>{fmt(baseItems.reduce((s, i) => s + i.total_cents, 0))}</span>
                  </div>
                )}
                {optionalItems.filter(i => selectedOptionals.has(i.id)).map(i => (
                  <div key={i.id} className="flex justify-between py-1 text-sm text-emerald-600">
                    <span className="truncate max-w-[120px]">+ {i.name}</span>
                    <span>{fmt(i.total_cents)}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-gray-900 pt-3 mt-1">
                  <span className="text-base font-black text-gray-900">Total</span>
                  <motion.span key={total} initial={{ scale: 1.04 }} animate={{ scale: 1 }}
                    className="text-xl font-black text-gray-900">
                    {fmt(total)}
                  </motion.span>
                </div>
                {depositAmount && (
                  <div className="flex items-center gap-1.5 mt-3 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2">
                    <BadgeDollarSign size={14} className="text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-emerald-800">Depósito requerido</p>
                      <p className="text-xs text-emerald-600">
                        {fmt(depositAmount)}{quote.deposit_pct ? ` (${quote.deposit_pct}%)` : ''}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Optional add-ons */}
          {optionalItems.length > 0 && quote.status !== 'expired' && (
            <div className="border-t border-gray-100 px-8 py-6 no-print">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Servicios opcionales</p>
              <p className="text-xs text-gray-400 mb-4">Marca los que te interesan para ver el total actualizado</p>
              <div className="flex flex-col gap-3">
                {optionalItems.map(item => {
                  const selected = selectedOptionals.has(item.id)
                  return (
                    <motion.button key={item.id} whileTap={{ scale: 0.98 }}
                      onClick={() => toggleOptional(item.id)}
                      className={`flex items-center gap-4 rounded-xl border-2 px-4 py-3 text-left transition-colors ${
                        selected ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                      }`}>
                      <div className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        selected ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
                      }`}>
                        {selected ? <Minus size={12} className="text-white" /> : <Plus size={12} className="text-gray-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${selected ? 'text-emerald-900' : 'text-gray-800'}`}>{item.name}</p>
                        {item.description && <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>}
                      </div>
                      <span className={`text-sm font-bold shrink-0 ${selected ? 'text-emerald-700' : 'text-gray-600'}`}>{fmt(item.total_cents)}</span>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          {quote.notes && (
            <div className="border-t border-gray-100 px-8 py-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Notas</p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{quote.notes}</p>
            </div>
          )}

          {/* Payment instructions */}
          {(biz?.zelle_tag || biz?.cashapp_tag || biz?.venmo_tag) && (
            <div className="border-t border-gray-100 px-8 py-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Instrucciones de pago</p>
              <div className="flex flex-col gap-2">
                {biz.zelle_tag && (
                  <div className="flex items-center justify-between rounded-xl bg-violet-50 px-4 py-2.5">
                    <span className="text-sm font-semibold text-violet-700">💳 Zelle</span>
                    <span className="text-sm text-violet-800 font-mono">{biz.zelle_tag}</span>
                  </div>
                )}
                {biz.cashapp_tag && (
                  <div className="flex items-center justify-between rounded-xl bg-green-50 px-4 py-2.5">
                    <span className="text-sm font-semibold text-green-700">💚 Cash App</span>
                    <span className="text-sm text-green-800 font-mono">{biz.cashapp_tag}</span>
                  </div>
                )}
                {biz.venmo_tag && (
                  <div className="flex items-center justify-between rounded-xl bg-blue-50 px-4 py-2.5">
                    <span className="text-sm font-semibold text-blue-700">🔵 Venmo</span>
                    <span className="text-sm text-blue-800 font-mono">{biz.venmo_tag}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-100 px-8 py-4">
            <p className="text-center text-xs text-gray-400">
              Generado con Quotronex
              {biz?.website && <span> · <span className="text-emerald-600">{biz.website}</span></span>}
            </p>
          </div>
        </div>

        {/* Contact CTA */}
        {biz?.phone && (
          <div className="no-print mx-auto mt-6 max-w-2xl">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm text-center">
              <p className="text-sm font-semibold text-gray-700">¿Tienes preguntas sobre esta cotización?</p>
              <a href={`tel:${biz.phone}`}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-gray-800">
                Llamar a {biz.name}
              </a>
            </div>
          </div>
        )}

        {/* Accept / Decline CTA */}
        <AnimatePresence>
          {canAct && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="no-print mx-auto mt-6 max-w-2xl">

              {/* Change request sent confirmation */}
              {changeRequestSent && (
                <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-4 text-center">
                  <p className="text-sm font-semibold text-blue-700">✓ Tu solicitud de cambios fue enviada. El contratista se pondrá en contacto contigo.</p>
                </div>
              )}

              {/* Accept form */}
              {!showDecline && !showChangeRequest && (
                <div className="rounded-2xl border-2 border-emerald-500 bg-white p-6 shadow-lg">
                  <h2 className="text-base font-bold text-gray-900 mb-1">¿Listo para aprobar esta cotización?</h2>
                  <p className="text-sm text-gray-500 mb-4">Escribe tu nombre para confirmar la aprobación. Escribe tu nombre para confirmar la aprobación.</p>
                  <form onSubmit={handleAccept} className="flex flex-col gap-3">
                    <input
                      type="text"
                      placeholder="Tu nombre completo"
                      value={acceptName}
                      onChange={e => setAcceptName(e.target.value)}
                      required
                      className="h-12 w-full rounded-xl border border-gray-200 px-4 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                    <div className="flex gap-2">
                      <button type="submit" disabled={accepting || !acceptName.trim()}
                        className="flex flex-1 h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white disabled:opacity-60">
                        {accepting
                          ? <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".25"/><path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
                          : <><ThumbsUp size={15} /> Aprobar cotización</>}
                      </button>
                      <button type="button" onClick={() => setShowChangeRequest(true)}
                        className="flex h-12 items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 text-sm font-medium text-blue-600 hover:bg-blue-100">
                        Cambios
                      </button>
                      <button type="button" onClick={() => setShowDecline(true)}
                        className="flex h-12 items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-3 text-sm font-medium text-gray-500 hover:bg-gray-50">
                        <ThumbsDown size={14} />
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Change request form */}
              {showChangeRequest && !changeRequestSent && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="rounded-2xl border-2 border-blue-200 bg-white p-6 shadow-lg">
                  <h2 className="text-base font-bold text-gray-900 mb-1">Solicitar cambios</h2>
                  <p className="text-sm text-gray-500 mb-4">Describe los cambios que necesitas y el contratista te contactará.</p>
                  <form onSubmit={handleChangeRequest} className="flex flex-col gap-3">
                    <textarea
                      placeholder="Ej. Me gustaría agregar una habitación más al alcance del proyecto"
                      value={changeMessage}
                      onChange={e => setChangeMessage(e.target.value)}
                      rows={3}
                      required
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-400 resize-none"
                    />
                    <div className="flex gap-2">
                      <button type="submit" disabled={requestingChange || !changeMessage.trim()}
                        className="flex flex-1 h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white disabled:opacity-60">
                        {requestingChange
                          ? <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".25"/><path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
                          : 'Enviar solicitud'}
                      </button>
                      <button type="button" onClick={() => setShowChangeRequest(false)}
                        className="flex h-12 items-center justify-center rounded-xl border border-gray-200 px-4 text-sm text-gray-500 hover:bg-gray-50">
                        Cancelar
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* Decline form */}
              {showDecline && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="rounded-2xl border-2 border-red-200 bg-white p-6 shadow-lg">
                  <h2 className="text-base font-bold text-gray-900 mb-1">¿Rechazar esta cotización?</h2>
                  <p className="text-sm text-gray-500 mb-4">Opcional: cuéntanos el motivo para que podamos mejorar.</p>
                  <form onSubmit={handleDecline} className="flex flex-col gap-3">
                    <textarea
                      placeholder="Ej. El precio está fuera de mi presupuesto (opcional)"
                      value={declineReason}
                      onChange={e => setDeclineReason(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-red-400 resize-none"
                    />
                    <div className="flex gap-2">
                      <button type="submit" disabled={declining}
                        className="flex flex-1 h-12 items-center justify-center gap-2 rounded-xl bg-red-500 text-sm font-bold text-white disabled:opacity-60">
                        {declining
                          ? <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".25"/><path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
                          : 'Confirmar rechazo'}
                      </button>
                      <button type="button" onClick={() => setShowDecline(false)}
                        className="flex h-12 items-center justify-center rounded-xl border border-gray-200 px-4 text-sm text-gray-500 hover:bg-gray-50">
                        Cancelar
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </>
  )
}
