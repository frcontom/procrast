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

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

interface MonthData {
  label: string
  days: { date: Date | null; key: string; future: boolean }[]
}

export function ReadingHeatmap({ activity }: Props) {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()

  // 4 meses: actual + 3 atrás
  const months: MonthData[] = []
  for (let offset = 3; offset >= 0; offset--) {
    const m = new Date(year, month - offset, 1)
    const y = m.getFullYear()
    const mo = m.getMonth()
    const daysInMonth = new Date(y, mo + 1, 0).getDate()
    const firstDay = new Date(y, mo, 1).getDay() // 0=Domingo
    const cells: MonthData['days'] = []
    // relleno inicial hasta domingo
    for (let i = 0; i < firstDay; i++) cells.push({ date: null, key: `pad-${offset}-${i}`, future: false })
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(y, mo, d)
      cells.push({ date, key: date.toLocaleDateString('en-CA'), future: date > today })
    }
    months.push({ label: `${MONTH_NAMES[mo]} ${y}`, days: cells })
  }

  const totalDays = Object.values(activity).filter((m) => m > 0).length

  return (
    <div className="bg-card rounded-xl border border-white/10 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">📅 Actividad de lectura</span>
        <span className="text-[10px] text-text-secondary">{totalDays} días con lectura · últimos 4 meses</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {months.map((mo, mi) => (
          <div key={mi}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#a66cff' }}>{mo.label}</span>
            </div>
            <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {mo.days.map((d) => {
                if (!d.date) {
                  return <div key={d.key} />
                }
                const min = Math.round(activity[d.key] || 0)
                const hasActivity = min > 0
                return (
                  <div key={d.key}
                    title={`${d.date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })} — ${min}min`}
                    style={{
                      backgroundColor: d.future ? 'transparent' : heatColor(min),
                      aspectRatio: '1/1',
                      borderRadius: 4,
                      opacity: d.future ? 0 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 8,
                      fontWeight: hasActivity ? 700 : 400,
                      color: min >= 30 ? '#fff' : 'rgba(255,255,255,0.4)',
                    }}>
                    {!d.future && d.date.getDate()}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 mt-3 text-[9px] text-text-secondary/60 justify-center">
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