import { requireAdmin } from '@/lib/admin/require-admin'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { SatisfactionDashboard } from '@/components/admin/SatisfactionDashboard'

export const metadata = { title: 'Satisfacción · Admin' }

export default async function SatisfactionPage() {
  await requireAdmin()

  const db = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: ratings } = await db
    .from('satisfaction_ratings')
    .select('rating, created_at')
    .order('created_at', { ascending: true })

  const rows = (ratings ?? []) as { rating: number; created_at: string }[]

  // Global average
  const avg = rows.length
    ? +(rows.reduce((s, r) => s + r.rating, 0) / rows.length).toFixed(2)
    : null

  // Count by level 1-5
  const byLevel = [1, 2, 3, 4, 5].map((lvl) => ({
    level: lvl,
    count: rows.filter((r) => r.rating === lvl).length,
  }))

  // Monthly buckets (last 6 months)
  const monthly: { month: string; avg: number; count: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    const y = d.getFullYear()
    const m = d.getMonth()
    const label = d.toLocaleDateString('es-US', { month: 'short', year: '2-digit' })
    const bucket = rows.filter((r) => {
      const rd = new Date(r.created_at)
      return rd.getFullYear() === y && rd.getMonth() === m
    })
    if (bucket.length === 0) {
      monthly.push({ month: label, avg: 0, count: 0 })
    } else {
      const a = +(bucket.reduce((s, r) => s + r.rating, 0) / bucket.length).toFixed(2)
      monthly.push({ month: label, avg: a, count: bucket.length })
    }
  }

  return (
    <SatisfactionDashboard
      total={rows.length}
      average={avg}
      byLevel={byLevel}
      monthly={monthly}
    />
  )
}
