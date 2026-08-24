'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Mail, Globe, Phone, ExternalLink,
  AlertTriangle, Star, Plus, Loader2, Share2, Camera, Search,
} from 'lucide-react'
import {
  transitionLeadStatus,
  addLeadActivity,
  suppressLead,
  updateLeadNotes,
} from '@/app/actions/prospecting'
import { scrapeEmailFromWebsite } from '@/app/actions/scrape-email'
import type { ProspectLead, ProspectSource, ProspectActivity } from '@/app/actions/prospecting'

// ─── Constants ────────────────────────────────────────────────

const TRANSITIONS: Record<string, string[]> = {
  new:           ['researched', 'not_interested'],
  researched:    ['ready', 'not_interested'],
  ready:         ['contacted', 'not_interested'],
  contacted:     ['replied', 'not_interested'],
  replied:       ['interested', 'not_interested'],
  interested:    ['demo', 'not_interested'],
  demo:          ['paid', 'not_interested'],
  paid:          [],
  not_interested: [],
  suppressed:    [],
}

const STATUS_LABELS: Record<string, string> = {
  new: 'New', researched: 'Researched', ready: 'Ready',
  contacted: 'Contacted', replied: 'Replied', interested: 'Interested',
  demo: 'Demo', paid: 'Paid', not_interested: 'Not Interested', suppressed: 'Suppressed',
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
const ACTIVITY_ICONS: Record<string, string> = {
  note: '📝', email_sent: '📤', email_replied: '📥', dm_facebook: '💬',
  dm_instagram: '📸', contact_form_submitted: '📋', community_mention: '🏘️',
  referral_contact: '🤝', research_note: '🔍', status_change: '🔄',
  suppression_added: '🚫',
}
const ACTIVITY_TYPES = [
  ['note', '📝 Note'],
  ['research_note', '🔍 Research note'],
  ['email_sent', '📤 Email sent'],
  ['email_replied', '📥 Email replied'],
  ['dm_facebook', '💬 DM Facebook'],
  ['dm_instagram', '📸 DM Instagram'],
  ['contact_form_submitted', '📋 Contact form submitted'],
  ['community_mention', '🏘️ Community mention'],
  ['referral_contact', '🤝 Referral contact'],
]
const SUPPRESSION_TYPES = [
  ['email', 'Email'],
  ['domain', 'Domain'],
  ['facebook_url', 'Facebook URL'],
  ['instagram_url', 'Instagram URL'],
  ['business_name_city', 'Business Name + City'],
]
const SUPPRESSION_REASONS = [
  'opted_out', 'do_not_contact', 'competitor', 'already_customer', 'bad_fit', 'other',
]
const SCORE_COLOR = (n: number) =>
  n >= 70 ? 'text-emerald-400' : n >= 40 ? 'text-amber-400' : 'text-red-400/60'
const ORIGIN_LABEL: Record<string, string> = {
  public_direct: 'Public (direct)', enriched_provider: 'Enriched', manual: 'Manual',
}

// ─── Main component ───────────────────────────────────────────

export function ProspectLeadDetail({ lead, sources, activities: initialActivities }: {
  lead: ProspectLead
  sources: ProspectSource[]
  activities: ProspectActivity[]
}) {
  const [activities, setActivities] = useState(initialActivities)
  const [currentLead, setCurrentLead] = useState(lead)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Notes editing state
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesValue, setNotesValue] = useState(lead.notes ?? '')
  const [notesSaving, setNotesSaving] = useState(false)

  // Activity form state
  const [activityType, setActivityType] = useState('note')
  const [activityContent, setActivityContent] = useState('')
  const [activityUrl, setActivityUrl] = useState('')
  const [addingActivity, setAddingActivity] = useState(false)

  // Suppression form state
  const [showSuppress, setShowSuppress] = useState(false)
  const [suppressType, setSuppressType] = useState('email')
  const [suppressValue, setSuppressValue] = useState('')
  const [suppressReason, setSuppressReason] = useState('do_not_contact')
  const [suppressNotes, setSuppressNotes] = useState('')
  const [suppressing, setSuppressing] = useState(false)
  const [scrapingEmail, setScrapingEmail] = useState(false)
  const [scrapeMsg, setScrapeMsg] = useState<string | null>(null)

  function handleTransition(newStatus: string) {
    setError(null)
    startTransition(async () => {
      const result = await transitionLeadStatus(currentLead.id, newStatus)
      if (result.error) { setError(result.error); return }
      setCurrentLead(l => ({ ...l, outreach_status: newStatus }))
    })
  }

  async function handleAddActivity() {
    if (!activityContent.trim()) return
    setAddingActivity(true)
    setError(null)
    const result = await addLeadActivity(
      currentLead.id, activityType, activityContent.trim(),
      activityUrl.trim() || undefined,
    )
    setAddingActivity(false)
    if (result.error) { setError(result.error); return }
    const newAct: ProspectActivity = {
      id: crypto.randomUUID(),
      type: activityType,
      content: activityContent.trim(),
      channel_url: activityUrl.trim() || null,
      old_status: null,
      new_status: null,
      created_at: new Date().toISOString(),
    }
    setActivities(a => [newAct, ...a])
    setActivityContent('')
    setActivityUrl('')
  }

  async function handleSaveNotes() {
    setNotesSaving(true)
    const result = await updateLeadNotes(currentLead.id, notesValue)
    setNotesSaving(false)
    if (result.error) { setError(result.error); return }
    setCurrentLead(l => ({ ...l, notes: notesValue }))
    setEditingNotes(false)
  }

  async function handleSuppress() {
    if (!suppressValue.trim()) return
    setSuppressing(true)
    setError(null)
    const result = await suppressLead(
      currentLead.id, suppressType, suppressValue.trim(),
      suppressReason, suppressNotes.trim() || undefined,
    )
    setSuppressing(false)
    if (result.error) { setError(result.error); return }
    setCurrentLead(l => ({ ...l, is_suppressed: true, outreach_status: 'suppressed' }))
    setShowSuppress(false)
  }

  async function handleScrapeEmail() {
    if (!currentLead.website) return
    setScrapingEmail(true)
    setScrapeMsg(null)
    const res = await scrapeEmailFromWebsite(currentLead.id, currentLead.website)
    setScrapingEmail(false)
    if (res.email) {
      setCurrentLead(l => ({ ...l, email: res.email!, email_origin: 'public_direct' }))
      setScrapeMsg(`✓ Encontrado: ${res.email}`)
    } else {
      setScrapeMsg(`No encontrado: ${res.error}`)
    }
  }

  const allowed = TRANSITIONS[currentLead.outreach_status] ?? []
  const isSuppressed = currentLead.is_suppressed

  return (
    <div className="mx-auto max-w-5xl p-8 space-y-6">
      {/* Back */}
      <Link href="/admin/prospecting/leads"
        className="inline-flex items-center gap-1.5 text-sm text-[#555] hover:text-white/80 transition-colors">
        <ArrowLeft size={14} /> All leads
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-black text-white">{currentLead.business_name}</h1>
            <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[currentLead.outreach_status]}`}>
              {STATUS_LABELS[currentLead.outreach_status] ?? currentLead.outreach_status}
            </span>
            {isSuppressed && (
              <span className="flex items-center gap-1 rounded-md bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-400">
                <AlertTriangle size={12} /> Suppressed
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-[#555]">
            {[currentLead.city, currentLead.state].filter(Boolean).join(', ')}
            {currentLead.trade && ` · ${currentLead.trade}`}
          </p>
        </div>

        {/* Status transitions */}
        {!isSuppressed && allowed.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allowed.map(next => (
              <button key={next} onClick={() => handleTransition(next)}
                disabled={isPending}
                className={[
                  'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors',
                  next === 'not_interested'
                    ? 'border-red-500/25 bg-red-500/8 text-red-400 hover:bg-red-500/15'
                    : 'border-[#3ecf8e]/30 bg-[#3ecf8e]/10 text-[#3ecf8e] hover:bg-[#3ecf8e]/20',
                  isPending ? 'opacity-50 cursor-not-allowed' : '',
                ].join(' ')}>
                {isPending ? <Loader2 size={12} className="animate-spin inline mr-1" /> : null}
                → {STATUS_LABELS[next] ?? next}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Two-column grid */}
      <div className="grid grid-cols-[1fr_340px] gap-6 items-start">

        {/* Left column */}
        <div className="space-y-6">

          {/* Contact channels */}
          <Section title="Contact Channels">
            <dl className="space-y-2 text-sm">
              <Row label="Email">
                {currentLead.email ? (
                  <span className="flex items-center gap-1.5 flex-wrap">
                    <Mail size={13} className={currentLead.email_origin === 'public_direct' ? 'text-emerald-400' : 'text-amber-400'} />
                    <span className="text-white">{currentLead.email}</span>
                    <span className="text-[#555] text-xs">
                      ({ORIGIN_LABEL[currentLead.email_origin ?? ''] ?? currentLead.email_origin})
                    </span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2 flex-wrap">
                    <Empty />
                    {currentLead.website && !isSuppressed && (
                      <button onClick={handleScrapeEmail} disabled={scrapingEmail}
                        className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/50 hover:text-white/80 hover:bg-white/8 disabled:opacity-40 transition-colors">
                        {scrapingEmail ? <Loader2 size={10} className="animate-spin" /> : <Search size={10} />}
                        {scrapingEmail ? 'Buscando…' : 'Find email'}
                      </button>
                    )}
                    {scrapeMsg && (
                      <span className={`text-[10px] ${scrapeMsg.startsWith('✓') ? 'text-emerald-400' : 'text-red-400/70'}`}>
                        {scrapeMsg}
                      </span>
                    )}
                  </span>
                )}
              </Row>
              <Row label="Website">
                {currentLead.website ? (
                  <a href={currentLead.website} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 max-w-full">
                    <Globe size={12} className="shrink-0" />
                    <span className="truncate">{hostname(currentLead.website)}</span>
                  </a>
                ) : <Empty />}
              </Row>
              <Row label="Contact form">
                {currentLead.contact_form_url ? (
                  <a href={currentLead.contact_form_url} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 max-w-full">
                    <ExternalLink size={12} className="shrink-0" /> <span className="truncate">{hostname(currentLead.contact_form_url)}</span>
                  </a>
                ) : currentLead.has_contact_form ? (
                  <span className="text-emerald-400/70 text-xs">Yes (URL unknown)</span>
                ) : <Empty />}
              </Row>
              <Row label="Facebook">
                {currentLead.facebook_url ? (
                  <a href={currentLead.facebook_url} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-400 max-w-full">
                    <Share2 size={12} className="shrink-0" /> <span className="truncate">{hostname(currentLead.facebook_url!)}</span>
                  </a>
                ) : <Empty />}
              </Row>
              <Row label="Instagram">
                {currentLead.instagram_url ? (
                  <a href={currentLead.instagram_url} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1 text-pink-400 hover:text-pink-300 max-w-full">
                    <Camera size={12} className="shrink-0" /> <span className="truncate">{hostname(currentLead.instagram_url!)}</span>
                  </a>
                ) : <Empty />}
              </Row>
              {currentLead.tiktok_url && (
                <Row label="TikTok">
                  <a href={currentLead.tiktok_url} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1 text-white/60 hover:text-white/80">
                    <ExternalLink size={12} /> {currentLead.tiktok_url}
                  </a>
                </Row>
              )}
              {currentLead.phone_public && (
                <Row label="Phone (info only)">
                  <span className="flex items-center gap-1 text-white/40 text-xs">
                    <Phone size={11} /> {currentLead.phone_public}
                    <span className="text-[#444]">— informational, no contact</span>
                  </span>
                </Row>
              )}
            </dl>
          </Section>

          {/* Business signals */}
          <Section title="Business Signals">
            <dl className="space-y-2 text-sm">
              <Row label="Language">{currentLead.language_signal ?? <Empty />}</Row>
              <Row label="Size">{currentLead.business_size ?? <Empty />}</Row>
              <Row label="Size signals">
                {currentLead.business_size_signals
                  ? <span className="text-white/60 text-xs">{currentLead.business_size_signals}</span>
                  : <Empty />}
              </Row>
              <Row label="Uses software">{currentLead.uses_software ?? <Empty />}</Row>
              <Row label="Software signals">
                {currentLead.uses_software_signals
                  ? <span className="text-white/60 text-xs">{currentLead.uses_software_signals}</span>
                  : <Empty />}
              </Row>
              <Row label="Website quality">{currentLead.website_quality ?? <Empty />}</Row>
            </dl>
          </Section>

          {/* Notes */}
          <Section title="Notes" action={
            !editingNotes ? (
              <button onClick={() => setEditingNotes(true)}
                className="text-xs text-[#3ecf8e] hover:text-[#3ecf8e]/80">Edit</button>
            ) : null
          }>
            {editingNotes ? (
              <div className="space-y-2">
                <textarea
                  value={notesValue}
                  onChange={e => setNotesValue(e.target.value)}
                  rows={5}
                  className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white placeholder:text-[#555] outline-none focus:border-[#3ecf8e]/40 resize-none"
                />
                <div className="flex gap-2">
                  <button onClick={handleSaveNotes} disabled={notesSaving}
                    className="rounded-lg bg-[#3ecf8e]/15 border border-[#3ecf8e]/30 px-3 py-1.5 text-xs font-semibold text-[#3ecf8e] hover:bg-[#3ecf8e]/25 disabled:opacity-50">
                    {notesSaving ? 'Saving…' : 'Save'}
                  </button>
                  <button onClick={() => { setEditingNotes(false); setNotesValue(currentLead.notes ?? '') }}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/50 hover:text-white/80">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-white/60 whitespace-pre-wrap">
                {currentLead.notes || <span className="text-[#444]">No notes yet.</span>}
              </p>
            )}
          </Section>

          {/* Activity log */}
          <Section title="Activity Log">
            {/* Add activity */}
            {!isSuppressed && (
              <div className="mb-4 rounded-xl border border-white/8 bg-white/3 p-4 space-y-3">
                <div className="flex gap-2">
                  <select value={activityType} onChange={e => setActivityType(e.target.value)}
                    className="h-8 rounded-lg border border-white/10 bg-[#131318] px-2 text-xs text-white/70 outline-none">
                    {ACTIVITY_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <textarea
                  value={activityContent}
                  onChange={e => setActivityContent(e.target.value)}
                  placeholder="Content / notes…"
                  rows={3}
                  className="w-full rounded-lg border border-white/10 bg-white/5 p-2.5 text-xs text-white placeholder:text-[#555] outline-none focus:border-[#3ecf8e]/40 resize-none"
                />
                {['dm_facebook', 'dm_instagram', 'community_mention', 'contact_form_submitted', 'referral_contact'].includes(activityType) && (
                  <input
                    value={activityUrl}
                    onChange={e => setActivityUrl(e.target.value)}
                    placeholder="URL (optional)"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-[#555] outline-none focus:border-[#3ecf8e]/40"
                  />
                )}
                <button onClick={handleAddActivity} disabled={addingActivity || !activityContent.trim()}
                  className="flex items-center gap-1.5 rounded-lg bg-[#3ecf8e]/15 border border-[#3ecf8e]/30 px-3 py-1.5 text-xs font-semibold text-[#3ecf8e] hover:bg-[#3ecf8e]/25 disabled:opacity-40 disabled:cursor-not-allowed">
                  {addingActivity ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                  Log activity
                </button>
              </div>
            )}

            {/* Activity list */}
            <div className="space-y-2">
              {activities.length === 0 && (
                <p className="text-sm text-[#444]">No activities yet.</p>
              )}
              {activities.map(act => (
                <div key={act.id} className="flex gap-3 text-xs">
                  <span className="mt-0.5 text-base leading-none">{ACTIVITY_ICONS[act.type] ?? '•'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white/70">{act.type.replace(/_/g, ' ')}</span>
                      <span className="text-[#555]">{fmtDatetime(act.created_at)}</span>
                    </div>
                    {act.type === 'status_change' && act.old_status && act.new_status ? (
                      <p className="text-white/50 mt-0.5">
                        {STATUS_LABELS[act.old_status]} → {STATUS_LABELS[act.new_status]}
                      </p>
                    ) : act.content ? (
                      <p className="text-white/50 mt-0.5 whitespace-pre-wrap">{act.content}</p>
                    ) : null}
                    {act.channel_url && (
                      <a href={act.channel_url} target="_blank" rel="noreferrer"
                        className="text-blue-400/70 hover:text-blue-400 inline-flex items-center gap-0.5 mt-0.5">
                        <ExternalLink size={10} /> {act.channel_url}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* Right column */}
        <div className="space-y-4 sticky top-8">

          {/* Score */}
          <Section title="Priority Score">
            <div className="text-center py-2">
              <div className={`text-4xl font-black tabular-nums ${isSuppressed ? 'text-red-400/40' : SCORE_COLOR(currentLead.priority_score ?? 0)}`}>
                {isSuppressed ? '0' : (currentLead.priority_score ?? '—')}
              </div>
              <div className="text-xs text-[#555] mt-1 capitalize">{currentLead.priority} priority</div>
            </div>
            {currentLead.score_signals?.length > 0 && (
              <ul className="mt-3 space-y-1">
                {currentLead.score_signals.map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-white/50">
                    <Star size={10} className="text-amber-400/60 mt-0.5 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* Tags */}
          {currentLead.internal_tags?.length > 0 && (
            <Section title="Tags">
              <div className="flex flex-wrap gap-1.5">
                {currentLead.internal_tags.map(t => (
                  <span key={t} className="rounded-md bg-white/8 px-2 py-0.5 text-[10px] text-white/50">{t}</span>
                ))}
              </div>
            </Section>
          )}

          {/* Timeline */}
          <Section title="Timeline">
            <dl className="space-y-1.5 text-xs">
              <Row label="Added">{fmtDatetime(currentLead.created_at)}</Row>
              <Row label="Updated">{fmtDatetime(currentLead.updated_at)}</Row>
              {currentLead.contacted_at && <Row label="Contacted">{fmtDatetime(currentLead.contacted_at)}</Row>}
              {currentLead.last_activity_at && <Row label="Last activity">{fmtDatetime(currentLead.last_activity_at)}</Row>}
            </dl>
          </Section>

          {/* Sources */}
          {sources.length > 0 && (
            <Section title={`Sources (${sources.length})`}>
              <div className="space-y-2">
                {sources.map(s => (
                  <div key={s.id} className="rounded-lg border border-white/8 bg-white/3 p-2.5 text-xs space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-white/70">{s.source_type}</span>
                      {s.provider && <span className="text-[#555]">via {s.provider}</span>}
                    </div>
                    {s.source_url && (
                      <a href={s.source_url} target="_blank" rel="noreferrer"
                        className="text-blue-400/60 hover:text-blue-400 inline-flex items-center gap-0.5">
                        <ExternalLink size={9} /> source
                      </a>
                    )}
                    {s.raw_business_name && s.raw_business_name !== currentLead.business_name && (
                      <div className="text-[#555]">Raw name: {s.raw_business_name}</div>
                    )}
                    <div className="text-[#555]">{fmtDate(s.collected_at)}</div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Suppression */}
          {!isSuppressed ? (
            <div>
              {!showSuppress ? (
                <button onClick={() => setShowSuppress(true)}
                  className="w-full rounded-lg border border-red-500/20 bg-red-500/8 px-3 py-2 text-xs font-semibold text-red-400/80 hover:bg-red-500/15 transition-colors">
                  <AlertTriangle size={12} className="inline mr-1" />
                  Suppress this lead
                </button>
              ) : (
                <div className="rounded-xl border border-red-500/25 bg-red-500/8 p-4 space-y-3">
                  <p className="text-xs font-semibold text-red-400">Suppress Lead</p>
                  <select value={suppressType} onChange={e => setSuppressType(e.target.value)}
                    className="w-full h-8 rounded-lg border border-white/10 bg-[#131318] px-2 text-xs text-white/70 outline-none">
                    {SUPPRESSION_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <input
                    value={suppressValue}
                    onChange={e => setSuppressValue(e.target.value)}
                    placeholder={suppressType === 'email' ? currentLead.email ?? 'email@example.com' : 'value'}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-[#555] outline-none focus:border-red-400/40"
                  />
                  <select value={suppressReason} onChange={e => setSuppressReason(e.target.value)}
                    className="w-full h-8 rounded-lg border border-white/10 bg-[#131318] px-2 text-xs text-white/70 outline-none">
                    {SUPPRESSION_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <textarea
                    value={suppressNotes}
                    onChange={e => setSuppressNotes(e.target.value)}
                    placeholder="Notes (optional)"
                    rows={2}
                    className="w-full rounded-lg border border-white/10 bg-white/5 p-2 text-xs text-white placeholder:text-[#555] outline-none resize-none focus:border-red-400/40"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleSuppress} disabled={suppressing || !suppressValue.trim()}
                      className="rounded-lg bg-red-500/20 border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/30 disabled:opacity-40 disabled:cursor-not-allowed">
                      {suppressing ? 'Suppressing…' : 'Confirm suppress'}
                    </button>
                    <button onClick={() => setShowSuppress(false)}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:text-white/80">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-xs text-red-400 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertTriangle size={12} /> Lead is suppressed
              </div>
              <p className="text-red-400/60">No outreach actions available. This suppression is permanent and applies to all matching identifiers.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────

function Section({ title, children, action }: {
  title: string; children: React.ReactNode; action?: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/2 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-white/30">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-2 items-baseline">
      <dt className="text-[#555] text-xs shrink-0">{label}</dt>
      <dd className="text-white/70 min-w-0 overflow-hidden">{children}</dd>
    </div>
  )
}

function Empty() {
  return <span className="text-[#333]">—</span>
}

function hostname(url: string) {
  try { return new URL(url).hostname.replace('www.', '') } catch { return url }
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtDatetime(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}
