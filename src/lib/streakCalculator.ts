export function calculateStreak(logs: { date: string }[]): {
  current: number
  best: number
  lastDate: string | null
} {
  if (logs.length === 0) return { current: 0, best: 0, lastDate: null }

  const sorted = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  let current = 1
  for (let i = 1; i < sorted.length; i++) {
    const diffDays = Math.round(
      (new Date(sorted[i - 1].date).getTime() - new Date(sorted[i].date).getTime()) / 86400000
    )
    if (diffDays === 1) current++
    else break
  }

  let best = 1
  let temp = 1
  for (let i = 1; i < sorted.length; i++) {
    const diffDays = Math.round(
      (new Date(sorted[i - 1].date).getTime() - new Date(sorted[i].date).getTime()) / 86400000
    )
    if (diffDays === 1) {
      temp++
      best = Math.max(best, temp)
    } else {
      temp = 1
    }
  }

  return { current, best, lastDate: sorted[0].date }
}
