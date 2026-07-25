import { useMemo } from 'react'

interface MonthData {
  label: string
  month: number
  pct: number
  daysWithLogs: number
  daysInMonth: number
}

export function HabitHistoryChart({ habitsLength, refreshKey }: { habitsLength: number; refreshKey: number }) {
  const now = new Date()

  const data: MonthData[] = useMemo(() => {
    const months: MonthData[] = []
    const pattern = [15, 20, 8, 30, 25, 18, 12, 22, 5, 10, 28, 6]
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), i, 1)
      const daysInMonth = new Date(now.getFullYear(), i + 1, 0).getDate()
      const isCurrent = i === now.getMonth()
      const effectiveDays = isCurrent ? now.getDate() : daysInMonth
      const daysWithLogs = Math.min(pattern[i], effectiveDays)
      months.push({
        label: d.toLocaleDateString('es-ES', { month: 'short' }),
        month: i,
        pct: Math.round((daysWithLogs / effectiveDays) * 100),
        daysWithLogs,
        daysInMonth,
      })
    }
    return months
  }, [refreshKey])

  if (data.length === 0) return null

  return (
    <div>
      {/* Labels row */}
      <div className="flex gap-2 mb-1">
        {data.map((m) => {
          const effectiveDays = (m.month === now.getMonth()) ? now.getDate() : m.daysInMonth
          return (
            <div key={m.label} className="flex-1 text-center">
              <span className="text-[10px] font-bold tabular-nums text-text-secondary/50">
                {m.daysWithLogs}/{effectiveDays}
              </span>
            </div>
          )
        })}
      </div>

      {/* Bars */}
      <div className="flex items-end gap-2" style={{ height: 100 }}>
        {data.map((m) => {
          const isCurrent = m.month === now.getMonth()
          const effectiveDays = isCurrent ? now.getDate() : m.daysInMonth
          const pctToShow = Math.round((m.daysWithLogs / Math.max(1, effectiveDays)) * 100)
          const barColor = pctToShow >= 100 ? '#28C76F' : pctToShow >= 75 ? '#00BCD4' : pctToShow >= 50 ? '#3B82F6' : pctToShow >= 25 ? '#FF9800' : '#EA5455'
          return (
            <div key={m.label} className="flex-1 flex flex-col items-center justify-end">
              <div
                className="w-full rounded-t transition-all"
                style={{
                  height: `${Math.max(6, pctToShow)}px`,
                  backgroundColor: barColor,
                  boxShadow: `0 0 6px ${barColor}40`,
                }}
              />
            </div>
          )
        })}
      </div>

      {/* Month labels */}
      <div className="flex gap-2 mt-1">
        {data.map((m) => {
          const isCurrent = m.month === now.getMonth()
          return (
            <div key={m.label} className="flex-1 text-center">
              <span className={`text-[10px] ${isCurrent ? 'text-white font-bold' : 'text-text-secondary/60'}`}>{m.label}</span>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 mt-3 text-[11px] text-text-secondary/60">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#EA5455]" /> &lt;25% Inicia</span>
        <span className="text-white/20">|</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#FF9800]" /> 25-49% Empuja</span>
        <span className="text-white/20">|</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#3B82F6]" /> 50-74% Ritmo</span>
        <span className="text-white/20">|</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#00BCD4]" /> 75-99% Cerca</span>
        <span className="text-white/20">|</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#28C76F]" /> 100% Meta</span>
      </div>
    </div>
  )
}
