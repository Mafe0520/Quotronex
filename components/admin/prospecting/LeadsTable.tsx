'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Search, ChevronUp, ChevronDown, Mail, Globe,
  AlertTriangle, Users, Share2, Camera,
} from 'lucide-react'
import type { ProspectLead } from '@/app/actions/prospecting'

// ─── Constants ────────────────────────────────────────────────

const TRADES = ['painting', 'plumbing', 'electrical', 'hvac', 'pressure_washing', 'other']
const TRADE_LABELS: Record<string, string> = {
  painting: 'Painting', plumbing: 'Plumbing', electrical: 'Electrical',
  hvac: 'HVAC', pressure_washing: 'P.Washing', other: 'Other',
}
const TRADE_COLORS: Record<string, string> = {
  painting: 'bg-purple-500/15 text-purple-400',
  plumbing: 'bg-blue-500/15 text-blue-400',
  electrical: 'bg-amber-500/15 text-amber-400',
  hvac: 'bg-cyan-500/15 text-cyan-400',
  pressure_washing: 'bg-emerald-500/15 text-emerald-400',
  other: 'bg-white/8 text-white/50',
}
const STATUS_COLORS: Record<string, string> = {
  new: 'bg-white/8 text-white/40',
  researched: 'bg-blue-500/15 text-blue-400',
  ready: 'bg-violet-500/15 text-violet-400',
  contacted: 'bg-amber-500/15 text-amber-400',
  replied: 'bg-emerald-500/15 text-emerald-400',
  interested: 'bg-emerald-500/20 text-emerald-300',
  demo: 'bg-green-500/20 text-green-300',
  paid: 'bg-[#3ecf8e]/20 text-[#3ecf8e]',
  not_interested: 'bg-red-500/10 text-red-500/70',
  suppressed: 'bg-red-500/15 text-red-400',
}
const STATUS_LABELS: Record<string, string> = {
  new: 'New', researched: 'Researched', ready: 'Ready',
  contacted: 'Contacted', replied: 'Replied', interested: 'Interested',
  demo: 'Demo', paid: 'Paid', not_interested: 'Not Interested', suppressed: 'Suppressed',
}
const SIZE_LABELS: Record<string, string> = {
  solo: 'Solo', small_2_5: '2-5', medium_6_20: '6-20', unknown: '?',
}
const SW_LABELS: Record<string, string> = { yes: 'Yes', no: 'No', unknown: '?' }
const SW_COLORS: Record<string, string> = {
  yes: 'text-red-400', no: 'text-emerald-400', unknown: 'text-white/30',
}
const LANG_COLORS: Record<string, string> = {
  es: 'bg-emerald-500/15 text-emerald-400',
  bilingual: 'bg-teal-500/15 text-teal-400',
  en: 'bg-white/8 text-white/40',
  unknown: 'bg-white/5 text-white/25',
}
const SCORE_COLOR = (n: number) =>
  n >= 70 ? 'text-emerald-400' : n >= 40 ? 'text-amber-400' : 'text-red-400/60'

type SortKey = 'priority_score' | 'business_name' | 'outreach_status' | 'created_at'
type SortDir = 'asc' | 'desc'

interface Filters {
  q: string
  trade: string
  state: string
  language: string
  size: string
  software: string
  priority: string
  status: string
  hasEmail: boolean | null
  hasForm: boolean | null
  hasFacebook: boolean | null
  hasInstagram: boolean | null
  suppressed: boolean | null
}

const DEFAULT_FILTERS: Filters = {
  q: '', trade: '', state: '', language: '', size: '',
  software: '', priority: '', status: '',
  hasEmail: null, hasForm: null, hasFacebook: null, hasInstagram: null, suppressed: null,
}

// ─── Component ────────────────────────────────────────────────

export function ProspectLeadsTable({ leads }: { leads: ProspectLead[] }) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'priority_score', dir: 'desc' })

  function setF<K extends keyof Filters>(k: K, v: Filters[K]) {
    setFilters(f => ({ ...f, [k]: v }))
  }

  function toggleSort(key: SortKey) {
    setSort(s => s.key === key ? { key, dir: s.dir === 'desc' ? 'asc' : 'desc' } : { key, dir: 'desc' })
  }

  // Shortcut presets
  const shortcuts = [
    { label: '⚡ High Priority', fn: () => setFilters({ ...DEFAULT_FILTERS, priority: 'high' }) },
    { label: '✓ Ready to Contact', fn: () => setFilters({ ...DEFAULT_FILTERS, status: 'ready' }) },
    { label: '🌎 ES / Bilingual', fn: () => setFilters({ ...DEFAULT_FILTERS, language: 'es_bilingual' }) },
    { label: '🚫 No Software', fn: () => setFilters({ ...DEFAULT_FILTERS, software: 'no' }) },
    { label: '🔍 Needs Research', fn: () => setFilters({ ...DEFAULT_FILTERS, status: 'new' }) },
  ]

  const filtered = useMemo(() => {
    let r = leads

    if (filters.suppressed === false) r = r.filter(l => !l.is_suppressed)
    else if (filters.suppressed === true) r = r.filter(l => l.is_suppressed)

    if (filters.q) {
      const q = filters.q.toLowerCase()
      r = r.filter(l =>
        l.business_name.toLowerCase().includes(q) ||
        l.city?.toLowerCase().includes(q) ||
        l.state?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.trade?.toLowerCase().includes(q),
      )
    }
    if (filters.trade) r = r.filter(l => l.trade === filters.trade)
    if (filters.state) r = r.filter(l => l.state === filters.state)
    if (filters.language === 'es_bilingual') r = r.filter(l => l.language_signal === 'es' || l.language_signal === 'bilingual')
    else if (filters.language) r = r.filter(l => l.language_signal === filters.language)
    if (filters.size) r = r.filter(l => l.business_size === filters.size)
    if (filters.software) r = r.filter(l => l.uses_software === filters.software)
    if (filters.priority) r = r.filter(l => l.priority === filters.priority)
    if (filters.status) r = r.filter(l => l.outreach_status === filters.status)
    if (filters.hasEmail === true) r = r.filter(l => !!l.email)
    else if (filters.hasEmail === false) r = r.filter(l => !l.email)
    if (filters.hasForm === true) r = r.filter(l => !!l.has_contact_form)
    else if (filters.hasForm === false) r = r.filter(l => !l.has_contact_form)
    if (filters.hasFacebook === true) r = r.filter(l => !!l.facebook_url)
    else if (filters.hasFacebook === false) r = r.filter(l => !l.facebook_url)
    if (filters.hasInstagram === true) r = r.filter(l => !!l.instagram_url)
    else if (filters.hasInstagram === false) r = r.filter(l => !l.instagram_url)

    r = [...r].sort((a, b) => {
      let av: string | number = 0
      let bv: string | number = 0
      if (sort.key === 'priority_score') { av = a.priority_score ?? 0; bv = b.priority_score ?? 0 }
      else if (sort.key === 'business_name') { av = a.business_name; bv = b.business_name }
      else if (sort.key === 'outreach_status') { av = a.outreach_status; bv = b.outreach_status }
      else if (sort.key === 'created_at') { av = a.created_at; bv = b.created_at }

      if (av < bv) return sort.dir === 'asc' ? -1 : 1
      if (av > bv) return sort.dir === 'asc' ? 1 : -1
      return 0
    })

    return r
  }, [leads, filters, sort])

  // Collect unique states for filter
  const states = useMemo(() => [...new Set(leads.map(l => l.state).filter(Boolean))].sort(), [leads])

  function SortIcon({ k }: { k: SortKey }) {
    if (sort.key !== k) return <span className="opacity-20 text-[10px]">↕</span>
    return sort.dir === 'desc'
      ? <ChevronDown size={12} className="text-[#3ecf8e]" />
      : <ChevronUp size={12} className="text-[#3ecf8e]" />
  }

  const activeFiltersCount = Object.entries(filters).filter(([k, v]) =>
    k !== 'q' && v !== '' && v !== null && v !== DEFAULT_FILTERS[k as keyof Filters]
  ).length + (filters.q ? 1 : 0)

  return (
    <div className="space-y-4">
      {/* Shortcuts */}
      <div className="flex flex-wrap gap-2">
        {shortcuts.map(s => (
          <button key={s.label} onClick={s.fn}
            className="rounded-lg border border-white/8 bg-white/4 px-3 py-1.5 text-xs font-medium text-white/60 hover:bg-white/8 hover:text-white/90 transition-colors">
            {s.label}
          </button>
        ))}
        {activeFiltersCount > 0 && (
          <button onClick={() => setFilters(DEFAULT_FILTERS)}
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors">
            Clear {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#555]" />
          <input type="search" value={filters.q} onChange={e => setF('q', e.target.value)}
            placeholder="Search…"
            className="h-8 w-52 rounded-lg border border-white/10 bg-white/5 pl-8 pr-3 text-xs text-white placeholder:text-[#555] outline-none focus:border-[#3ecf8e]/40" />
        </div>

        <Select value={filters.trade} onChange={v => setF('trade', v)}
          label="Trade" options={[['', 'All trades'], ...TRADES.map(t => [t, TRADE_LABELS[t]] as [string, string])]} />

        <Select value={filters.state} onChange={v => setF('state', v)}
          label="State" options={[['', 'All states'], ...states.map(s => [s!, s!] as [string, string])]} />

        <Select value={filters.language} onChange={v => setF('language', v)}
          label="Lang" options={[
            ['', 'All'],
            ['es', 'Spanish'],
            ['bilingual', 'Bilingual'],
            ['es_bilingual', 'ES + Bilingual'],
            ['en', 'English'],
            ['unknown', 'Unknown'],
          ]} />

        <Select value={filters.size} onChange={v => setF('size', v)}
          label="Size" options={[
            ['', 'All sizes'],
            ['solo', 'Solo'],
            ['small_2_5', '2-5'],
            ['medium_6_20', '6-20'],
            ['unknown', 'Unknown'],
          ]} />

        <Select value={filters.software} onChange={v => setF('software', v)}
          label="Software" options={[['', 'All'], ['no', 'No software'], ['yes', 'Has software'], ['unknown', '?']]} />

        <Select value={filters.priority} onChange={v => setF('priority', v)}
          label="Priority" options={[['', 'All'], ['high', 'High'], ['medium', 'Medium'], ['low', 'Low']]} />

        <Select value={filters.status} onChange={v => setF('status', v)}
          label="Status" options={[
            ['', 'All status'],
            ['new', 'New'], ['researched', 'Researched'], ['ready', 'Ready'],
            ['contacted', 'Contacted'], ['replied', 'Replied'], ['interested', 'Interested'],
            ['demo', 'Demo'], ['paid', 'Paid'], ['not_interested', 'Not Interested'],
            ['suppressed', 'Suppressed'],
          ]} />

        {/* Toggle filters */}
        <ToggleFilter label="Has Email" value={filters.hasEmail} onChange={v => setF('hasEmail', v)} />
        <ToggleFilter label="Has Form" value={filters.hasForm} onChange={v => setF('hasForm', v)} />
        <ToggleFilter label="FB" value={filters.hasFacebook} onChange={v => setF('hasFacebook', v)} />
        <ToggleFilter label="IG" value={filters.hasInstagram} onChange={v => setF('hasInstagram', v)} />
        <ToggleFilter label="Suppressed" value={filters.suppressed} onChange={v => setF('suppressed', v)} />
      </div>

      {/* Count */}
      <p className="text-xs text-[#555]">
        {filtered.length} of {leads.length} leads
      </p>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-white/8">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-white/8 bg-white/3">
              <Th onClick={() => toggleSort('business_name')}>
                Business <SortIcon k="business_name" />
              </Th>
              <Th>Trade</Th>
              <Th>City / State</Th>
              <Th>Lang</Th>
              <Th>Email</Th>
              <Th>Channels</Th>
              <Th>Size</Th>
              <Th>SW</Th>
              <Th onClick={() => toggleSort('priority_score')}>
                Score <SortIcon k="priority_score" />
              </Th>
              <Th onClick={() => toggleSort('outreach_status')}>
                Status <SortIcon k="outreach_status" />
              </Th>
              <Th onClick={() => toggleSort('created_at')}>
                Added <SortIcon k="created_at" />
              </Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-[#555]">No leads match current filters</td>
              </tr>
            ) : filtered.map(lead => (
              <LeadRow key={lead.id} lead={lead} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Row ──────────────────────────────────────────────────────

function LeadRow({ lead }: { lead: ProspectLead }) {
  return (
    <tr className={[
      'border-b border-white/5 hover:bg-white/3 transition-colors',
      lead.is_suppressed ? 'opacity-40' : '',
    ].join(' ')}>
      <td className="px-3 py-2.5">
        <Link href={`/admin/prospecting/leads/${lead.id}`}
          className="font-semibold text-white hover:text-[#3ecf8e] transition-colors max-w-[180px] block truncate">
          {lead.business_name}
        </Link>
        {lead.is_suppressed && (
          <span className="flex items-center gap-1 text-red-400 text-[10px] mt-0.5">
            <AlertTriangle size={10} /> suppressed
          </span>
        )}
      </td>
      <td className="px-3 py-2.5">
        {lead.trade ? (
          <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${TRADE_COLORS[lead.trade] ?? 'bg-white/8 text-white/40'}`}>
            {TRADE_LABELS[lead.trade] ?? lead.trade}
          </span>
        ) : <span className="text-white/20">—</span>}
      </td>
      <td className="px-3 py-2.5 text-white/50 whitespace-nowrap">
        {lead.city && lead.state ? `${lead.city}, ${lead.state}` : lead.state ?? lead.city ?? '—'}
      </td>
      <td className="px-3 py-2.5">
        {lead.language_signal ? (
          <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${LANG_COLORS[lead.language_signal]}`}>
            {lead.language_signal === 'bilingual' ? 'Bi' : lead.language_signal?.toUpperCase()}
          </span>
        ) : <span className="text-white/20">—</span>}
      </td>
      <td className="px-3 py-2.5">
        {lead.email ? (
          <span title={lead.email} className="flex items-center gap-1">
            <Mail size={12} className={lead.email_origin === 'public_direct' ? 'text-emerald-400' : 'text-amber-400'} />
            <span className="text-white/50 max-w-[120px] truncate">{lead.email}</span>
          </span>
        ) : <span className="text-white/20">—</span>}
      </td>
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          {lead.has_contact_form && <Globe size={12} className="text-blue-400" aria-label="Contact form" />}
          {lead.facebook_url && <Share2 size={12} className="text-blue-500" aria-label="Facebook" />}
          {lead.instagram_url && <Camera size={12} className="text-pink-400" aria-label="Instagram" />}
          {!lead.has_contact_form && !lead.facebook_url && !lead.instagram_url &&
            <span className="text-white/20">—</span>}
        </div>
      </td>
      <td className="px-3 py-2.5">
        {lead.business_size ? (
          <span className="flex items-center gap-1 text-white/50">
            <Users size={10} />
            {SIZE_LABELS[lead.business_size] ?? lead.business_size}
          </span>
        ) : <span className="text-white/20">—</span>}
      </td>
      <td className="px-3 py-2.5">
        <span className={`text-[10px] font-semibold ${SW_COLORS[lead.uses_software ?? 'unknown']}`}>
          {SW_LABELS[lead.uses_software ?? 'unknown']}
        </span>
      </td>
      <td className="px-3 py-2.5 tabular-nums">
        {lead.is_suppressed ? (
          <span className="text-red-400/50">0</span>
        ) : lead.priority_score != null ? (
          <span className={`font-bold ${SCORE_COLOR(lead.priority_score)}`}>
            {lead.priority_score}
          </span>
        ) : <span className="text-white/20">—</span>}
      </td>
      <td className="px-3 py-2.5">
        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[lead.outreach_status] ?? 'bg-white/8 text-white/40'}`}>
          {STATUS_LABELS[lead.outreach_status] ?? lead.outreach_status}
        </span>
      </td>
      <td className="px-3 py-2.5 text-white/30 whitespace-nowrap">
        {fmtDate(lead.created_at)}
      </td>
    </tr>
  )
}

// ─── Sub-components ───────────────────────────────────────────

function Th({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <th
      className={[
        'px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-white/30',
        onClick ? 'cursor-pointer hover:text-white/60 select-none' : '',
      ].join(' ')}
      onClick={onClick}
    >
      <span className="flex items-center gap-1">{children}</span>
    </th>
  )
}

function Select({ value, onChange, label, options }: {
  value: string
  onChange: (v: string) => void
  label: string
  options: [string, string][]
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="h-8 rounded-lg border border-white/10 bg-[#131318] px-2 text-xs text-white/70 outline-none focus:border-[#3ecf8e]/40 cursor-pointer">
      {options.map(([v, l]) => <option key={v} value={v}>{l || label}</option>)}
    </select>
  )
}

function ToggleFilter({ label, value, onChange }: {
  label: string
  value: boolean | null
  onChange: (v: boolean | null) => void
}) {
  const states: (boolean | null)[] = [null, true, false]
  const labels = ['—', '✓', '✗']
  const colors = ['text-white/30', 'text-emerald-400', 'text-red-400/70']
  const idx = states.indexOf(value)
  const next = states[(idx + 1) % 3]

  return (
    <button onClick={() => onChange(next)}
      className={[
        'flex items-center gap-1 h-8 rounded-lg border px-2 text-xs transition-colors',
        value === true ? 'border-emerald-500/30 bg-emerald-500/10' :
        value === false ? 'border-red-500/20 bg-red-500/8' :
        'border-white/10 bg-white/4',
      ].join(' ')}>
      <span className="text-white/50">{label}</span>
      <span className={`font-bold ${colors[idx < 0 ? 0 : idx]}`}>{labels[idx < 0 ? 0 : idx]}</span>
    </button>
  )
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
