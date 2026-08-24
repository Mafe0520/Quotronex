'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react'
import { createProspectLead } from '@/app/actions/prospecting'

const TRADES: [string, string][] = [
  ['', '— Select trade —'],
  ['painting', 'Painting'],
  ['plumbing', 'Plumbing'],
  ['electrical', 'Electrical'],
  ['hvac', 'HVAC'],
  ['pressure_washing', 'Pressure Washing'],
  ['other', 'Other'],
]
const LANGUAGES: [string, string][] = [
  ['', '— Unknown —'],
  ['en', 'English'],
  ['es', 'Spanish'],
  ['bilingual', 'Bilingual'],
]
const SIZES: [string, string][] = [
  ['', '— Unknown —'],
  ['solo', 'Solo operator'],
  ['small_2_5', '2-5 employees'],
  ['medium_6_20', '6-20 employees'],
]
const SOFTWARE: [string, string][] = [
  ['', '— Unknown —'],
  ['no', 'No software'],
  ['yes', 'Has software'],
]
const WEBSITE_QUALITY: [string, string][] = [
  ['', '— Unknown —'],
  ['none', 'No website'],
  ['outdated', 'Outdated'],
  ['modern', 'Modern'],
]
const EMAIL_ORIGIN: [string, string][] = [
  ['', '— None —'],
  ['public_direct', 'Public (found on site/GMB)'],
  ['manual', 'Manual (asked/verified)'],
]

type F = {
  business_name: string
  trade: string
  city: string
  state: string
  website: string
  email: string
  email_origin: string
  facebook_url: string
  instagram_url: string
  tiktok_url: string
  phone_public: string
  has_contact_form: string
  contact_form_url: string
  language_signal: string
  business_size: string
  uses_software: string
  website_quality: string
  notes: string
}

const EMPTY: F = {
  business_name: '', trade: '', city: '', state: '', website: '',
  email: '', email_origin: '', facebook_url: '', instagram_url: '', tiktok_url: '',
  phone_public: '', has_contact_form: '', contact_form_url: '',
  language_signal: '', business_size: '', uses_software: '', website_quality: '', notes: '',
}

export function NewLeadForm() {
  const router = useRouter()
  const [f, setF] = useState<F>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ type: 'duplicate' | 'error'; message: string } | null>(null)

  function set(k: keyof F, v: string) {
    setF(prev => ({ ...prev, [k]: v }))
    setResult(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!f.business_name.trim()) return
    setSaving(true)
    setResult(null)

    const res = await createProspectLead({
      business_name:  f.business_name,
      trade:          f.trade || undefined,
      city:           f.city || undefined,
      state:          f.state || undefined,
      website:        f.website || undefined,
      email:          f.email || undefined,
      email_origin:   f.email_origin || undefined,
      facebook_url:   f.facebook_url || undefined,
      instagram_url:  f.instagram_url || undefined,
      tiktok_url:     f.tiktok_url || undefined,
      phone_public:   f.phone_public || undefined,
      has_contact_form: f.has_contact_form === 'yes' ? true : f.has_contact_form === 'no' ? false : undefined,
      contact_form_url: f.contact_form_url || undefined,
      language_signal: f.language_signal || undefined,
      business_size:  f.business_size || undefined,
      uses_software:  f.uses_software || undefined,
      website_quality: f.website_quality || undefined,
      notes:          f.notes || undefined,
    })

    setSaving(false)

    if (res.error) {
      setResult({ type: 'error', message: res.error })
      return
    }

    if (res.duplicate) {
      setResult({ type: 'duplicate', message: 'Lead ya existe (dedup). Redirigiendo…' })
      setTimeout(() => router.push(`/admin/prospecting/leads/${res.id}`), 1200)
      return
    }

    router.push(`/admin/prospecting/leads/${res.id}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">

      {result && (
        <div className={[
          'flex items-start gap-2 rounded-lg border px-4 py-3 text-sm',
          result.type === 'error'
            ? 'border-red-500/25 bg-red-500/10 text-red-400'
            : 'border-amber-500/25 bg-amber-500/10 text-amber-400',
        ].join(' ')}>
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          {result.message}
        </div>
      )}

      {/* Identidad */}
      <Fieldset title="Identidad del negocio">
        <Field label="Nombre del negocio *">
          <input required value={f.business_name} onChange={e => set('business_name', e.target.value)}
            placeholder="Lopez Electric LLC"
            className={INPUT} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Trade">
            <Select value={f.trade} onChange={v => set('trade', v)} options={TRADES} />
          </Field>
          <Field label="Language">
            <Select value={f.language_signal} onChange={v => set('language_signal', v)} options={LANGUAGES} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="City">
            <input value={f.city} onChange={e => set('city', e.target.value)}
              placeholder="Houston" className={INPUT} />
          </Field>
          <Field label="State (2 letters)">
            <input value={f.state} onChange={e => set('state', e.target.value.toUpperCase())}
              placeholder="TX" maxLength={2} className={INPUT} />
          </Field>
        </div>
      </Fieldset>

      {/* Email */}
      <Fieldset title="Email">
        <Field label="Email">
          <input type="email" value={f.email} onChange={e => set('email', e.target.value)}
            placeholder="owner@example.com" className={INPUT} />
        </Field>
        <Field label="Origen del email">
          <Select value={f.email_origin} onChange={v => set('email_origin', v)} options={EMAIL_ORIGIN} />
        </Field>
      </Fieldset>

      {/* Web y canales */}
      <Fieldset title="Web y canales">
        <Field label="Website">
          <input value={f.website} onChange={e => set('website', e.target.value)}
            placeholder="https://example.com" className={INPUT} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="¿Tiene contact form?">
            <Select value={f.has_contact_form} onChange={v => set('has_contact_form', v)}
              options={[['', '— Unknown —'], ['yes', 'Yes'], ['no', 'No']]} />
          </Field>
          <Field label="Contact form URL">
            <input value={f.contact_form_url} onChange={e => set('contact_form_url', e.target.value)}
              placeholder="https://…/contact" className={INPUT} />
          </Field>
        </div>
        <Field label="Facebook URL">
          <input value={f.facebook_url} onChange={e => set('facebook_url', e.target.value)}
            placeholder="https://facebook.com/…" className={INPUT} />
        </Field>
        <Field label="Instagram URL">
          <input value={f.instagram_url} onChange={e => set('instagram_url', e.target.value)}
            placeholder="https://instagram.com/…" className={INPUT} />
        </Field>
        <Field label="TikTok URL">
          <input value={f.tiktok_url} onChange={e => set('tiktok_url', e.target.value)}
            placeholder="https://tiktok.com/@…" className={INPUT} />
        </Field>
        <Field label="Teléfono (solo informativo — no contactar)">
          <input value={f.phone_public} onChange={e => set('phone_public', e.target.value)}
            placeholder="+1 555 000 0000" className={INPUT} />
        </Field>
      </Fieldset>

      {/* Business signals */}
      <Fieldset title="Señales del negocio">
        <div className="grid grid-cols-3 gap-4">
          <Field label="Tamaño">
            <Select value={f.business_size} onChange={v => set('business_size', v)} options={SIZES} />
          </Field>
          <Field label="Usa software">
            <Select value={f.uses_software} onChange={v => set('uses_software', v)} options={SOFTWARE} />
          </Field>
          <Field label="Calidad del sitio">
            <Select value={f.website_quality} onChange={v => set('website_quality', v)} options={WEBSITE_QUALITY} />
          </Field>
        </div>
      </Fieldset>

      {/* Notes */}
      <Fieldset title="Notas internas">
        <textarea value={f.notes} onChange={e => set('notes', e.target.value)}
          rows={4} placeholder="Contexto de la investigación, observaciones…"
          className={`${INPUT} resize-none`} />
      </Fieldset>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={saving || !f.business_name.trim()}
          className="flex items-center gap-2 rounded-lg bg-[#3ecf8e]/15 border border-[#3ecf8e]/30 px-5 py-2.5 text-sm font-semibold text-[#3ecf8e] hover:bg-[#3ecf8e]/25 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
          {saving ? 'Guardando…' : 'Crear lead'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-white/50 hover:text-white/80 transition-colors">
          Cancelar
        </button>
      </div>
    </form>
  )
}

// ─── Helpers ──────────────────────────────────────────────────

const INPUT = 'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-[#444] outline-none focus:border-[#3ecf8e]/40 transition-colors'

function Fieldset({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-[10px] font-bold uppercase tracking-widest text-white/30">{title}</h2>
      <div className="rounded-xl border border-white/8 bg-white/2 p-4 space-y-4">
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-white/50">{label}</label>
      {children}
    </div>
  )
}

function Select({ value, onChange, options }: {
  value: string
  onChange: (v: string) => void
  options: [string, string][]
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full rounded-lg border border-white/10 bg-[#131318] px-3 py-2 text-sm text-white/70 outline-none focus:border-[#3ecf8e]/40 cursor-pointer">
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  )
}
