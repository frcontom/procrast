// Repetición espaciada: SM-2 simplificado.
// quality 0-5: 0-2 = fallaste, 3-5 = acertaste (3 duro, 5 fácil).
// Devuelve el nuevo estado de la tarjeta.

export interface SrsState {
  ease: number
  interval_days: number
  repetitions: number
}

export function scheduleNext(prev: SrsState, quality: number): SrsState {
  const q = Math.max(0, Math.min(5, quality))

  if (q < 3) {
    // Falló: reinicia, vuelve a aparecer mañana
    return { ease: Math.max(1.3, prev.ease - 0.2), interval_days: 1, repetitions: 0 }
  }

  const repetitions = prev.repetitions + 1
  let interval_days: number
  if (repetitions === 1) interval_days = 1
  else if (repetitions === 2) interval_days = 3
  else interval_days = Math.round(prev.interval_days * prev.ease)

  // Ajuste del factor de facilidad
  const ease = Math.max(1.3, prev.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)))

  return { ease, interval_days, repetitions }
}

// Fecha YYYY-MM-DD a N días desde hoy, en hora local (sin desfase UTC)
export function dueInDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayStr(): string {
  return dueInDays(0)
}
