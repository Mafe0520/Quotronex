import { requireAdmin } from '@/lib/admin/require-admin'
import { createServiceClient } from '@/lib/supabase/server'
import { AdminOverview, type OverviewData } from '@/components/admin/AdminOverview'
import { PLANS, type PlanId, estimatedMRR } from '@/lib/plans'

export default async function AdminPage() {
  const admin = await requireAdmin()
  const db = await createServiceClient()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [
    { data: businesses },
    { data: subs },
    { data: members },
    { data: estimates },
    { data: jobs },
  ] = await Promise.all([
    db.from('businesses').select('id, created_at'),
    db.from('subscriptions').select('id, status, plan_id, is_founder, billing'),
    db.from('business_members').select('id'),
    db.from('estimate_events').select('event_type'),
    db.from('jobs').select('id'),
  ])

  const newThisMonth = (businesses ?? []).filter(b => b.created_at >= startOfMonth).length

  const subList = subs ?? []
  const trialing  = subList.filter(s => s.status === 'trialing').length
  const active    = subList.filter(s => s.status === 'active').length
  const pastDue   = subList.filter(s => s.status === 'past_due').length
  const canceled  = subList.filter(s => s.status === 'canceled').length
  const founding  = subList.filter(s => s.is_founder).length

  const mrrCents = subList
    .filter(s => s.status === 'active' || s.status === 'trialing')
    .reduce((sum, s) => sum + estimatedMRR(s.plan_id as PlanId, s.is_founder), 0)

  const events = estimates ?? []
  const estimatesCreated  = events.filter(e => e.event_type === 'created').length
  const estimatesSent     = events.filter(e => e.event_type === 'sent').length
  const estimatesAccepted = events.filter(e => e.event_type === 'accepted').length

  const data: OverviewData = {
    businesses:    { total: (businesses ?? []).length, newThisMonth },
    subscriptions: { trialing, active, pastDue, canceled, founding },
    users:         { total: (members ?? []).length },
    estimatedMRR:  mrrCents,
    support:       { open: 0, waitingOnMe: 0 }, // se actualizará cuando exista support_tickets
    product:       { estimatesCreated, estimatesSent, estimatesAccepted, jobs: (jobs ?? []).length },
  }

  return <AdminOverview admin={admin} data={data} />
}
