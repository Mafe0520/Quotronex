'use client'

import type { AdminUser } from '@/lib/admin/require-admin'
import { Building2, Users, CreditCard, TrendingUp, MessageSquare, FileText, Briefcase, AlertTriangle } from 'lucide-react'

interface Props {
  admin: AdminUser
  data?: OverviewData
}

export interface OverviewData {
  businesses:       { total: number; newThisMonth: number }
  subscriptions:    { trialing: number; active: number; pastDue: number; canceled: number; founding: number }
  users:            { total: number }
  estimatedMRR:     number | null
  support:          { open: number; waitingOnMe: number }
  product:          { estimatesCreated: number; estimatesSent: number; estimatesAccepted: number; jobs: number }
}

// ── helpers ────────────────────────────────────────────────────────────────

function fmt(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cents / 100)
}

function StatCard({
  label, value, sub, href, estimated, noData,
}: {
  label: string
  value: string | number
  sub?: string
  href?: string
  estimated?: boolean
  noData?: boolean
}) {
  const content = (
    <div className="group flex flex-col gap-1.5 rounded-xl border border-white/6 bg-white/3 p-4 hover:bg-white/5 transition-colors cursor-default">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-widest text-white/40">{label}</span>
        {estimated && (
          <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-400">
            Estimated
          </span>
        )}
        {noData && (
          <span className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/30">
            No data
          </span>
        )}
      </div>
      <span className={['text-2xl font-black tabular-nums [font-family:var(--font-display)]', noData ? 'text-white/20' : 'text-white'].join(' ')}>
        {noData ? '—' : value}
      </span>
      {sub && <span className="text-[11px] text-white/35">{sub}</span>}
    </div>
  )

  if (href) return <a href={href}>{content}</a>
  return content
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-white/30">
      {children}
    </p>
  )
}

// ── component ──────────────────────────────────────────────────────────────

export function AdminOverview({ admin, data }: Props) {
  const d = data

  const hasStripe = false // cambiar a true cuando conectemos webhooks

  return (
    <div className="min-h-dvh px-8 py-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white [font-family:var(--font-display)]">Overview</h1>
          <p className="mt-0.5 text-sm text-white/40">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {!hasStripe && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/8 px-3 py-2">
            <AlertTriangle size={13} className="text-amber-400 shrink-0" />
            <span className="text-xs text-amber-400/80">Stripe not connected — revenue figures are estimated</span>
          </div>
        )}
      </div>

      {/* 1. NEEDS ATTENTION */}
      {d && (d.subscriptions.pastDue > 0 || d.support.waitingOnMe > 0) && (
        <div className="mb-8 rounded-xl border border-red-500/20 bg-red-500/6 px-5 py-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-red-400/70">Needs your attention</p>
          <div className="flex flex-wrap gap-4">
            {d.subscriptions.pastDue > 0 && (
              <a href="/admin/subscriptions?status=past_due" className="text-sm font-medium text-red-300 hover:text-white">
                {d.subscriptions.pastDue} payment{d.subscriptions.pastDue > 1 ? 's' : ''} past due →
              </a>
            )}
            {d.support.waitingOnMe > 0 && (
              <a href="/admin/support" className="text-sm font-medium text-amber-300 hover:text-white">
                {d.support.waitingOnMe} support ticket{d.support.waitingOnMe > 1 ? 's' : ''} waiting on you →
              </a>
            )}
          </div>
        </div>
      )}

      {/* 2. FINANCIAL PICTURE */}
      <section className="mb-8">
        <SectionLabel>Financial picture</SectionLabel>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            label="Collected this month"
            value="—"
            sub="Stripe required"
            noData={!hasStripe}
          />
          <StatCard
            label="Estimated MRR"
            value={d ? fmt(d.estimatedMRR ?? 0) : '—'}
            sub="Based on active subscriptions"
            estimated
            noData={!d}
          />
          <StatCard
            label="Estimated ARR"
            value={d && d.estimatedMRR ? fmt(d.estimatedMRR * 12) : '—'}
            sub="MRR × 12"
            estimated
            noData={!d}
          />
          <StatCard
            label="Estimated net"
            value="—"
            sub="Stripe required"
            noData={!hasStripe}
          />
        </div>
      </section>

      {/* 3. GROWTH / SUBSCRIPTIONS */}
      <section className="mb-8">
        <SectionLabel>Growth & subscriptions</SectionLabel>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <StatCard label="Trialing"    value={d?.subscriptions.trialing  ?? '—'} href="/admin/subscriptions?status=trialing" noData={!d} />
          <StatCard label="Active"      value={d?.subscriptions.active    ?? '—'} href="/admin/subscriptions?status=active"   noData={!d} />
          <StatCard label="Past due"    value={d?.subscriptions.pastDue   ?? '—'} href="/admin/subscriptions?status=past_due" noData={!d} />
          <StatCard label="Canceled"    value={d?.subscriptions.canceled  ?? '—'} href="/admin/subscriptions?status=canceled" noData={!d} />
          <StatCard
            label="Founding Contractors"
            value={d ? `${d.subscriptions.founding} / 100` : '—'}
            href="/admin/subscriptions?founding=true"
            noData={!d}
          />
        </div>
      </section>

      {/* 4. BUSINESSES & USERS */}
      <section className="mb-8">
        <SectionLabel>Businesses & users</SectionLabel>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Total businesses"    value={d?.businesses.total        ?? '—'} href="/admin/businesses" noData={!d} />
          <StatCard label="New this month"      value={d?.businesses.newThisMonth ?? '—'} href="/admin/businesses" noData={!d} />
          <StatCard label="Total users"         value={d?.users.total             ?? '—'} href="/admin/users"      noData={!d} />
          <StatCard label="AI spend this month" value="—" sub="Integration required"      noData estimated />
        </div>
      </section>

      {/* 5. SUPPORT */}
      <section className="mb-8">
        <SectionLabel>Support</SectionLabel>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <StatCard label="Open tickets"       value={d?.support.open         ?? '—'} href="/admin/support?status=open"    noData={!d} />
          <StatCard label="Waiting on you"     value={d?.support.waitingOnMe  ?? '—'} href="/admin/support?status=waiting" noData={!d} />
          <StatCard label="Resolved this week" value="—" noData />
        </div>
      </section>

      {/* 6. PRODUCT HEALTH */}
      <section className="mb-8">
        <SectionLabel>Product health</SectionLabel>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Estimates created"  value={d?.product.estimatesCreated  ?? '—'} href="/admin/product" noData={!d} />
          <StatCard label="Estimates sent"     value={d?.product.estimatesSent     ?? '—'} href="/admin/product" noData={!d} />
          <StatCard label="Estimates accepted" value={d?.product.estimatesAccepted ?? '—'} href="/admin/product" noData={!d} />
          <StatCard label="Jobs created"       value={d?.product.jobs              ?? '—'} href="/admin/product" noData={!d} />
        </div>
      </section>

    </div>
  )
}
