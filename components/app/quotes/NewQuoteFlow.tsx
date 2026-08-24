'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  ChevronLeft, Plus, Trash2, User, Search, Check, ChevronRight,
  Package, Mic, MicOff, Sparkles, AlertCircle, CheckCircle2, XCircle,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createQuote, createClient_, type QuoteItemDraft } from '@/app/actions/quotes'
import { generateEstimate, type SuggestedItem } from '@/app/actions/ai'

const T = { duration: 0.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }

type Client = { id: string; name: string; email: string | null; phone: string | null }
type PriceBookItem = { id: string; name: string; price_cents: number; unit: string | null; trade: string | null; favorite: boolean }

function fmt(cents: number) {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/* ── Step 1: Select client ── */
function StepClient({
  clients, selected, onSelect, onNext, onClientCreated,
}: {
  clients: Client[]
  selected: Client | null
  onSelect: (c: Client | null) => void
  onNext: () => void
  onClientCreated: (c: Client) => void
}) {
  const [q, setQ] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newAddress, setNewAddress] = useState('')
  const [saving, startSaving] = useTransition()

  const filtered = clients.filter(c => !q || c.name.toLowerCase().includes(q.toLowerCase()))

  function handleCreate() {
    if (!newName.trim()) return
    startSaving(async () => {
      const res = await createClient_(newName.trim(), newEmail.trim() || undefined, newPhone.trim() || undefined, newAddress.trim() || undefined)
      if (res.client) onClientCreated(res.client as Client)
    })
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="px-5 pt-2 pb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">Paso 1 de 4</p>
        <h2 className="mt-1 text-xl font-black [font-family:var(--font-display)] text-[var(--text-primary)]">¿Para quién es?</h2>
      </div>

      <div className="px-5 pb-3">
        <button onClick={() => { onSelect(null); onNext() }}
          className="text-xs font-medium text-[var(--text-tertiary)] underline underline-offset-2">
          Sin cliente por ahora →
        </button>
      </div>

      <div className="relative px-5 pb-3">
        <Search size={14} className="absolute left-8 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
        <input type="search" placeholder="Buscar cliente…" value={q} onChange={e => setQ(e.target.value)}
          className="h-10 w-full rounded-xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--surface)] pl-9 pr-4 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-tertiary)]" />
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5 flex flex-col gap-2 min-h-0">
        {!showNew ? (
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-3 rounded-2xl border border-dashed border-[color-mix(in_oklab,var(--accent)_30%,transparent)] p-4 text-left">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]">
              <Plus size={16} color="var(--accent)" />
            </div>
            <span className="text-sm font-semibold text-[var(--accent)]">Nuevo cliente</span>
          </button>
        ) : (
          <div className="rounded-2xl bg-[var(--surface)] p-4 flex flex-col gap-3">
            <p className="text-sm font-bold text-[var(--text-primary)]">Nuevo cliente</p>
            <input autoFocus placeholder="Nombre *" value={newName} onChange={e => setNewName(e.target.value)}
              className="h-10 rounded-xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--bg)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-tertiary)]" />
            <input placeholder="Email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
              className="h-10 rounded-xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--bg)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-tertiary)]" />
            <input placeholder="Teléfono" value={newPhone} onChange={e => setNewPhone(e.target.value)}
              className="h-10 rounded-xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--bg)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-tertiary)]" />
            <input placeholder="Dirección (opcional)" value={newAddress} onChange={e => setNewAddress(e.target.value)}
              className="h-10 rounded-xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--bg)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-tertiary)]" />
            <div className="flex gap-2">
              <button onClick={() => setShowNew(false)} className="flex-1 h-10 rounded-xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] text-sm text-[var(--text-secondary)]">Cancelar</button>
              <button onClick={handleCreate} disabled={saving || !newName.trim()}
                className="flex-1 h-10 rounded-xl bg-[var(--accent)] text-sm font-bold text-white disabled:opacity-50">
                {saving ? 'Guardando…' : 'Crear'}
              </button>
            </div>
          </div>
        )}

        {filtered.map(c => (
          <button key={c.id} onClick={() => { onSelect(c); onNext() }}
            className={`flex items-center gap-3 rounded-2xl p-4 text-left transition-colors ${selected?.id === c.id ? 'bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] ring-1 ring-[var(--accent)]' : 'bg-[var(--surface)]'}`}>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]">
              <span className="text-sm font-bold text-[var(--accent)]">{c.name[0].toUpperCase()}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--text-primary)]">{c.name}</p>
              {c.email && <p className="truncate text-xs text-[var(--text-tertiary)]">{c.email}</p>}
            </div>
            {selected?.id === c.id && <Check size={16} color="var(--accent)" />}
          </button>
        ))}

        {filtered.length === 0 && !showNew && (
          <p className="py-8 text-center text-sm text-[var(--text-tertiary)]">No se encontraron clientes</p>
        )}

        {selected && (
          <div className="mt-auto pt-2">
            <motion.button whileTap={{ scale: 0.97 }} onClick={onNext}
              className="flex h-13 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] text-base font-bold text-white [box-shadow:var(--shadow-cta)]">
              Continuar <ChevronRight size={18} />
            </motion.button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Step 2: AI describe the job ── */
function StepAI({
  businessId, priceBook, onItemsGenerated, onSkip,
}: {
  businessId: string
  priceBook: PriceBookItem[]
  onItemsGenerated: (items: QuoteItemDraft[]) => void
  onSkip: () => void
}) {
  const [text, setText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [analyzing, startAnalyze] = useTransition()
  const [result, setResult] = useState<{ understood: string; items: SuggestedItem[]; clarifications: string[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [accepted, setAccepted] = useState<Set<number>>(new Set())
  const recognitionRef = useRef<{ stop: () => void } | null>(null)

  function toggleMic() {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }
    const SR = ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) as (new () => { lang: string; continuous: boolean; interimResults: boolean; onresult: (e: any) => void; onend: () => void; start: () => void; stop: () => void }) | undefined
    if (!SR) { alert('Tu navegador no soporta reconocimiento de voz. Usa texto.'); return }
    const rec = new SR()
    rec.lang = 'es-US'
    rec.continuous = true
    rec.interimResults = true
    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results as any[]).map((r: any) => r[0].transcript).join(' ')
      setText(transcript)
    }
    rec.onend = () => setIsListening(false)
    recognitionRef.current = rec as any
    rec.start()
    setIsListening(true)
  }

  function analyze() {
    if (!text.trim()) return
    setError(null)
    setResult(null)
    setAccepted(new Set())
    startAnalyze(async () => {
      const res = await generateEstimate(text, businessId)
      if (res.error) { setError(res.error); return }
      setResult(res)
      // Auto-accept high-confidence matched items
      const autoAccept = new Set<number>()
      res.items.forEach((item, i) => { if (item.confidence === 'high' && item.matched) autoAccept.add(i) })
      setAccepted(autoAccept)
    })
  }

  function toggleAccept(i: number) {
    setAccepted(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i); else next.add(i)
      return next
    })
  }

  function useSelected() {
    if (!result) return
    const items: QuoteItemDraft[] = result.items
      .filter((_, i) => accepted.has(i))
      .map(s => ({
        name: s.name,
        description: s.description ?? undefined,
        qty: s.qty,
        unit_price_cents: s.unit_price_cents,
        unit: s.unit ?? undefined,
        price_book_item_id: s.price_book_item_id ?? undefined,
      }))
    onItemsGenerated(items)
  }

  const confidenceIcon = (c: SuggestedItem['confidence'], matched: boolean) => {
    if (matched && c === 'high') return <CheckCircle2 size={14} className="text-green-600 shrink-0" />
    if (matched && c === 'medium') return <CheckCircle2 size={14} className="text-amber-500 shrink-0" />
    return <AlertCircle size={14} className="text-[var(--text-tertiary)] shrink-0" />
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="px-5 pt-2 pb-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">Paso 2 de 4</p>
        <h2 className="mt-1 text-xl font-black [font-family:var(--font-display)] text-[var(--text-primary)]">Describe el trabajo</h2>
        <p className="mt-1 text-xs text-[var(--text-tertiary)]">La AI identifica scope y lo cruza con tu catálogo</p>
      </div>

      <div className="px-5 pb-3">
        <button onClick={onSkip} className="text-xs font-medium text-[var(--text-tertiary)] underline underline-offset-2">
          Agregar items manualmente →
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5 flex flex-col gap-4 min-h-0">

        {/* Text input + mic */}
        <div className="relative">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Ej: Cambiar 3 ventanas en dormitorios, incluye mano de obra e instalación. El cliente también quiere barnizar la puerta principal."
            rows={5}
            className="w-full rounded-2xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--surface)] px-4 py-3 pr-12 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] resize-none"
          />
          <button onClick={toggleMic}
            className={`absolute bottom-3 right-3 flex size-9 items-center justify-center rounded-xl transition-colors ${isListening ? 'bg-red-500' : 'bg-[color-mix(in_oklab,var(--accent)_12%,transparent)]'}`}>
            {isListening ? <MicOff size={16} color="white" /> : <Mic size={16} color="var(--accent)" />}
          </button>
        </div>

        {isListening && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
            <span className="size-2 rounded-full bg-red-500 animate-pulse" />
            Escuchando… habla claramente
          </motion.div>
        )}

        {/* Analyze button */}
        {!result && (
          <motion.button whileTap={{ scale: 0.97 }}
            onClick={analyze}
            disabled={analyzing || !text.trim()}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] text-sm font-bold text-white [box-shadow:var(--shadow-cta)] disabled:opacity-40">
            {analyzing ? (
              <>
                <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".25" />
                  <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Analizando con AI…
              </>
            ) : (
              <><Sparkles size={16} /> Analizar con AI</>
            )}
          </motion.button>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
            <XCircle size={16} className="shrink-0" /> {error}
          </div>
        )}

        {/* AI result */}
        {result && (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">

              {/* What I understood */}
              <div className="rounded-2xl bg-[color-mix(in_oklab,var(--accent)_6%,transparent)] border border-[color-mix(in_oklab,var(--accent)_15%,transparent)] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={13} color="var(--accent)" />
                  <p className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]">Qué entendí</p>
                </div>
                <p className="text-sm text-[var(--text-primary)]">{result.understood}</p>
              </div>

              {/* Clarifications needed */}
              {result.clarifications.length > 0 && (
                <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle size={13} className="text-amber-600" />
                    <p className="text-xs font-bold uppercase tracking-widest text-amber-600">Preguntas para el cliente</p>
                  </div>
                  <ul className="flex flex-col gap-1">
                    {result.clarifications.map((q, i) => (
                      <li key={i} className="text-sm text-amber-800">· {q}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggested items */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
                    Items encontrados — selecciona los que aplicen
                  </p>
                  <button onClick={() => setAccepted(new Set(result.items.map((_, i) => i)))}
                    className="text-xs font-semibold text-[var(--accent)]">Todos</button>
                </div>
                {result.items.map((item, i) => {
                  const isSelected = accepted.has(i)
                  return (
                    <motion.button key={i} onClick={() => toggleAccept(i)}
                      whileTap={{ scale: 0.98 }}
                      className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${
                        isSelected
                          ? 'border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_6%,transparent)]'
                          : 'border-[color-mix(in_oklab,var(--text-tertiary)_15%,transparent)] bg-[var(--surface)]'
                      }`}>
                      <div className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 mt-0.5 transition-colors ${
                        isSelected ? 'border-[var(--accent)] bg-[var(--accent)]' : 'border-[color-mix(in_oklab,var(--text-tertiary)_30%,transparent)]'
                      }`}>
                        {isSelected && <Check size={11} color="white" strokeWidth={3} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {confidenceIcon(item.confidence, item.matched)}
                          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{item.name}</p>
                          {item.matched && (
                            <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">Del catálogo</span>
                          )}
                        </div>
                        {item.description && <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{item.description}</p>}
                        <div className="mt-1 flex items-center gap-3">
                          <span className="text-xs text-[var(--text-tertiary)]">Qty: {item.qty}{item.unit ? ` ${item.unit}` : ''}</span>
                          {item.unit_price_cents > 0
                            ? <span className="text-sm font-bold tabular-nums [font-family:var(--font-display)] text-[var(--accent)]">{fmt(item.qty * item.unit_price_cents)}</span>
                            : <span className="text-xs font-semibold text-amber-600">Sin precio — agregar manualmente</span>
                          }
                        </div>
                      </div>
                    </motion.button>
                  )
                })}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <motion.button whileTap={{ scale: 0.97 }} onClick={useSelected} disabled={accepted.size === 0}
                  className="flex h-13 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] text-base font-bold text-white [box-shadow:var(--shadow-cta)] disabled:opacity-40">
                  Usar {accepted.size} items seleccionados <ChevronRight size={18} />
                </motion.button>
                <button onClick={() => { setResult(null); setAccepted(new Set()) }}
                  className="text-center text-xs text-[var(--text-tertiary)] underline underline-offset-2">
                  Editar descripción
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

/* ── Step 3: Add/edit items ── */
function StepItems({
  priceBook, items, onAdd, onRemove, onQtyChange, onNext,
}: {
  priceBook: PriceBookItem[]
  items: QuoteItemDraft[]
  onAdd: (item: QuoteItemDraft) => void
  onRemove: (i: number) => void
  onQtyChange: (i: number, qty: number) => void
  onNext: () => void
}) {
  const [q, setQ] = useState('')
  const [showManual, setShowManual] = useState(false)
  const [mName, setMName] = useState('')
  const [mPrice, setMPrice] = useState('')
  const [mQty, setMQty] = useState('1')

  const favorites = priceBook.filter(p => p.favorite)
  const filtered = priceBook.filter(p => !q || p.name.toLowerCase().includes(q.toLowerCase()))
  const trades = [...new Set(priceBook.map(p => p.trade ?? 'General'))].sort()
  const total = items.reduce((s, i) => s + i.qty * i.unit_price_cents, 0)

  function addFromBook(p: PriceBookItem) {
    onAdd({ name: p.name, qty: 1, unit_price_cents: p.price_cents, unit: p.unit ?? undefined, price_book_item_id: p.id })
  }

  function addManual() {
    const price = Math.round(parseFloat(mPrice.replace(/[^0-9.]/g, '')) * 100)
    if (!mName.trim() || isNaN(price)) return
    onAdd({ name: mName.trim(), qty: parseInt(mQty) || 1, unit_price_cents: price })
    setMName(''); setMPrice(''); setMQty('1'); setShowManual(false)
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="px-5 pt-2 pb-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">Paso 3 de 4</p>
        <h2 className="mt-1 text-xl font-black [font-family:var(--font-display)] text-[var(--text-primary)]">¿Qué incluye?</h2>
      </div>

      {/* Added items */}
      {items.length > 0 && (
        <div className="mx-5 mb-3 rounded-2xl bg-[var(--surface)] overflow-hidden">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 border-b border-[color-mix(in_oklab,var(--text-tertiary)_8%,transparent)] px-4 py-3 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{item.name}</p>
                <p className="text-xs text-[var(--text-tertiary)]">{fmt(item.unit_price_cents)} {item.unit ? `/ ${item.unit}` : ''}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => onQtyChange(i, Math.max(1, item.qty - 1))}
                  className="flex size-7 items-center justify-center rounded-lg bg-[color-mix(in_oklab,var(--text-tertiary)_12%,transparent)] text-sm font-bold">−</button>
                <span className="w-6 text-center text-sm font-bold tabular-nums">{item.qty}</span>
                <button onClick={() => onQtyChange(i, item.qty + 1)}
                  className="flex size-7 items-center justify-center rounded-lg bg-[color-mix(in_oklab,var(--text-tertiary)_12%,transparent)] text-sm font-bold">+</button>
              </div>
              <span className="w-16 text-right text-sm font-bold tabular-nums">{fmt(item.qty * item.unit_price_cents)}</span>
              <button onClick={() => onRemove(i)} className="shrink-0 text-[var(--text-tertiary)]"><Trash2 size={15} /></button>
            </div>
          ))}
          <div className="flex items-center justify-between px-4 py-3 bg-[color-mix(in_oklab,var(--accent)_6%,transparent)]">
            <span className="text-sm font-bold text-[var(--text-primary)]">Total</span>
            <span className="text-lg font-black tabular-nums [font-family:var(--font-display)] text-[var(--accent)]">{fmt(total)}</span>
          </div>
        </div>
      )}

      {/* Search price book */}
      <div className="relative px-5 pb-3">
        <Search size={14} className="absolute left-8 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
        <input type="search" placeholder="Buscar en catálogo…" value={q} onChange={e => setQ(e.target.value)}
          className="h-10 w-full rounded-xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--surface)] pl-9 pr-4 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-tertiary)]" />
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5 flex flex-col gap-3 min-h-0">
        {/* Manual item */}
        {!showManual ? (
          <button onClick={() => setShowManual(true)}
            className="flex items-center gap-3 rounded-2xl border border-dashed border-[color-mix(in_oklab,var(--accent)_30%,transparent)] p-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]">
              <Plus size={16} color="var(--accent)" />
            </div>
            <span className="text-sm font-semibold text-[var(--accent)]">Agregar ítem manual</span>
          </button>
        ) : (
          <div className="rounded-2xl bg-[var(--surface)] p-4 flex flex-col gap-3">
            <input autoFocus placeholder="Nombre del servicio *" value={mName} onChange={e => setMName(e.target.value)}
              className="h-10 rounded-xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--bg)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-tertiary)]" />
            <div className="flex gap-2">
              <input placeholder="Precio $" value={mPrice} onChange={e => setMPrice(e.target.value)} type="number" min="0"
                className="flex-1 h-10 rounded-xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--bg)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-tertiary)]" />
              <input placeholder="Qty" value={mQty} onChange={e => setMQty(e.target.value)} type="number" min="1"
                className="w-20 h-10 rounded-xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--bg)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-tertiary)]" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowManual(false)} className="flex-1 h-10 rounded-xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] text-sm text-[var(--text-secondary)]">Cancelar</button>
              <button onClick={addManual} disabled={!mName.trim() || !mPrice}
                className="flex-1 h-10 rounded-xl bg-[var(--accent)] text-sm font-bold text-white disabled:opacity-50">Agregar</button>
            </div>
          </div>
        )}

        {/* Favorites section (when no search) */}
        {!q.trim() && favorites.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">⭐ Favoritos</p>
            <div className="flex flex-col gap-2">
              {favorites.map(p => (
                <button key={p.id} onClick={() => addFromBook(p)}
                  className="flex items-center gap-3 rounded-2xl bg-[var(--surface)] p-4 text-left">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-50">
                    <Package size={16} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{p.name}</p>
                    {p.unit && <p className="text-xs text-[var(--text-tertiary)]">por {p.unit}</p>}
                  </div>
                  <span className="text-sm font-bold tabular-nums text-[var(--text-primary)]">{fmt(p.price_cents)}</span>
                  <Plus size={16} className="shrink-0 text-[var(--accent)]" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Price book by trade */}
        {trades.map(trade => {
          const tradeItems = filtered.filter(p => (p.trade ?? 'General') === trade && !(!q.trim() && p.favorite))
          if (tradeItems.length === 0) return null
          return (
            <div key={trade}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">{trade}</p>
              <div className="flex flex-col gap-2">
                {tradeItems.map(p => (
                  <button key={p.id} onClick={() => addFromBook(p)}
                    className="flex items-center gap-3 rounded-2xl bg-[var(--surface)] p-4 text-left">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--accent)_8%,transparent)]">
                      <Package size={16} color="var(--accent)" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{p.name}</p>
                      {p.unit && <p className="text-xs text-[var(--text-tertiary)]">por {p.unit}</p>}
                    </div>
                    <span className="text-sm font-bold tabular-nums text-[var(--text-primary)]">{fmt(p.price_cents)}</span>
                    <Plus size={16} className="shrink-0 text-[var(--accent)]" />
                  </button>
                ))}
              </div>
            </div>
          )
        })}

      </div>

      {/* Sticky CTA — always visible, outside the scrollable area */}
      <div className="shrink-0 border-t border-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)] bg-[var(--bg)] px-5 py-3">
        {items.length > 0 && (
          <p className="mb-2 text-center text-xs font-semibold text-[var(--text-tertiary)]">
            {items.length} {items.length === 1 ? 'ítem' : 'ítems'} · Total {fmt(total)}
          </p>
        )}
        <motion.button whileTap={{ scale: 0.97 }} onClick={onNext} disabled={items.length === 0}
          className="flex h-13 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] text-base font-bold text-white [box-shadow:var(--shadow-cta)] disabled:opacity-40">
          Revisar cotización <ChevronRight size={18} />
        </motion.button>
      </div>
    </div>
  )
}

/* ── Step 4: Review & save ── */
function StepReview({
  client, items, onBack, onSave, saving,
}: {
  client: Client | null
  items: QuoteItemDraft[]
  onBack: () => void
  onSave: (send: boolean) => void
  saving: boolean
}) {
  const total = items.reduce((s, i) => s + i.qty * i.unit_price_cents, 0)

  return (
    <div className="flex flex-1 flex-col">
      <div className="px-5 pt-2 pb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">Paso 4 de 4</p>
        <h2 className="mt-1 text-xl font-black [font-family:var(--font-display)] text-[var(--text-primary)]">Revisión</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5 flex flex-col gap-4 min-h-0">
        {/* Client */}
        <div className="rounded-2xl bg-[var(--surface)] p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">Cliente</p>
          {client ? (
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]">
                <span className="text-sm font-bold text-[var(--accent)]">{client.name[0].toUpperCase()}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{client.name}</p>
                {client.email && <p className="text-xs text-[var(--text-tertiary)]">{client.email}</p>}
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--text-tertiary)]">Sin cliente asignado</p>
          )}
        </div>

        {/* Items */}
        <div className="rounded-2xl bg-[var(--surface)] overflow-hidden">
          <p className="px-4 pt-4 pb-2 text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">Ítems ({items.length})</p>
          {items.map((item, i) => (
            <div key={i} className="flex items-center justify-between border-t border-[color-mix(in_oklab,var(--text-tertiary)_8%,transparent)] px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{item.name}</p>
                <p className="text-xs text-[var(--text-tertiary)]">{item.qty} × {fmt(item.unit_price_cents)}</p>
              </div>
              <span className="text-sm font-bold tabular-nums text-[var(--text-primary)]">{fmt(item.qty * item.unit_price_cents)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-[color-mix(in_oklab,var(--text-tertiary)_8%,transparent)] px-4 py-4 bg-[color-mix(in_oklab,var(--accent)_6%,transparent)]">
            <span className="text-base font-bold text-[var(--text-primary)]">Total</span>
            <span className="text-2xl font-black tabular-nums [font-family:var(--font-display)] text-[var(--accent)]">{fmt(total)}</span>
          </div>
        </div>
      </div>

      <div className="mt-auto border-t border-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)] p-5 flex flex-col gap-3">
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => onSave(false)} disabled={saving}
          className="flex h-13 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_30%,transparent)] text-base font-bold text-[var(--text-primary)] disabled:opacity-40">
          {saving ? 'Guardando…' : 'Guardar como borrador'}
        </motion.button>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => onSave(true)} disabled={saving || !client}
          className="flex h-13 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] text-base font-bold text-white [box-shadow:var(--shadow-cta)] disabled:opacity-40">
          {saving ? 'Guardando…' : 'Guardar y enviar'}
        </motion.button>
        {!client && <p className="text-center text-xs text-[var(--text-tertiary)]">Asigna un cliente para poder enviar</p>}
      </div>
    </div>
  )
}

/* ── Main flow ── */
export function NewQuoteFlow({
  clients: initialClients,
  priceBook,
  preselectedClient,
  businessId,
}: {
  clients: Client[]
  priceBook: PriceBookItem[]
  preselectedClient?: Client | null
  businessId: string
}) {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3 | 4>(preselectedClient ? 2 : 1)
  const [clients, setClients] = useState<Client[]>(initialClients)
  const [selectedClient, setSelectedClient] = useState<Client | null>(preselectedClient ?? null)
  const [items, setItems] = useState<QuoteItemDraft[]>([])
  const [saving, startSaving] = useTransition()

  function handleClientCreated(client: Client) {
    setClients(prev => [...prev, client])
    setSelectedClient(client)
    setStep(2)
  }

  function addItem(item: QuoteItemDraft) {
    setItems(prev => {
      const existing = prev.findIndex(i => i.price_book_item_id && i.price_book_item_id === item.price_book_item_id)
      if (existing >= 0) return prev.map((i, idx) => idx === existing ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, item]
    })
  }

  function addItems(newItems: QuoteItemDraft[]) {
    setItems(prev => {
      let next = [...prev]
      for (const item of newItems) {
        const existing = next.findIndex(i => i.price_book_item_id && i.price_book_item_id === item.price_book_item_id)
        if (existing >= 0) next = next.map((i, idx) => idx === existing ? { ...i, qty: i.qty + item.qty } : i)
        else next.push(item)
      }
      return next
    })
    setStep(3)
  }

  function removeItem(idx: number) { setItems(prev => prev.filter((_, i) => i !== idx)) }
  function changeQty(idx: number, qty: number) { setItems(prev => prev.map((i, n) => n === idx ? { ...i, qty } : i)) }

  function handleSave(send: boolean) {
    startSaving(async () => {
      const res = await createQuote(selectedClient?.id ?? null, items)
      if (res.error) { alert(res.error); return }
      router.push(`/app/quotes/${res.quoteId}${send ? '?action=send' : ''}`)
    })
  }

  const STEP_LABELS = ['Cliente', 'AI', 'Ítems', 'Revisión']

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg)]">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)] px-5">
        <button onClick={() => step === 1 ? router.back() : setStep(s => (s - 1) as 1 | 2 | 3 | 4)}
          className="flex size-9 items-center justify-center rounded-full hover:bg-[var(--surface)]">
          <ChevronLeft size={20} color="var(--text-secondary)" />
        </button>
        <div className="flex-1">
          <p className="text-sm font-bold text-[var(--text-primary)]">Nueva cotización</p>
          <p className="text-xs text-[var(--text-tertiary)]">{STEP_LABELS[step - 1]}</p>
        </div>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`h-1.5 rounded-full transition-all ${s === step ? 'w-5 bg-[var(--accent)]' : s < step ? 'w-1.5 bg-[var(--accent)]' : 'w-1.5 bg-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)]'}`} />
          ))}
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.div key={step} className="flex flex-1 flex-col overflow-hidden"
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
          transition={T}>
          {step === 1 && (
            <StepClient clients={clients} selected={selectedClient} onSelect={setSelectedClient} onNext={() => setStep(2)} onClientCreated={handleClientCreated} />
          )}
          {step === 2 && (
            <StepAI businessId={businessId} priceBook={priceBook} onItemsGenerated={addItems} onSkip={() => setStep(3)} />
          )}
          {step === 3 && (
            <StepItems priceBook={priceBook} items={items} onAdd={addItem} onRemove={removeItem} onQtyChange={changeQty} onNext={() => setStep(4)} />
          )}
          {step === 4 && (
            <StepReview client={selectedClient} items={items} onBack={() => setStep(3)} onSave={handleSave} saving={saving} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
