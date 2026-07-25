export function generateNudge(data: { elapsedSeconds: number }): string | null {
  const minutes = Math.floor(data.elapsedSeconds / 60)
  if (minutes >= 45) return 'Sesión extendida. Excelente resistencia mental.'
  if (minutes >= 25) return 'Buen ritmo. Sigue así.'
  return null
}

export function generateStreakMessage(streak: number): string | null {
  if (streak === 0) return 'Comienza una sesión hoy para iniciar una nueva racha.'
  if (streak === 1) return 'Primer día. El segundo es el más importante.'
  if (streak === 3) return '¡3 días seguidos! Estás construyendo el hábito.'
  if (streak === 7) return '¡7 días! Una semana completa de consistencia.'
  if (streak === 30) return '¡30 DÍAS! Has formado un hábito sólido.'
  return null
}

export function generateGoalMessage(progressPct: number): string | null {
  if (progressPct >= 100) return '¡Meta completada! Revisa tu progreso y celebra.'
  if (progressPct >= 75) return 'Estás muy cerca de completar tu meta. ¡Último empujón!'
  if (progressPct >= 50) return 'Mitad del camino. Sigue el ritmo.'
  if (progressPct === 0) return 'Meta sin progreso aún. ¿Qué primer paso puedes dar hoy?'
  return null
}

export function generateXpMessage(xpGained: number, totalXp: number, level: number): string {
  return `+${xpGained} XP · Nivel ${level} · Total: ${totalXp} XP`
}
