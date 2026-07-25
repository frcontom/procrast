interface Props {
  totalSessions: number
  completedSessions: number
  totalMinutes: number
  currentStreak: number
}

export function StatsOverview({ totalSessions, completedSessions, totalMinutes, currentStreak }: Props) {
  const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0

  const cards = [
    { label: 'Total', value: totalSessions, color: 'text-accent' },
    { label: 'Completadas', value: completedSessions, color: 'text-success' },
    { label: 'Tasa', value: `${completionRate}%`, color: completionRate >= 70 ? 'text-success' : 'text-warning' },
    { label: 'Tiempo', value: `${totalMinutes}m`, color: 'text-[#00BCD4]' },
    { label: 'Racha', value: `${currentStreak}d`, color: 'text-warning' },
  ]

  return (
    <div className="grid grid-cols-5 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="bg-card rounded-xl border border-white/10 p-3 text-center">
          <div className={`text-xl font-bold ${card.color}`}>{card.value}</div>
          <div className="text-[10px] text-text-secondary uppercase tracking-wider mt-1">{card.label}</div>
        </div>
      ))}
    </div>
  )
}
