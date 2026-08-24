import { requireAdmin } from '@/lib/admin/require-admin'
import { getProspectLeads } from '@/app/actions/prospecting'
import { ProspectLeadsTable } from '@/components/admin/prospecting/LeadsTable'
import { LeadsHeader } from '@/components/admin/prospecting/LeadsHeader'

export const metadata = { title: 'Prospecting Leads — Quotronex Admin' }
export const dynamic = 'force-dynamic'

export default async function ProspectingLeadsPage() {
  await requireAdmin()
  const leads = await getProspectLeads()

  return (
    <div className="p-8">
      <LeadsHeader count={leads.length} />
      <ProspectLeadsTable leads={leads} />
    </div>
  )
}
