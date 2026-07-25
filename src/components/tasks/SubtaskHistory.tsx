import { useEffect, useState } from 'react'
import { supabase } from '../../supabase/client'
import { useUser } from '../../supabase/auth'
import type { TaskSubtask, TaskPomodoroLink } from '../../supabase/types'

interface Props {
  subtask: TaskSubtask
  onClose: () => void
}

export function SubtaskHistory({ subtask, onClose }: Props) {
  const user = useUser()
  const [logs, setLogs] = useState<TaskPomodoroLink[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase.from('task_pomodoro_links').select('*').eq('user_id', user.id).eq('subtask_id', subtask.id).order('date', { ascending: false }).limit(100).then(({ data }: any) => {
      if (data) setLogs(data)
      setLoading(false)
    })
  }, [user, subtask.id])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const totalMin = logs.reduce((a, l) => a + (l.minutes || 0), 0)
  const sessions = logs.length
  const progress = subtask.estimated_minutes > 0 ? Math.min(100, Math.round((totalMin / subtask.estimated_minutes) * 100)) : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-card rounded-xl border border-white/10 p-5 w-full max-w-lg mx-4 shadow-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-white">🕐 Historial: {subtask.name}</span>
          <button onClick={onClose} className="text-text-secondary hover:text-white text-lg leading-none">&times;</button>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: 'Total', value: `${totalMin}min` },
            { label: 'Sesiones', value: sessions.toString() },
            { label: 'Estimado', value: `${subtask.estimated_minutes}min` },
            { label: 'Progreso', value: `${progress}%` },
          ].map((s) => (
            <div key={s.label} className="bg-secondary rounded-lg p-2.5 text-center">
              <div className="text-base font-bold text-white">{s.value}</div>
              <div className="text-[10px] text-text-secondary mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 space-y-1">
          {loading ? (
            <div className="text-center text-text-secondary text-xs py-8">Cargando...</div>
          ) : logs.length === 0 ? (
            <div className="text-center text-text-secondary text-xs py-8">Sin registros</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/50 text-xs">
                <span className="text-text-secondary">◆ {log.date}</span>
                <span className="tabular-nums font-medium text-white">{log.minutes}min</span>
              </div>
            ))
          )}
        </div>

        <button onClick={onClose} className="mt-4 w-full bg-secondary hover:bg-white/10 text-text-secondary hover:text-white py-2 rounded-lg text-xs font-medium transition-all">
          Cerrar
        </button>
      </div>
    </div>
  )
}
