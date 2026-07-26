import type { Habit, HabitLog } from '../../supabase/types'

interface Props {
  habits: Habit[]
  logs: HabitLog[]
}

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export function HabitWeekCircles({ habits, logs }: Props) {
  const today = new Date()
  const todayStr = today.toLocaleDateString('en-CA')
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay())

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const dateStr = `${y}-${m}-${day}`
    const dayMonth = `${d.getDate()}/${d.getMonth() + 1}`
    const doneCount = habits.filter((h) => logs.some((l) => l.habit_id === h.id && l.date === dateStr)).length
    return {
      dateStr,
      dayName: DAYS[d.getDay()],
      dayMonth,
      dayNum: d.getDate(),
      allDone: doneCount >= habits.length && habits.length > 0,
      someDone: doneCount > 0 && !(doneCount >= habits.length && habits.length > 0),
      isPast: dateStr < todayStr,
      isToday: dateStr === todayStr,
      doneCount,
      pct: habits.length > 0 ? Math.round((doneCount / habits.length) * 100) : 0,
    }
  })

  const completedCount = weekDays.filter((d) => d.allDone).length

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-medium text-text-secondary uppercase tracking-wider">Últimos 7 días</span>
        <span className="text-[10px] text-text-secondary/50">{completedCount}/7 completos</span>
      </div>
      <div className="flex items-start justify-between relative">
        {/* Connecting line */}
        <div className="absolute top-[24px] left-[8%] right-[8%] h-px bg-white/5" />
        {weekDays.map((d) => {
          let gradient = ''
          let shadow = ''
          let textColor = 'text-white/20'
          let label = ''

          if (d.allDone) {
            gradient = 'bg-gradient-to-br from-[#28C76F] to-[#1E9B5B]'
            shadow = 'shadow-lg shadow-[#28C76F]/30'
            textColor = 'text-white'
            label = '✓'
          } else if (d.someDone && d.isPast) {
            gradient = 'bg-gradient-to-br from-[#FF9800] to-[#E65100]'
            shadow = 'shadow-lg shadow-[#FF9800]/20'
            textColor = 'text-white'
            label = `${d.pct}%`
          } else if (d.isPast && !d.someDone) {
            gradient = 'bg-gradient-to-br from-[#EA5455]/20 to-[#EA5455]/5'
            shadow = ''
            textColor = 'text-[#EA5455]/40'
            label = '✕'
          } else {
            gradient = 'bg-white/5'
            shadow = ''
            textColor = 'text-white/20'
          }

          if (d.isToday) {
            gradient = d.allDone
              ? 'bg-gradient-to-br from-[#28C76F] to-[#1E9B5B]'
              : d.someDone
                ? 'bg-gradient-to-br from-[#FF9800] to-[#E65100]'
                : 'bg-gradient-to-br from-accent/20 to-accent/5'
            shadow = d.allDone
              ? 'shadow-lg shadow-[#28C76F]/30 ring-2 ring-accent/40'
              : d.someDone
                ? 'shadow-lg shadow-[#FF9800]/20 ring-2 ring-accent/40'
                : 'ring-2 ring-accent/50 shadow-lg shadow-accent/10'
            textColor = d.allDone ? 'text-white' : d.someDone ? 'text-white' : 'text-accent'
            label = d.allDone ? '✓' : d.someDone ? `${d.pct}%` : '◉'
          }

          return (
            <div key={d.dateStr} className="flex flex-col items-center gap-1.5 flex-1 relative z-10">
              <div className={`w-[48px] h-[48px] rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${gradient} ${shadow} ${textColor}`}>
                {d.isToday || d.isPast ? (
                  <span className="drop-shadow-sm">{label}</span>
                ) : (
                  <span className="text-white/15 font-normal text-xs drop-shadow-sm">{d.dayNum}</span>
                )}
              </div>
              <span className={`text-[8px] ${d.isToday ? 'text-accent font-semibold' : 'text-text-secondary/40'} tracking-wide truncate max-w-[48px]`}>{d.dayName}</span>
              <span className={`text-[7px] ${d.isToday ? 'text-accent/60' : 'text-text-secondary/25'}`}>{d.dayMonth}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
