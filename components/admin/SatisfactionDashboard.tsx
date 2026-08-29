'use client'

const FACES = ['😢', '😕', '😐', '🙂', '😄']
const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e']
const LABEL = ['Muy mal', 'Mal', 'Neutral', 'Bien', 'Excelente']

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl bg-white/5 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-white/40">{label}</p>
      <p className="mt-1 text-3xl font-black text-white">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-white/40">{sub}</p>}
    </div>
  )
}

export function SatisfactionDashboard({
  total,
  average,
  byLevel,
  monthly,
}: {
  total: number
  average: number | null
  byLevel: { level: number; count: number }[]
  monthly: { month: string; avg: number; count: number }[]
}) {
  const maxCount = Math.max(...byLevel.map((b) => b.count), 1)
  const maxAvg = 5

  const avgStar = average
    ? average >= 4.5 ? '😄' : average >= 3.5 ? '🙂' : average >= 2.5 ? '😐' : average >= 1.5 ? '😕' : '😢'
    : '—'

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <h1 className="text-2xl font-black text-white mb-1">Satisfacción de usuarios</h1>
      <p className="text-sm text-white/40 mb-8">Respuestas a la encuesta NPS interna</p>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        <StatCard label="Respuestas totales" value={total} />
        <StatCard
          label="Promedio"
          value={average !== null ? `${avgStar} ${average}` : '—'}
          sub="sobre 5"
        />
        <StatCard
          label="Este mes"
          value={monthly[monthly.length - 1]?.count ?? 0}
          sub={monthly[monthly.length - 1]?.avg ? `Prom. ${monthly[monthly.length - 1].avg}` : 'sin datos'}
        />
      </div>

      {/* Distribution by level */}
      <section className="mb-10">
        <h2 className="text-sm font-bold text-white/60 uppercase tracking-wide mb-4">Distribución por nivel</h2>
        <div className="rounded-2xl bg-white/5 p-5 flex flex-col gap-3">
          {byLevel.map((b) => {
            const pct = total > 0 ? Math.round((b.count / total) * 100) : 0
            const barPct = Math.round((b.count / maxCount) * 100)
            const idx = b.level - 1
            return (
              <div key={b.level} className="flex items-center gap-3">
                <span className="text-xl w-7 text-center">{FACES[idx]}</span>
                <span className="w-16 text-xs text-white/50 shrink-0">{LABEL[idx]}</span>
                <div className="flex-1 h-5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${barPct}%`, background: COLORS[idx] }}
                  />
                </div>
                <span className="w-16 text-right text-xs font-bold text-white shrink-0">
                  {b.count} <span className="font-normal text-white/40">({pct}%)</span>
                </span>
              </div>
            )
          })}
        </div>
      </section>

      {/* Monthly evolution */}
      <section>
        <h2 className="text-sm font-bold text-white/60 uppercase tracking-wide mb-4">Evolución mensual (últimos 6 meses)</h2>
        <div className="rounded-2xl bg-white/5 p-5">
          <div className="flex items-end gap-3 h-36">
            {monthly.map((m) => {
              const barH = m.avg > 0 ? Math.round((m.avg / maxAvg) * 100) : 0
              const color = m.avg >= 4 ? '#22c55e' : m.avg >= 3 ? '#f59e0b' : m.avg > 0 ? '#ef4444' : '#ffffff18'
              return (
                <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                  {m.count > 0 && (
                    <span className="text-[10px] font-bold text-white/60">{m.avg}</span>
                  )}
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className="w-full rounded-t-lg transition-all duration-700"
                      style={{ height: `${barH}%`, minHeight: m.count > 0 ? 6 : 0, background: color }}
                    />
                  </div>
                  <span className="text-[10px] text-white/40">{m.month}</span>
                  {m.count > 0 && (
                    <span className="text-[9px] text-white/30">{m.count} resp.</span>
                  )}
                </div>
              )
            })}
          </div>
          <div className="mt-4 flex justify-between text-[10px] text-white/30">
            <span>0 (peor)</span>
            <span>5 (mejor)</span>
          </div>
        </div>
      </section>
    </div>
  )
}
