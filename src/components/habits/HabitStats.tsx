import { useMemo } from 'react'
import type { Habit, HabitLog } from '../../supabase/types'
import { calculateStreak } from '../../lib/streakCalculator'

interface Props {
  habits: Habit[]
  logs: HabitLog[]
  monthKey: string
}

export function HabitStats({ habits, logs, monthKey }: Props) {
  const [year, month] = monthKey.split('-').map(Number)
  const daysInMonth = new Date(year, month, 0).getDate()

  const habitStats = useMemo(() => {
    return habits.map((habit) => {
      const habitLogs = logs.filter((l) => l.habit_id === habit.id)
      const completedDays = new Set(habitLogs.map((l) => l.date)).size
      const completionRate = Math.round((completedDays / daysInMonth) * 100)
      const streak = calculateStreak(habitLogs.map((l) => ({ date: l.date })))
      return { ...habit, completedDays, completionRate, streak }
    })
  }, [habits, logs, daysInMonth])

  return (
    <div className="space-y-3">
      {habitStats.map((h) => (
        <div key={h.id} className="bg-secondary rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: h.color }} />
              <span className="text-sm font-medium">{h.name}</span>
            </div>
            <span className="text-xs text-text-secondary">{h.completionRate}%</span>
          </div>

          <div className="w-full bg-[var(--bg-primary)] rounded-full h-1.5 mb-2">
            <div className="h-full rounded-full transition-all" style={{ width: `${h.completionRate}%`, backgroundColor: h.color }} />
          </div>

          <div className="flex items-center gap-3 text-[10px] text-text-secondary">
            <span>✓ {h.completedDays}/{daysInMonth} días</span>
            <span>🔥 racha: {h.streak.current} días</span>
            <span>🏆 mejor: {h.streak.best} días</span>
          </div>
        </div>
      ))}
    </div>
  )
}
