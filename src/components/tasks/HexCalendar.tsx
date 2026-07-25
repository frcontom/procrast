interface Props {
  startDate: string
  deadline: string
  estimatedMinutes: number
  completedMinutes: number
  subtaskDays: string[]
}

function getDaysBetween(start: Date, end: Date): Date[] {
  const days: Date[] = []
  const current = new Date(start)
  while (current <= end) {
    days.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  return days
}

function getStreak(subtaskDays: string[], start: Date): number {
  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    if (d < start) break
    const ds = d.toISOString().slice(0, 10)
    if (subtaskDays.includes(ds)) streak++
    else break
  }
  return streak
}

function countFailedDays(startDate: Date, endDate: Date, subtaskDays: string[], dailyTarget: number): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let failed = 0
  const current = new Date(startDate)
  while (current <= endDate && current < today) {
    const ds = current.toISOString().slice(0, 10)
    const count = subtaskDays.filter((d) => d === ds).length
    if (count * dailyTarget < dailyTarget) failed++
    current.setDate(current.getDate() + 1)
  }
  return failed
}

export function HexCalendar({ startDate, deadline, estimatedMinutes, completedMinutes, subtaskDays }: Props) {
  const start = new Date(startDate)
  const end = new Date(deadline)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = getDaysBetween(start, end)

  const dailyTarget = Math.max(1, Math.round(estimatedMinutes / days.length))
  const completedDays = days.filter((d) => d < today && subtaskDays.includes(d.toISOString().slice(0, 10))).length
  const futureDays = days.filter((d) => d >= today).length
  const failedDays = countFailedDays(start, end, subtaskDays, dailyTarget)
  const streak = getStreak(subtaskDays, start)

  const neededDaily = Math.max(0, Math.round((estimatedMinutes - completedMinutes) / Math.max(1, futureDays)))

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[13px] font-semibold text-white">📅 Calendario de ejecución</span>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 mb-2.5 text-[11px] text-text-secondary">
        <span>✅ {completedDays} cumplidos</span>
        <span>❌ {failedDays} fallados</span>
        <span>⏳ {futureDays} futuros</span>
        <span>⏱ {completedMinutes}min</span>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-text-secondary mb-2">
        <span>🔥 {streak}d racha</span>
      </div>

      {failedDays > 0 && (
        <div className="text-[11px] text-[#EA5455] mb-2">
          Fallaste {failedDays} día(s). Necesitas ~{neededDaily}min extra.
        </div>
      )}

      <div className="flex flex-wrap gap-[5px] justify-center">
        {days.map((date) => {
          const dateStr = date.toISOString().slice(0, 10)
          const isToday = date.getTime() === today.getTime()
          const isPast = date < today
          const completed = subtaskDays.filter((d) => d === dateStr).length > 0
          const failed = isPast && !completed

          let bg = 'rgba(255,255,255,0.05)'
          let opacity = 0.5
          let outline = 'none'

          if (isToday) {
            bg = 'rgba(21,99,144,0.15)'
            outline = '1px solid #156390'
            opacity = 1
          } else if (completed) {
            bg = '#28C76F'
            opacity = 1
          } else if (failed) {
            bg = 'rgba(234,84,85,0.12)'
            opacity = 1
          }

          return (
            <div
              key={dateStr}
              title={`${dateStr}${completed ? ' ✅' : failed ? ' ❌' : isToday ? ' 📍' : ''}`}
              style={{
                width: 52,
                height: 58,
                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                backgroundColor: bg,
                opacity,
                outline,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                color: completed ? '#fff' : '#a0a0b0',
                cursor: 'default',
                transition: 'opacity 0.2s',
              }}
            >
              {date.getDate()}
            </div>
          )
        })}
      </div>
    </div>
  )
}
