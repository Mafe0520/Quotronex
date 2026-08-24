'use server'

import { requireAdmin } from '@/lib/admin/require-admin'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// ─── Types ────────────────────────────────────────────────────

export type ProspectLead = {
  id: string
  business_name: string
  trade: string | null
  city: string | null
  state: string | null
  website: string | null
  contact_form_url: string | null
  has_contact_form: boolean | null
  email: string | null
  email_origin: string | null
  email_provider: string | null
  email_source_url: string | null
  email_collected_at: string | null
  email_last_verified_at: string | null
  phone_public: string | null
  phone_source: string | null
  facebook_url: string | null
  instagram_url: string | null
  tiktok_url: string | null
  linkedin_url: string | null
  google_business_url: string | null
  language_signal: string | null
  language_confidence: number | null
  business_size: string | null
  business_size_signals: string | null
  uses_software: string | null
  uses_software_signals: string | null
  website_quality: string | null
  priority: string
  priority_score: number | null
  score_signals: string[]
  outreach_status: string
  is_suppressed: boolean
  contacted_at: string | null
  last_activity_at: string | null
  notes: string | null
  internal_tags: string[]
  created_at: string
  updated_at: string
}

export type ProspectSource = {
  id: string
  source_type: string
  source_url: string | null
  provider: string | null
  raw_business_name: string | null
  raw_email: string | null
  raw_phone: string | null
  raw_address: string | null
  raw_website: string | null
  collected_at: string
}

export type ProspectActivity = {
  id: string
  type: string
  content: string | null
  channel_url: string | null
  old_status: string | null
  new_status: string | null
  created_at: string
}

// ─── Valid status transitions ─────────────────────────────────

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

// ─── Queries ──────────────────────────────────────────────────

export async function getProspectLeads(): Promise<ProspectLead[]> {
  await requireAdmin()
  const db = svc()

  const { data, error } = await db
    .from('prospect_leads')
    .select('*')
    .order('priority_score', { ascending: false })
    .limit(2000)

  if (error) throw new Error(error.message)
  return (data ?? []) as ProspectLead[]
}

export async function getProspectLead(id: string): Promise<{
  lead: ProspectLead
  sources: ProspectSource[]
  activities: ProspectActivity[]
} | null> {
  await requireAdmin()
  const db = svc()

  const [{ data: lead }, { data: sources }, { data: activities }] = await Promise.all([
    db.from('prospect_leads').select('*').eq('id', id).single(),
    db.from('prospect_lead_sources').select('*').eq('lead_id', id).order('collected_at'),
    db.from('prospect_lead_activities').select('*').eq('lead_id', id).order('created_at', { ascending: false }),
  ])

  if (!lead) return null

  return {
    lead: lead as ProspectLead,
    sources: (sources ?? []) as ProspectSource[],
    activities: (activities ?? []) as ProspectActivity[],
  }
}

// ─── Mutations ────────────────────────────────────────────────

export async function transitionLeadStatus(
  id: string,
  newStatus: string,
): Promise<{ error?: string }> {
  await requireAdmin()
  const db = svc()

  const { data: lead } = await db
    .from('prospect_leads')
    .select('outreach_status, is_suppressed, email, email_origin')
    .eq('id', id)
    .single()

  if (!lead) return { error: 'Lead not found' }
  if (lead.is_suppressed) return { error: 'Lead is suppressed — cannot change status' }

  const allowed = TRANSITIONS[lead.outreach_status] ?? []
  if (!allowed.includes(newStatus)) {
    return { error: `Cannot transition from ${lead.outreach_status} → ${newStatus}` }
  }

  // Gate: ready requires email or contact_form
  if (newStatus === 'ready') {
    if (!lead.email && !lead.email_origin) {
      return { error: 'Cannot mark ready: no email channel available' }
    }
  }

  const updates: Record<string, unknown> = {
    outreach_status: newStatus,
    updated_at: new Date().toISOString(),
  }
  if (newStatus === 'contacted') {
    updates.contacted_at = new Date().toISOString()
  }

  const { error: updateErr } = await db
    .from('prospect_leads')
    .update(updates)
    .eq('id', id)

  if (updateErr) return { error: updateErr.message }

  await db.from('prospect_lead_activities').insert({
    lead_id: id,
    type: 'status_change',
    old_status: lead.outreach_status,
    new_status: newStatus,
  })

  revalidatePath(`/admin/prospecting/leads/${id}`)
  revalidatePath('/admin/prospecting/leads')
  return {}
}

export async function addLeadActivity(
  leadId: string,
  type: string,
  content: string,
  channelUrl?: string,
): Promise<{ error?: string }> {
  await requireAdmin()

  const validTypes = [
    'note', 'email_sent', 'email_replied', 'dm_facebook', 'dm_instagram',
    'contact_form_submitted', 'community_mention', 'referral_contact', 'research_note',
  ]
  if (!validTypes.includes(type)) return { error: `Invalid activity type: ${type}` }

  const db = svc()

  const { error } = await db.from('prospect_lead_activities').insert({
    lead_id: leadId,
    type,
    content,
    channel_url: channelUrl ?? null,
  })

  if (error) return { error: error.message }

  // Update last_activity_at on lead
  await db
    .from('prospect_leads')
    .update({ last_activity_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', leadId)

  revalidatePath(`/admin/prospecting/leads/${leadId}`)
  return {}
}

export async function suppressLead(
  leadId: string,
  identifierType: string,
  identifierValue: string,
  reason: string,
  notes?: string,
): Promise<{ error?: string }> {
  await requireAdmin()
  const db = svc()

  const { error } = await db.rpc('prospect_suppress_by_identifier', {
    p_type: identifierType,
    p_value: identifierValue,
    p_reason: reason,
    p_notes: notes ?? null,
    p_by: 'manual_operator',
  })

  if (error) return { error: error.message }

  await db.from('prospect_lead_activities').insert({
    lead_id: leadId,
    type: 'suppression_added',
    content: `Suppressed by ${identifierType}: ${identifierValue}. Reason: ${reason}`,
  })

  revalidatePath(`/admin/prospecting/leads/${leadId}`)
  revalidatePath('/admin/prospecting/leads')
  return {}
}

export async function createProspectLead(fields: {
  business_name: string
  trade?: string
  city?: string
  state?: string
  website?: string
  email?: string
  email_origin?: string
  facebook_url?: string
  instagram_url?: string
  tiktok_url?: string
  phone_public?: string
  has_contact_form?: boolean
  contact_form_url?: string
  language_signal?: string
  business_size?: string
  uses_software?: string
  website_quality?: string
  notes?: string
}): Promise<{ id?: string; duplicate?: boolean; error?: string }> {
  await requireAdmin()
  const db = svc()

  const { data, error } = await db.rpc('prospect_ingest_lead', {
    p_business_name:      fields.business_name.trim(),
    p_trade:              fields.trade || null,
    p_city:               fields.city?.trim() || null,
    p_state:              fields.state?.toUpperCase() || null,
    p_website:            fields.website?.trim() || null,
    p_email:              fields.email?.trim() || null,
    p_email_origin:       fields.email_origin || null,
    p_facebook_url:       fields.facebook_url?.trim() || null,
    p_instagram_url:      fields.instagram_url?.trim() || null,
    p_phone_public:       fields.phone_public?.trim() || null,
    p_has_contact_form:   fields.has_contact_form ?? null,
    p_contact_form_url:   fields.contact_form_url?.trim() || null,
    p_language_signal:    fields.language_signal || null,
    p_business_size:      fields.business_size || null,
    p_uses_software:      fields.uses_software || null,
    p_website_quality:    fields.website_quality || null,
    p_source_type:        'manual',
  })

  if (error) return { error: error.message }

  const row = Array.isArray(data) ? data[0] : data
  const leadId = row?.lead_id as string | undefined
  const isDuplicate = row?.is_duplicate as boolean | undefined

  // Save notes if provided
  if (leadId && fields.notes?.trim()) {
    await db.from('prospect_leads')
      .update({ notes: fields.notes.trim(), updated_at: new Date().toISOString() })
      .eq('id', leadId)
  }

  revalidatePath('/admin/prospecting/leads')
  return { id: leadId, duplicate: isDuplicate }
}

export async function updateLeadNotes(
  leadId: string,
  notes: string,
): Promise<{ error?: string }> {
  await requireAdmin()
  const db = svc()

  const { error } = await db
    .from('prospect_leads')
    .update({ notes, updated_at: new Date().toISOString() })
    .eq('id', leadId)

  if (error) return { error: error.message }
  revalidatePath(`/admin/prospecting/leads/${leadId}`)
  return {}
}
