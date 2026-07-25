import { useEffect, useState } from 'react'
import { supabase } from '../../supabase/client'
import { useUser } from '../../supabase/auth'
import { formatDate } from '../../lib/formatters'
import type { TaskGoal } from '../../supabase/types'

export function GoalHistory() {
  const user = useUser()
  const [goals, setGoals] = useState<TaskGoal[]>([])

  useEffect(() => {
    if (!user) return
    supabase.from('task_goals')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['completed', 'archived'])
      .order('completed_at', { ascending: false })
      .limit(10)
      .then(({ data }: any) => {
        if (data) setGoals(data)
      })
  }, [user])

  if (goals.length === 0) return null

  return (
    <div className="bg-card rounded-xl border border-white/10 p-4">
      <h3 className="text-xs uppercase tracking-wider text-text-secondary font-semibold mb-3">
        Metas completadas
      </h3>
      <div className="space-y-2">
        {goals.map((g) => (
          <div key={g.id} className="flex items-center justify-between bg-secondary/50 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-success">✓</span>
              <span className="text-xs">{g.name}</span>
            </div>
            <span className="text-[10px] text-text-secondary">
              {g.completed_at ? formatDate(g.completed_at) : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
