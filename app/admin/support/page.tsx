import { requireAdmin } from '@/lib/admin/require-admin'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { SupportInbox } from '@/components/admin/SupportInbox'

export const metadata = { title: 'Support — Quotronex Admin' }

export default async function AdminSupportPage() {
  const admin = await requireAdmin()

  const db = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [{ data: tickets }, { data: businesses }] = await Promise.all([
    db.from('support_tickets' as any).select('*').order('updated_at', { ascending: false }),
    db.from('businesses').select('id, name'),
  ])

  const bizMap = new Map(((businesses ?? []) as { id: string; name: string }[]).map(b => [b.id, b.name]))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = ((tickets ?? []) as any[]).map((t: any) => ({
    ...t,
    businessName: bizMap.get(t.business_id) ?? '—',
  }))

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black [font-family:var(--font-display)] text-white">Support</h1>
        <p className="mt-1 text-sm text-[#888]">{rows.filter((r: any) => r.status !== 'closed' && r.status !== 'resolved').length} ticket{rows.length !== 1 ? 's' : ''} abierto{rows.length !== 1 ? 's' : ''}</p>
      </div>
      <SupportInbox tickets={rows} adminId={admin.id} />
    </div>
  )
}
