import { useEffect, useState } from 'react'
import { supabase } from '../../supabase/client'
import { useUser } from '../../supabase/auth'
import type { TaskSubtask } from '../../supabase/types'

export function WeekView() {
  const user = useUser()
  const [grouped, setGrouped] = useState<Record<string, TaskSubtask[]>>({})

  useEffect(() => {
    if (!user) return
    supabase.from('task_subtasks').select('*, task_goals!inner(name)').eq('user_id', user.id).eq('status', 'pending').order('goal_id').then(({ data }: any) => {
      if (data) {
        const groups: Record<string, TaskSubtask[]> = {}
        data.forEach((st: any) => {
          const goalName = st.task_goals?.name || 'Sin meta'
          if (!groups[goalName]) groups[goalName] = []
          groups[goalName].push(st)
        })
        setGrouped(groups)
      }
    })
  }, [user])

  const entries = Object.entries(grouped)
  if (entries.length === 0) return <div className="text-center text-text-secondary text-xs py-12">No hay tareas pendientes esta semana 🎉</div>

  return (
    <div className="space-y-4">
      {entries.map(([goalName, subtasks]) => (
        <div key={goalName} className="bg-card rounded-xl border border-white/10 p-4">
          <div className="text-[11px] font-semibold text-white mb-2">{goalName}</div>
          <div className="space-y-1">
            {subtasks.slice(0, 5).map((st) => (
              <div key={st.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-secondary/30">
                <span className={`w-1.5 h-1.5 rounded-full ${st.difficulty === 'hard' ? 'bg-[#FF6B6B]' : st.difficulty === 'easy' ? 'bg-[#4CAF50]' : 'bg-[#FF9800]'}`} />
                <span className="text-xs text-text-secondary truncate flex-1">{st.name}</span>
                {st.estimated_minutes > 0 && <span className="text-[9px] text-text-secondary/40">{st.estimated_minutes}min</span>}
              </div>
            ))}
            {subtasks.length > 5 && (
              <div className="text-[9px] text-text-secondary/40 text-center pt-1">+{subtasks.length - 5} más</div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
