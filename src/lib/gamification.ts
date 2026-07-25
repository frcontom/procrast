export const LEVEL_THRESHOLDS = [
  0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600,
  4500, 5500, 6600, 7800, 9100, 10500, 12000, 13600,
  15300, 17100, 19000,
]

export const XP = {
  SESSION_COMPLETED: 50,
  SESSION_CANCELLED: 5,
  STREAK_BONUS: 20,
  HABIT_LOG: 5,
  TASK_POMODORO: (minutes: number) => minutes,
  GOAL_COMPLETED: 100,
}

export function calculateLevel(totalXp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) return i + 1
  }
  return 1
}

export function getXpForNextLevel(level: number): number {
  if (level >= LEVEL_THRESHOLDS.length) return 0
  return LEVEL_THRESHOLDS[level]
}

export function getLevelProgress(totalXp: number, level: number): number {
  const currentThreshold = LEVEL_THRESHOLDS[Math.min(level - 1, LEVEL_THRESHOLDS.length - 1)]
  const nextThreshold = LEVEL_THRESHOLDS[Math.min(level, LEVEL_THRESHOLDS.length - 1)]
  if (nextThreshold <= currentThreshold) return 100
  const progress = ((totalXp - currentThreshold) / (nextThreshold - currentThreshold)) * 100
  return Math.min(100, Math.round(progress))
}

export function getLevelTitle(level: number): string {
  if (level >= 20) return 'Master Focus'
  if (level >= 15) return 'Legend'
  if (level >= 10) return 'Veteran'
  if (level >= 5) return 'Warrior'
  if (level >= 3) return 'Apprentice'
  return 'Beginner'
}
