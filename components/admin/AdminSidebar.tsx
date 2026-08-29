'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, DollarSign, CreditCard, Building2,
  Users, MessageSquare, Zap, BarChart2, TrendingUp,
  Activity, ScrollText, Settings, ChevronRight, Target, Smile,
} from 'lucide-react'
import type { AdminRole } from '@/lib/admin/require-admin'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: number
  superadminOnly?: boolean
}

const NAV: NavItem[] = [
  { label: 'Overview',       href: '/admin',                icon: LayoutDashboard },
  { label: 'Revenue',        href: '/admin/revenue',        icon: DollarSign,  superadminOnly: true },
  { label: 'Subscriptions',  href: '/admin/subscriptions',  icon: CreditCard   },
  { label: 'Businesses',     href: '/admin/businesses',     icon: Building2    },
  { label: 'Users',          href: '/admin/users',          icon: Users        },
  { label: 'Support',        href: '/admin/support',        icon: MessageSquare },
  { label: 'AI Usage',       href: '/admin/ai-usage',       icon: Zap,  superadminOnly: true },
  { label: 'Product Usage',  href: '/admin/product',        icon: BarChart2    },
  { label: 'Satisfacción',   href: '/admin/satisfaction',   icon: Smile        },
  { label: 'Acquisition',    href: '/admin/acquisition',    icon: TrendingUp   },
  { label: 'System Health',  href: '/admin/health',         icon: Activity     },
  { label: 'Prospecting',    href: '/admin/prospecting/leads', icon: Target, superadminOnly: true },
]

const SYSTEM: NavItem[] = [
  { label: 'Audit Log', href: '/admin/audit-log', icon: ScrollText, superadminOnly: true },
  { label: 'Settings',  href: '/admin/settings', icon: Settings, superadminOnly: true },
]

interface Props { adminRole: AdminRole }

export function AdminSidebar({ adminRole }: Props) {
  const pathname = usePathname()
  const isSuperadmin = adminRole === 'superadmin'

  function NavLink({ item }: { item: NavItem }) {
    if (item.superadminOnly && !isSuperadmin) return null
    const active = item.href === '/admin'
      ? pathname === '/admin'
      : pathname.startsWith(item.href)
    const Icon = item.icon

    return (
      <Link
        href={item.href}
        className={[
          'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          active
            ? 'bg-white/8 text-white'
            : 'text-white/45 hover:bg-white/5 hover:text-white/80',
        ].join(' ')}
      >
        <Icon size={16} strokeWidth={active ? 2.5 : 2} className="shrink-0" />
        <span className="flex-1 truncate">{item.label}</span>
        {item.badge ? (
          <span className="rounded-full bg-[#3ecf8e] px-1.5 py-0.5 text-[10px] font-bold text-black leading-none">
            {item.badge}
          </span>
        ) : active ? (
          <ChevronRight size={12} className="opacity-40" />
        ) : null}
      </Link>
    )
  }

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-white/6 bg-[#0d0d14]">
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-white/6 px-4">
        <span className="size-5 rounded bg-[#3ecf8e]" aria-hidden />
        <span className="text-sm font-bold text-white [font-family:var(--font-display)]">Quotronex</span>
        <span className="ml-auto rounded-md bg-white/8 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/50">
          Admin
        </span>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 flex flex-col gap-0.5">
        {NAV.map(item => <NavLink key={item.href} item={item} />)}

        <div className="my-3 h-px bg-white/6" />
        <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/25">System</p>
        {SYSTEM.map(item => <NavLink key={item.href} item={item} />)}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-white/6 px-3 py-3">
        <p className="text-[11px] text-white/25 truncate">
          {adminRole === 'superadmin' ? '⬡ superadmin' : '◎ support'}
        </p>
      </div>
    </aside>
  )
}
