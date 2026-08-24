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

// Patterns to skip — generic/noreply addresses
const SKIP_PATTERNS = [
  'noreply', 'no-reply', 'donotreply', 'example.com', 'sentry', 'wix',
  'wordpress', 'squarespace', 'godaddy', 'hostgator', 'namecheap',
  'privacy', 'abuse', 'postmaster', 'webmaster', 'support@wix',
]

function isValidEmail(email: string): boolean {
  if (!email.includes('@') || !email.includes('.')) return false
  const lower = email.toLowerCase()
  if (SKIP_PATTERNS.some(p => lower.includes(p))) return false
  // Basic format check
  return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email)
}

function extractEmails(html: string): string[] {
  const found = new Set<string>()

  // mailto: links
  const mailtoRe = /mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/gi
  let m: RegExpExecArray | null
  while ((m = mailtoRe.exec(html)) !== null) found.add(m[1].toLowerCase())

  // Plain email pattern in text (less noise: require word boundary context)
  const plainRe = /\b([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})\b/g
  while ((m = plainRe.exec(html)) !== null) found.add(m[1].toLowerCase())

  return [...found].filter(isValidEmail)
}

export async function scrapeEmailFromWebsite(
  leadId: string,
  website: string,
): Promise<{ email?: string; error?: string }> {
  await requireAdmin()

  // Normalize URL
  let url = website.trim()
  if (!url.startsWith('http')) url = 'https://' + url

  let html = ''
  try {
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; research-bot/1.0)' },
      signal: AbortSignal.timeout(8000),
    })
    if (!resp.ok) return { error: `HTTP ${resp.status}` }
    html = await resp.text()
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Fetch failed' }
  }

  // Also try /contact page if no email found on homepage
  let emails = extractEmails(html)
  if (emails.length === 0) {
    try {
      const base = new URL(url).origin
      const contactResp = await fetch(`${base}/contact`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; research-bot/1.0)' },
        signal: AbortSignal.timeout(5000),
      })
      if (contactResp.ok) {
        const contactHtml = await contactResp.text()
        emails = extractEmails(contactHtml)
      }
    } catch { /* ignore */ }
  }

  if (emails.length === 0) return { error: 'No email found on website' }

  // Prefer emails that match the domain
  let best = emails[0]
  try {
    const domain = new URL(url).hostname.replace('www.', '')
    const domainMatch = emails.find(e => e.endsWith('@' + domain) || e.includes(domain.split('.')[0]))
    if (domainMatch) best = domainMatch
  } catch { /* ignore */ }

  // Save to DB
  const db = svc()
  await db.from('prospect_leads').update({
    email: best,
    email_origin: 'public_direct',
    email_collected_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', leadId)

  revalidatePath(`/admin/prospecting/leads/${leadId}`)
  revalidatePath('/admin/prospecting/leads')

  return { email: best }
}

// Bulk scrape — called during import for all leads with website but no email
export async function bulkScrapeEmails(leadIds: string[]): Promise<{
  found: number
  failed: number
}> {
  await requireAdmin()
  const db = svc()

  const { data: leads } = await db
    .from('prospect_leads')
    .select('id, website')
    .in('id', leadIds)
    .is('email', null)
    .not('website', 'is', null)

  if (!leads || leads.length === 0) return { found: 0, failed: 0 }

  let found = 0, failed = 0

  for (const lead of leads) {
    const result = await scrapeEmailFromWebsite(lead.id, lead.website)
    if (result.email) found++
    else failed++
    // Small delay to be polite
    await new Promise(r => setTimeout(r, 300))
  }

  return { found, failed }
}
