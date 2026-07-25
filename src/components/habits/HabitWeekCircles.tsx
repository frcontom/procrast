import type { Habit, HabitLog } from '../../supabase/types'

interface Props {
  habits: Habit[]
  logs: HabitLog[]
}

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export function HabitWeekCircles({ habits, logs }: Props) {
  const today = new Date()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay())

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return {
      dateStr: d.toISOString().slice(0, 10),
      dayName: DAYS[d.getDay()],
      dayNum: d.getDate(),
      isToday: d.toISOString().slice(0, 10) === today.toISOString().slice(0, 10),
    }
  })

  const completedDays = weekDays.filter((wd) => {
    const doneCount = habits.filter((h) => logs.some((l) => l.habit_id === h.id && l.date === wd.dateStr)).length
    return doneCount >= habits.length && habits.length > 0
  }).length

  return (
    <div className="bg-secondary/30 rounded-xl p-4 border border-white/[0.04]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-medium text-text-secondary uppercase tracking-wider">Últimos 7 días</span>
        <span className="text-[10px] text-text-secondary/50">{completedDays}/7 completos</span>
      </div>
      <div className="flex items-center justify-between gap-1">
        {weekDays.map(({ dateStr, dayName, dayNum, isToday }) => {
          const doneCount = habits.filter((h) => logs.some((l) => l.habit_id === h.id && l.date === dateStr)).length
          const allDone = doneCount >= habits.length && habits.length > 0
          const someDone = doneCount > 0 && !allDone
          const isPast = dateStr < today.toISOString().slice(0, 10)
          const pct = habits.length > 0 ? Math.round((doneCount / habits.length) * 100) : 0

          let bg = 'bg-white/5'
          let border = 'border-white/5'
          let text = 'text-text-secondary/30'
          let label = ''
          let indicator = ''

          if (allDone) { bg = 'bg-[#28C76F]'; border = 'border-[#28C76F]'; text = 'text-white'; label = '100%'; indicator = '✓' }
          else if (someDone && isPast) { bg = 'bg-[#FF9800]/20'; border = 'border-[#FF9800]/30'; text = 'text-[#FF9800]'; label = `${pct}%`; indicator = '◐' }
          else if (isPast && !someDone) { bg = 'bg-[#EA5455]/8'; border = 'border-[#EA5455]/15'; text = 'text-[#EA5455]/40'; label = '0%'; indicator = '✕' }

          if (isToday) {
            bg = allDone ? 'bg-[#28C76F]' : someDone ? 'bg-[#FF9800]/20' : 'bg-secondary'
            border = 'border-accent/60'
            text = allDone ? 'text-white' : someDone ? 'text-[#FF9800]' : 'text-accent'
            label = allDone ? '100%' : someDone ? `${pct}%` : 'Hoy'
            indicator = allDone ? '✓' : someDone ? '◐' : '◉'
          }

          if (!isPast && !isToday) {
            bg = 'bg-white/[0.02]'
            border = 'border-white/5'
            text = 'text-white/20'
            label = ''
            indicator = ''
          }

          return (
            <div key={dateStr} className="flex flex-col items-center gap-1.5 flex-1">
              <div className={`w-full h-[3px] rounded-full ${bg} ${border} transition-all`} />
              <div className={`flex flex-col items-center ${isToday ? 'mt-0.5' : 'mt-1.5'}`}>
                {indicator ? (
                  <span className={`text-base ${text}`}>{indicator}</span>
                ) : (
                  <span className="text-[10px] font-medium text-white/20">{dayNum}</span>
                )}
                {label && !indicator && <span className="text-[7px] text-text-secondary/40 mt-0.5">{label}</span>}
              </div>
              <span className={`text-[9px] ${isToday ? 'text-accent font-medium' : 'text-text-secondary/40'}`}>{dayName}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
