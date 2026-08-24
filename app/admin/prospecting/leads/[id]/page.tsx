import { requireAdmin } from '@/lib/admin/require-admin'
import { getProspectLead } from '@/app/actions/prospecting'
import { ProspectLeadDetail } from '@/components/admin/prospecting/LeadDetail'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getProspectLead(id).catch(() => null)
  return { title: data ? `${data.lead.business_name} — Prospecting` : 'Lead — Quotronex Admin' }
}

export default async function ProspectLeadPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const data = await getProspectLead(id)
  if (!data) notFound()

  return <ProspectLeadDetail lead={data.lead} sources={data.sources} activities={data.activities} />
}
