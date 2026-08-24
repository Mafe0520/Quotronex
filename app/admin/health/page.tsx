import { requireAdmin } from '@/lib/admin/require-admin'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react'

export const metadata = { title: 'System Health — Quotronex Admin' }

async function pingSupabase(url: string, key: string): Promise<{ ok: boolean; ms: number }> {
  const start = Date.now()
  try {
    const db = createSupabaseClient<Database>(url, key)
    const { error } = await db.from('businesses').select('id').limit(1)
    return { ok: !error, ms: Date.now() - start }
  } catch {
    return { ok: false, ms: Date.now() - start }
  }
}

function StatusDot({ ok }: { ok: boolean }) {
  return ok
    ? <CheckCircle size={16} className="text-emerald-400" />
    : <XCircle size={16} className="text-red-400" />
}

function ServiceRow({ name, ok, ms, note }: { name: string; ok: boolean; ms?: number; note?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[#111] px-5 py-4 last:border-0">
      <div className="flex items-center gap-3">
        <StatusDot ok={ok} />
        <div>
          <p className="text-sm font-semibold text-white">{name}</p>
          {note && <p className="text-xs text-[#555]">{note}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {ms !== undefined && (
          <span className={`flex items-center gap-1 text-xs ${ms < 500 ? 'text-emerald-400' : ms < 1500 ? 'text-amber-400' : 'text-red-400'}`}>
            <Clock size={11} /> {ms}ms
          </span>
        )}
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ok ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
          {ok ? 'Operational' : 'Down'}
        </span>
      </div>
    </div>
  )
}

export default async function AdminHealthPage() {
  await requireAdmin()

  const [dbStatus] = await Promise.all([
    pingSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!),
  ])

  const stripeOk = false  // not connected yet
  const aiOk = false      // not connected yet

  const allOk = dbStatus.ok && stripeOk && aiOk
  const someDown = !dbStatus.ok

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black [font-family:var(--font-display)] text-white">System Health</h1>
        <p className="mt-1 text-sm text-[#888]">Estado de los servicios en tiempo real</p>
      </div>

      {/* Overall status */}
      <div className={`mb-6 flex items-center gap-3 rounded-xl border px-5 py-4 ${
        someDown
          ? 'border-red-500/20 bg-red-500/8'
          : allOk
            ? 'border-emerald-500/20 bg-emerald-500/8'
            : 'border-amber-500/20 bg-amber-500/8'
      }`}>
        {someDown ? (
          <XCircle size={20} className="text-red-400" />
        ) : allOk ? (
          <CheckCircle size={20} className="text-emerald-400" />
        ) : (
          <AlertTriangle size={20} className="text-amber-400" />
        )}
        <div>
          <p className={`font-bold ${someDown ? 'text-red-300' : allOk ? 'text-emerald-300' : 'text-amber-300'}`}>
            {someDown ? 'Degraded — some services are down' : allOk ? 'All systems operational' : 'Partial outage — some services pending setup'}
          </p>
          <p className="text-xs text-[#555]">Checked just now</p>
        </div>
      </div>

      {/* Services */}
      <div className="rounded-xl border border-[#1a1a1a] overflow-hidden">
        <div className="border-b border-[#1a1a1a] px-5 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#555]">Services</p>
        </div>
        <ServiceRow name="Supabase DB"  ok={dbStatus.ok} ms={dbStatus.ms} />
        <ServiceRow name="Stripe"       ok={stripeOk} note="Not connected — pending setup" />
        <ServiceRow name="AI (OpenAI / Anthropic)" ok={aiOk} note="Not connected — pending setup" />
        <ServiceRow name="Email (SMTP)" ok={false} note="Not connected — pending setup" />
      </div>

      {/* Env vars */}
      <div className="mt-6 rounded-xl border border-[#1a1a1a] overflow-hidden">
        <div className="border-b border-[#1a1a1a] px-5 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#555]">Environment variables</p>
        </div>
        {[
          { key: 'NEXT_PUBLIC_SUPABASE_URL',      set: !!process.env.NEXT_PUBLIC_SUPABASE_URL },
          { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', set: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
          { key: 'SUPABASE_SERVICE_ROLE_KEY',     set: !!process.env.SUPABASE_SERVICE_ROLE_KEY },
          { key: 'STRIPE_SECRET_KEY',             set: !!process.env.STRIPE_SECRET_KEY },
          { key: 'STRIPE_WEBHOOK_SECRET',         set: !!process.env.STRIPE_WEBHOOK_SECRET },
        ].map(v => (
          <div key={v.key} className="flex items-center justify-between border-b border-[#111] px-5 py-3 last:border-0">
            <code className="text-xs text-[#888]">{v.key}</code>
            <span className={`text-xs font-semibold ${v.set ? 'text-emerald-400' : 'text-red-400'}`}>
              {v.set ? '✓ Set' : '✗ Missing'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
