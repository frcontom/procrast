interface Props {
  sessions: any[]
}

const LABELS: Record<string, string> = {
  estudio: 'Estudio',
  programacion: 'Programación',
  trading: 'Trading',
  lectura: 'Lectura',
  escritura: 'Escritura',
  trabajo: 'Trabajo',
}

const COLORS = ['#A66CFF', '#FF6B6B', '#4CAF50', '#FF9800', '#156390', '#00BCD4', '#E91E63']

export function ActivityBreakdown({ sessions }: Props) {
  const grouped: Record<string, number> = {}
  let total = 0

  sessions
    .filter((s: any) => s.state === 'completed')
    .forEach((s: any) => {
      const type = s.activity_type || 'focus'
      const mins = Math.round((s.elapsed_seconds || 0) / 60)
      grouped[type] = (grouped[type] || 0) + mins
      total += mins
    })

  const entries = Object.entries(grouped).sort((a, b) => b[1] - a[1])

  if (entries.length === 0) return null

  return (
    <div className="bg-card rounded-xl border border-white/10 p-4">
      <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">Por actividad</h3>
      <div className="space-y-2">
        {entries.map(([type, mins], i) => {
          const pct = total > 0 ? Math.round((mins / total) * 100) : 0
          const color = COLORS[i % COLORS.length]
          return (
            <div key={type}>
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-text-secondary">{LABELS[type] || type}</span>
                </div>
                <span className="font-medium">{mins} min <span className="text-text-secondary">({pct}%)</span></span>
              </div>
              <div className="w-full bg-secondary rounded-full h-1.5">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
