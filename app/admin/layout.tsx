import { requireAdmin } from '@/lib/admin/require-admin'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export const metadata = { title: 'Quotronex Admin', robots: { index: false } }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin()

  return (
    <div className="flex min-h-dvh bg-[var(--admin-bg)]" style={{ '--admin-bg': '#0a0a0f' } as React.CSSProperties}>
      <AdminSidebar adminRole={admin.role} />
      <main className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
