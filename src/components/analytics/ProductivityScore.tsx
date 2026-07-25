interface Props {
  completed: number
  total: number
  totalMinutes: number
}

export function ProductivityScore({ completed, total, totalMinutes }: Props) {
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
  const avgMinutesPerSession = completed > 0 ? Math.round(totalMinutes / completed) : 0

  const score = Math.min(100, Math.round(
    (completionRate * 0.5) + (Math.min(100, (totalMinutes / 300) * 100) * 0.3) + (Math.min(100, avgMinutesPerSession * 3) * 0.2)
  ))

  const getLevel = (s: number) => {
    if (s >= 90) return { label: 'Excelente', color: '#4CAF50' }
    if (s >= 70) return { label: 'Bueno', color: '#8BC34A' }
    if (s >= 50) return { label: 'Regular', color: '#FF9800' }
    return { label: 'Necesita mejorar', color: '#FF6B6B' }
  }

  const level = getLevel(score)

  return (
    <div className="bg-card rounded-xl border border-white/10 p-3 text-center">
      <div className="relative w-20 h-20 mx-auto mb-2">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="none" stroke="#1a1a2e" strokeWidth="8" />
          <circle cx="60" cy="60" r="52" fill="none" stroke={level.color} strokeWidth="8"
            strokeLinecap="round" strokeDasharray={`${(score / 100) * 326.7} 326.7`} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold" style={{ color: level.color }}>{score}</span>
          <span className="text-[8px] text-text-secondary uppercase">Pts</span>
        </div>
      </div>
      <div className="text-xs font-medium" style={{ color: level.color }}>{level.label}</div>
      <div className="text-[9px] text-text-secondary mt-0.5">{completed}/{total} · {totalMinutes}min</div>
    </div>
  )
}
