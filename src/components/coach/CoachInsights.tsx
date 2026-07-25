import { useMemo } from 'react'
import { generateNudge, generateStreakMessage, generateGoalMessage } from '../../lib/coachMessages'

interface Props {
  sessions: any[]
  currentStreak: number
  goalProgress: number
}

export function CoachInsights({ sessions, currentStreak, goalProgress }: Props) {
  const insights = useMemo(() => {
    const result: { icon: string; text: string }[] = []

    const lastSession = sessions[0]
    if (lastSession) {
      const nudge = generateNudge({ elapsedSeconds: lastSession.elapsed_seconds || 0 })
      if (nudge) result.push({ icon: '👋', text: nudge })
    }

    const streakMsg = generateStreakMessage(currentStreak)
    if (streakMsg) result.push({ icon: '🔥', text: streakMsg })

    const goalMsg = generateGoalMessage(goalProgress)
    if (goalMsg) result.push({ icon: '🎯', text: goalMsg })

    if (result.length === 0) {
      const tips = [
        'Comienza una sesión de focus para recibir retroalimentación',
        'Mantén una racha de 3 días seguidos para construir el hábito',
        'Define metas pequeñas y consistentes',
      ]
      result.push({ icon: '💡', text: tips[Math.floor(Math.random() * tips.length)] })
    }

    return result
  }, [sessions, currentStreak, goalProgress])

  return (
    <div className="bg-card rounded-xl border border-white/10 p-4">
      <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">Insights</h3>
      <div className="space-y-3">
        {insights.map((insight, i) => (
          <div key={i} className="flex items-start gap-3 bg-secondary rounded-lg p-3">
            <span className="text-base">{insight.icon}</span>
            <p className="text-xs text-text-secondary">{insight.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
