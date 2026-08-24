import { requireAdmin } from '@/lib/admin/require-admin'
import { PLANS } from '@/lib/plans'
import { Shield, AlertTriangle } from 'lucide-react'

export const metadata = { title: 'Settings — Quotronex Admin' }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#555]">{title}</h2>
      <div className="rounded-xl border border-[#1a1a1a] overflow-hidden">{children}</div>
    </div>
  )
}

function Row({ label, value, sub, badge }: { label: string; value: string; sub?: string; badge?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[#111] px-5 py-4 last:border-0">
      <div>
        <p className="text-sm font-semibold text-white">{label}</p>
        {sub && <p className="mt-0.5 text-xs text-[#555]">{sub}</p>}
      </div>
      <div className="flex items-center gap-2">
        {badge && (
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-400">{badge}</span>
        )}
        <span className="text-sm text-[#888]">{value}</span>
      </div>
    </div>
  )
}

export default async function AdminSettingsPage() {
  const admin = await requireAdmin()

  if (admin.role !== 'superadmin') {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-20 text-center">
        <Shield size={32} className="text-[#333]" />
        <p className="text-sm text-[#555]">Solo superadmins pueden ver esta sección.</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black [font-family:var(--font-display)] text-white">Settings</h1>
        <p className="mt-1 text-sm text-[#888]">Configuración del sistema — solo superadmin</p>
      </div>

      <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3">
        <AlertTriangle size={14} className="shrink-0 text-amber-400" />
        <p className="text-xs text-amber-300">
          Esta pantalla es de solo lectura. Los cambios se hacen directamente en el código o en Supabase hasta que implementemos mutaciones.
        </p>
      </div>

      <Section title="Pricing — plan configuration">
        {Object.entries(PLANS).map(([id, plan]) => (
          <Row
            key={id}
            label={plan.name}
            value={`$${(plan.monthlyPriceCents / 100).toFixed(0)}/mo · ${plan.includedSeats} seat${plan.includedSeats !== 1 ? 's' : ''}`}
            sub={`Extra seats: $5/mo · Annual: $${(plan.annualPriceCents / 100).toFixed(0)}/yr · Stripe: ${plan.stripePriceIdMonthly}`}
            badge={`Founder $${(plan.founderMonthlyPriceCents / 100).toFixed(0)}/mo`}
          />
        ))}
      </Section>

      <Section title="Founder program">
        <Row label="Max founder slots" value="100" sub="Hardcoded — cambiar en lib/plans.ts" />
        <Row label="Founder price" value="$5/mo off" sub="Founding price IDs in lib/plans.ts — Stripe configured" />
        <Row label="Annual billing" value="Active" sub="2 months free — Stripe configured" />
      </Section>

      <Section title="Feature flags">
        <Row label="Stripe" value="Not connected" sub="Conectar en .env.local: STRIPE_SECRET_KEY" badge="PENDING" />
        <Row label="AI voice quoting" value="Not connected" sub="Pendiente de integración" badge="PENDING" />
        <Row label="Email sending" value="Not connected" sub="Pendiente de SMTP / Resend" badge="PENDING" />
        <Row label="SMS sending" value="Not connected" sub="Pendiente de Twilio" badge="PENDING" />
      </Section>

      <Section title="Admin users">
        <Row
          label={admin.email}
          value="superadmin"
          sub={`user_id: ${admin.user_id}`}
        />
      </Section>
    </div>
  )
}
