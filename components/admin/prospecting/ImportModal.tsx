'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, X, Download, CheckCircle, AlertTriangle } from 'lucide-react'
import { importLeadsFromPlaces, type ImportResult } from '@/app/actions/import-leads'

const TRADES: [string, string][] = [
  ['painting', 'Painting'],
  ['plumbing', 'Plumbing'],
  ['electrical', 'Electrical'],
  ['hvac', 'HVAC'],
  ['pressure_washing', 'Pressure Washing'],
  ['other', 'Other'],
]

const STATES = [
  'TX','FL','CA','NY','GA','NC','AZ','CO','IL','OH',
  'PA','WA','NV','TN','MN','MI','VA','NJ','SC','OR',
]

const COUNTS = [10, 20, 50]

const STATUS_COLORS = {
  new:        'text-emerald-400',
  duplicate:  'text-amber-400',
  suppressed: 'text-red-400',
  error:      'text-red-400/50',
}
const STATUS_ICONS = {
  new:        '✓',
  duplicate:  '≈',
  suppressed: '🚫',
  error:      '✗',
}

export function ImportModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [trade, setTrade] = useState('painting')
  const [state, setState] = useState('TX')
  const [city, setCity] = useState('')
  const [count, setCount] = useState(20)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleImport() {
    setLoading(true)
    setError(null)
    setResult(null)

    const res = await importLeadsFromPlaces({ trade, state, city: city.trim() || undefined, count })

    setLoading(false)

    if (res.error) { setError(res.error); return }
    if (res.result) setResult(res.result)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d0d14] shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-white">Import Leads</h2>
            <p className="text-xs text-[#555] mt-0.5">Google Places API</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {!result ? (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/50">Trade</label>
                <select value={trade} onChange={e => setTrade(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#131318] px-3 py-2 text-sm text-white/80 outline-none focus:border-[#3ecf8e]/40">
                  {TRADES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/50">State</label>
                  <select value={state} onChange={e => setState(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#131318] px-3 py-2 text-sm text-white/80 outline-none focus:border-[#3ecf8e]/40">
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/50">City (opcional)</label>
                  <input value={city} onChange={e => setCity(e.target.value)}
                    placeholder="Houston"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-[#444] outline-none focus:border-[#3ecf8e]/40" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/50">Cantidad de leads</label>
                <div className="flex gap-2">
                  {COUNTS.map(n => (
                    <button key={n} onClick={() => setCount(n)}
                      className={[
                        'flex-1 rounded-lg border py-2 text-sm font-semibold transition-colors',
                        count === n
                          ? 'border-[#3ecf8e]/40 bg-[#3ecf8e]/15 text-[#3ecf8e]'
                          : 'border-white/10 bg-white/4 text-white/50 hover:text-white/80',
                      ].join(' ')}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2.5 text-xs text-red-400">
                  <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              <button onClick={handleImport} disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#3ecf8e]/15 border border-[#3ecf8e]/30 py-2.5 text-sm font-semibold text-[#3ecf8e] hover:bg-[#3ecf8e]/25 disabled:opacity-40 disabled:cursor-not-allowed transition-colors mt-2">
                {loading
                  ? <><Loader2 size={14} className="animate-spin" /> Importando…</>
                  : <><Download size={14} /> Importar {count} leads</>}
              </button>

              {loading && (
                <p className="text-center text-xs text-[#555] animate-pulse">
                  Consultando Google Places y procesando resultados…
                </p>
              )}
            </>
          ) : (
            /* Result summary */
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-2 text-center">
                <Stat label="Total" value={result.total} color="text-white" />
                <Stat label="Nuevos" value={result.new} color="text-emerald-400" />
                <Stat label="Duplicados" value={result.duplicates} color="text-amber-400" />
                <Stat label="Suprimidos" value={result.suppressed} color="text-red-400" />
              </div>

              <div className="rounded-xl border border-white/8 bg-white/3 p-3 max-h-64 overflow-y-auto space-y-1">
                {result.leads.map((l, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className={`font-bold w-3 text-center ${STATUS_COLORS[l.status]}`}>
                      {STATUS_ICONS[l.status]}
                    </span>
                    <span className="text-white/60 truncate">{l.name}</span>
                  </div>
                ))}
              </div>

              {result.new > 0 && (
                <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs text-emerald-400">
                  <CheckCircle size={12} />
                  {result.new} lead{result.new !== 1 ? 's' : ''} nuevo{result.new !== 1 ? 's' : ''} agregado{result.new !== 1 ? 's' : ''}
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => { router.refresh(); onClose() }}
                  className="flex-1 rounded-lg bg-[#3ecf8e]/15 border border-[#3ecf8e]/30 py-2 text-sm font-semibold text-[#3ecf8e] hover:bg-[#3ecf8e]/25 transition-colors">
                  Ver leads
                </button>
                <button onClick={() => { setResult(null); setError(null) }}
                  className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/50 hover:text-white/80 transition-colors">
                  Otro import
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border border-white/8 bg-white/3 p-2">
      <div className={`text-xl font-black tabular-nums ${color}`}>{value}</div>
      <div className="text-[10px] text-[#555] mt-0.5">{label}</div>
    </div>
  )
}
