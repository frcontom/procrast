export interface GoalData {
  startDate: Date
  deadline: Date
  estimatedMinutes: number
  completedMinutes: number
}

export interface RhythmResult {
  daysElapsed: number
  daysRemaining: number
  daysTotal: number
  progressPct: number
  rhythmDaily: number
  neededDaily: number
  todayActual: number
  expectedNow: number
  behind: boolean
  status: 'on_track' | 'behind' | 'completed' | 'pending'
  statusLabel: string
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

export function calculateRhythm(goal: GoalData): RhythmResult {
  const today = new Date()
  const totalDays = Math.max(1, daysBetween(goal.startDate, goal.deadline))
  const elapsedDays = Math.max(0, daysBetween(goal.startDate, today))
  const remainingDays = Math.max(0, daysBetween(today, goal.deadline))

  const rhythmDaily = Math.round(goal.estimatedMinutes / totalDays)
  const expectedNow = rhythmDaily * Math.min(elapsedDays + 1, totalDays)
  const progressPct = Math.min(100, Math.round((goal.completedMinutes / goal.estimatedMinutes) * 100))
  const behind = goal.completedMinutes < expectedNow * 0.8
  const neededDaily = remainingDays > 0
    ? Math.round((goal.estimatedMinutes - goal.completedMinutes) / remainingDays)
    : (goal.estimatedMinutes - goal.completedMinutes)

  let status: RhythmResult['status'] = 'on_track'
  if (progressPct >= 100) status = 'completed'
  else if (progressPct <= 0) status = 'pending'
  else if (behind) status = 'behind'

  const statusLabels: Record<RhythmResult['status'], string> = {
    on_track: 'En ritmo',
    behind: 'Atrasado',
    completed: 'Completada',
    pending: 'Sin empezar',
  }

  return {
    daysElapsed: elapsedDays,
    daysRemaining: remainingDays,
    daysTotal: totalDays,
    progressPct: isNaN(progressPct) ? 0 : progressPct,
    rhythmDaily,
    neededDaily,
    todayActual: 0,
    expectedNow,
    behind,
    status,
    statusLabel: statusLabels[status],
  }
}
