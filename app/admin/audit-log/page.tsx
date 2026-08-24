import { requireAdmin } from '@/lib/admin/require-admin'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { ScrollText } from 'lucide-react'

export const metadata = { title: 'Audit Log — Quotronex Admin' }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function AdminAuditLogPage() {
  await requireAdmin()

  const db = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: logs } = await (db as any)
    .from('admin_audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black [font-family:var(--font-display)] text-white">Audit Log</h1>
        <p className="mt-1 text-sm text-[#888]">Inmutable · últimas 200 acciones</p>
      </div>

      {(!logs || logs.length === 0) ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-[#1a1a1a] py-20 text-center">
          <ScrollText size={32} className="text-[#333]" />
          <p className="text-sm text-[#555]">No hay acciones registradas todavía.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[#1a1a1a] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1a1a1a] text-[10px] font-semibold uppercase tracking-widest text-[#555]">
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Admin</th>
                <th className="px-4 py-3 text-left">Action</th>
                <th className="px-4 py-3 text-left">Target</th>
              </tr>
            </thead>
            <tbody>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(logs as any[]).map((l: any) => (
                <tr key={l.id} className="border-b border-[#111] hover:bg-[#0d0d14]">
                  <td className="px-4 py-3 text-xs text-[#555] whitespace-nowrap">{fmtDate(l.created_at)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#555]">{(l.admin_user_id as string).slice(0, 8)}…</td>
                  <td className="px-4 py-3 font-semibold text-[#aaa]">{l.action}</td>
                  <td className="px-4 py-3 text-xs text-[#555]">
                    {l.target_type}{l.target_id ? ` · ${(l.target_id as string).slice(0, 8)}…` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
