interface Props {
  activity: Record<string, number>
}

function heatColor(minutes: number): string {
  if (minutes <= 0) return 'rgba(255,255,255,0.05)'
  if (minutes < 5) return 'rgba(166,108,255,0.25)'
  if (minutes < 15) return 'rgba(166,108,255,0.45)'
  if (minutes < 30) return 'rgba(166,108,255,0.7)'
  return '#a66cff'
}

const DAY_NAMES = ['D', 'L', 'M', 'X', 'J', 'V', 'S']

export function ReadingHeatmap({ activity }: Props) {
  const today = new Date()
  const weeks = 14
  const days: { date: Date; key: string }[] = []
  const start = new Date(today)
  start.setDate(start.getDate() - (weeks * 7 - 1))
  const anchor = new Date(start)
  anchor.setDate(anchor.getDate() - anchor.getDay())
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(anchor)
    d.setDate(anchor.getDate() + i)
    if (d > today) continue
    days.push({ date: d, key: d.toLocaleDateString('en-CA') })
  }

  const weeksArr: { date: Date; key: string }[][] = []
  for (let w = 0; w < weeks; w++) {
    weeksArr.push(days.slice(w * 7, w * 7 + 7))
  }

  const totalDays = days.filter((d) => (activity[d.key] || 0) > 0).length

  return (
    <div className="bg-card rounded-xl border border-white/10 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">📅 Actividad de lectura</span>
        <span className="text-[10px] text-text-secondary">{totalDays} días con lectura · últimas {weeks} semanas</span>
      </div>
      <div className="flex gap-1.5 max-w-[700px] mx-auto">
        <div className="flex flex-col justify-between text-[10px] text-text-secondary/50 pr-1.5">
          {DAY_NAMES.map((dn, i) => (
            <span key={i} className="flex items-center leading-none">{dn}</span>
          ))}
        </div>
        <div className="flex-1 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${weeks}, 1fr)` }}>
          {weeksArr.map((week, wi) => (
            <div key={wi} className="grid gap-1.5" style={{ gridTemplateRows: 'repeat(7, 1fr)' }}>
              {week.map((d) => {
                const min = Math.round(activity[d.key] || 0)
                return (
                  <div key={d.key}
                    title={`${d.date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} — ${min}min`}
                    style={{ backgroundColor: heatColor(min), aspectRatio: '1/1', borderRadius: 4 }} />
                )
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-3 text-[9px] text-text-secondary/60">
        <span>Menos</span>
        <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', width: 12, height: 12, borderRadius: 3 }} />
        <div style={{ backgroundColor: 'rgba(166,108,255,0.25)', width: 12, height: 12, borderRadius: 3 }} />
        <div style={{ backgroundColor: 'rgba(166,108,255,0.45)', width: 12, height: 12, borderRadius: 3 }} />
        <div style={{ backgroundColor: 'rgba(166,108,255,0.7)', width: 12, height: 12, borderRadius: 3 }} />
        <div style={{ backgroundColor: '#a66cff', width: 12, height: 12, borderRadius: 3 }} />
        <span>Más</span>
      </div>
    </div>
  )
}