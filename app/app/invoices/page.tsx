import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getInvoices } from '@/app/actions/invoices'
import Link from 'next/link'

export const metadata = { title: 'Facturas — Quotronex', robots: { index: false } }
export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador', sent: 'Enviada', viewed: 'Vista',
  paid: 'Pagada', partial: 'Parcial', overdue: 'Vencida', cancelled: 'Cancelada',
}
const STATUS_COLOR: Record<string, string> = {
  draft:     'bg-[color-mix(in_oklab,var(--text-tertiary)_12%,transparent)] text-[var(--text-tertiary)]',
  sent:      'bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] text-[var(--accent)]',
  viewed:    'bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] text-[var(--accent)]',
  paid:      'bg-[color-mix(in_oklab,#22c55e_12%,transparent)] text-[#22c55e]',
  partial:   'bg-[color-mix(in_oklab,#f59e0b_12%,transparent)] text-[#f59e0b]',
  overdue:   'bg-[color-mix(in_oklab,#ef4444_12%,transparent)] text-[#ef4444]',
  cancelled: 'bg-[color-mix(in_oklab,var(--text-tertiary)_8%,transparent)] text-[var(--text-tertiary)]',
}

function fmt(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}
function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function InvoicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const invoices = await getInvoices()

  const totalOwed = invoices
    .filter(i => !['paid', 'cancelled', 'draft'].includes(i.status))
    .reduce((s, i) => s + (i.total_cents - (i.amount_paid_cents ?? 0)), 0)

  const totalPaid = invoices
    .filter(i => i.status === 'paid')
    .reduce((s, i) => s + i.total_cents, 0)

  return (
    <div className="flex flex-col h-full bg-[var(--surface)]">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Facturas</h1>
          <Link href="/app/invoices/new"
            className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-black">
            + Nueva
          </Link>
        </div>

        {/* Summary cards */}
        {invoices.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-2">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
              <p className="text-xs text-[var(--text-tertiary)] mb-1">Por cobrar</p>
              <p className="text-lg font-bold text-[var(--text-primary)]">{fmt(totalOwed)}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
              <p className="text-xs text-[var(--text-tertiary)] mb-1">Cobrado</p>
              <p className="text-lg font-bold text-[#22c55e]">{fmt(totalPaid)}</p>
            </div>
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-5 pb-24 space-y-2">
        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-4xl mb-3">🧾</p>
            <p className="font-semibold text-[var(--text-primary)]">Sin facturas</p>
            <p className="text-sm text-[var(--text-tertiary)] mt-1 mb-6">
              Convierte una cotización aprobada o crea una nueva.
            </p>
            <Link href="/app/invoices/new"
              className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-black">
              + Nueva factura
            </Link>
          </div>
        ) : (
          invoices.map(inv => {
            const client = (inv.clients as { name: string } | null)
            const owed = inv.total_cents - (inv.amount_paid_cents ?? 0)
            const isOverdue = inv.status === 'overdue' || (
              inv.due_at && new Date(inv.due_at) < new Date() && !['paid', 'cancelled'].includes(inv.status)
            )

            return (
              <Link key={inv.id} href={`/app/invoices/${inv.id}`}
                className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3.5 active:opacity-70 transition-opacity">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-sm text-[var(--text-primary)] truncate">
                      {client?.name ?? 'Sin cliente'}
                    </p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_COLOR[isOverdue ? 'overdue' : inv.status] ?? STATUS_COLOR.draft}`}>
                      {isOverdue ? 'Vencida' : (STATUS_LABEL[inv.status] ?? inv.status)}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {inv.due_at ? `Vence ${fmtDate(inv.due_at)}` : `Emitida ${fmtDate(inv.issued_at)}`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-bold ${inv.status === 'paid' ? 'text-[#22c55e]' : 'text-[var(--text-primary)]'}`}>
                    {fmt(inv.total_cents)}
                  </p>
                  {inv.status === 'partial' && (
                    <p className="text-[10px] text-[var(--text-tertiary)]">Resta {fmt(owed)}</p>
                  )}
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
