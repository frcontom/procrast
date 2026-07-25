import { useEffect, useState } from 'react'
import { supabase } from '../../supabase/client'
import { useUser } from '../../supabase/auth'
import type { TaskGoal } from '../../supabase/types'

export function GoalHistory() {
  const user = useUser()
  const [goals, setGoals] = useState<TaskGoal[]>([])
  const [selected, setSelected] = useState<TaskGoal | null>(null)

  useEffect(() => {
    if (!user) return
    supabase.from('task_goals').select('*').eq('user_id', user.id).in('status', ['completed', 'archived']).order('completed_at', { ascending: false }).then(({ data }: any) => {
      if (data) setGoals(data)
    })
  }, [user])

  if (selected) {
    return (
      <div className="space-y-4">
        <button onClick={() => setSelected(null)} className="text-xs text-accent hover:text-white transition-colors">← Volver al historial</button>
        <div className="bg-card rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{selected.icon || '🎯'}</span>
            <span className="text-lg font-semibold">{selected.name}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-text-secondary">{selected.status === 'completed' ? 'Completada' : 'Archivada'}</span>
          </div>
          {selected.description && <p className="text-sm text-text-secondary mb-3">{selected.description}</p>}
          <div className="flex items-center gap-3 text-xs text-text-secondary">
            <span>⏱ {selected.estimated_minutes}min</span>
            <span>📅 {selected.deadline}</span>
            {selected.completed_at && <span>✅ {new Date(selected.completed_at).toLocaleDateString()}</span>}
          </div>
        </div>
      </div>
    )
  }

  if (goals.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-white/10 p-12 text-center text-text-secondary text-sm">
        <div className="text-3xl mb-2">🕐</div>
        <p>Sin metas completadas o archivadas</p>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl border border-white/10 p-4">
      <div className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">🕐 Historial de metas</div>
      <div className="space-y-2">
        {goals.map((g) => (
          <div key={g.id} onClick={() => setSelected(g)}
            className="flex items-center justify-between p-3 rounded-lg bg-secondary hover:bg-white/5 cursor-pointer transition-colors">
            <div className="flex items-center gap-2">
              <span>{g.icon || '🎯'}</span>
              <div>
                <div className="text-xs font-medium">{g.name}</div>
                <div className="text-[10px] text-text-secondary">{g.status === 'completed' ? '✅ Completada' : '📦 Archivada'} · {g.estimated_minutes}min</div>
              </div>
            </div>
            <span className="text-[10px] text-text-secondary">{g.completed_at ? new Date(g.completed_at).toLocaleDateString() : ''}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
