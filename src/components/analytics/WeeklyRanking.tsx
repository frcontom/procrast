interface Props {
  sessions: any[]
}

export function WeeklyRanking({ sessions }: Props) {
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

  const dayTotals: Record<number, { minutes: number; count: number }> = {}
  const today = new Date()
  const weekAgo = new Date(today)
  weekAgo.setDate(today.getDate() - 7)

  sessions
    .filter((s: any) => new Date(s.started_at) >= weekAgo)
    .forEach((s: any) => {
      const day = new Date(s.started_at).getDay()
      if (!dayTotals[day]) dayTotals[day] = { minutes: 0, count: 0 }
      dayTotals[day].minutes += (s.elapsed_seconds || 0) / 60
      dayTotals[day].count++
    })

  const ranking = Object.entries(dayTotals)
    .map(([day, data]) => ({ day: parseInt(day), ...data, label: dayNames[parseInt(day)] }))
    .sort((a, b) => b.minutes - a.minutes)

  if (ranking.length === 0) return null

  const maxMinutes = Math.max(...ranking.map((r) => r.minutes))

  return (
    <div className="bg-card rounded-xl border border-white/10 p-4">
      <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">Ranking Semanal</h3>
      <div className="space-y-2">
        {ranking.map((r, i) => (
          <div key={r.day} className="flex items-center gap-3">
            <span className={`w-5 text-center text-xs font-bold ${i === 0 ? 'text-warning' : 'text-text-secondary'}`}>
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`}
            </span>
            <span className="text-xs w-20 text-text-secondary">{r.label}</span>
            <div className="flex-1 bg-secondary rounded-full h-3">
              <div className="h-full rounded-full bg-accent transition-all flex items-center justify-end px-1"
                style={{ width: `${Math.max(5, (r.minutes / maxMinutes) * 100)}%` }}>
                <span className="text-[8px] text-white font-medium">{Math.round(r.minutes)}min</span>
              </div>
            </div>
            <span className="text-[10px] text-text-secondary w-8 text-right">{r.count} ses</span>
          </div>
        ))}
      </div>
    </div>
  )
}
