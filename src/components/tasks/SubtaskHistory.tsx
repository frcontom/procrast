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
    supabase.from('task_pomodoro_links').select('*').eq('user_id', user.id).eq('subtask_id', subtask.id).order('created_at', { ascending: false }).limit(100).then(({ data }: any) => {
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

  const completedLogs = logs.filter((l) => !l.subtask_name?.includes('(cancelado)'))
  const cancelledLogs = logs.filter((l) => l.subtask_name?.includes('(cancelado)'))
  const totalMin = completedLogs.reduce((a, l) => a + (l.minutes || 0), 0)
  const progress = subtask.estimated_minutes > 0 ? Math.min(100, Math.round((totalMin / subtask.estimated_minutes) * 100)) : 0
  const successRate = logs.length > 0 ? Math.round((completedLogs.length / logs.length) * 100) : 0

  const totalTimeAll = logs.reduce((a, l) => a + (l.minutes || 0), 0)
  const wastedMin = cancelledLogs.reduce((a, l) => a + (l.minutes || 0), 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-card rounded-xl border border-white/10 p-6 w-full max-w-lg mx-4 shadow-2xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center text-base">🕐</div>
            <div>
              <h3 className="text-sm font-semibold text-white leading-tight">Historial</h3>
              <p className="text-[11px] text-text-secondary">{subtask.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-md bg-secondary hover:bg-white/10 text-text-secondary hover:text-white transition-all text-sm">&times;</button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          <div className="bg-secondary rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-white">{totalMin}<span className="text-xs font-normal text-text-secondary ml-0.5">/{subtask.estimated_minutes}min</span></div>
            <div className="text-[9px] text-text-secondary uppercase tracking-wider mt-1">Completado</div>
            <div className="mt-2 w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-accent to-[#b388ff] transition-all duration-700" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="bg-secondary rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-success">{completedLogs.length}</div>
            <div className="text-[9px] text-text-secondary uppercase tracking-wider mt-1">✅ Éxito</div>
          </div>
          <div className="bg-secondary rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-danger">{cancelledLogs.length}</div>
            <div className="text-[9px] text-text-secondary uppercase tracking-wider mt-1">❌ Fallo</div>
          </div>
          <div className="bg-secondary rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-white">{successRate}%</div>
            <div className="text-[9px] text-text-secondary uppercase tracking-wider mt-1">Tasa</div>
          </div>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-medium text-text-secondary uppercase tracking-wider">Registro de sesiones</span>
            {wastedMin > 0 && <span className="text-[9px] text-danger/40">{wastedMin}min en intentos fallidos</span>}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
              <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin mb-3" />
              <span className="text-xs">Cargando historial...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
              <div className="text-2xl mb-2 opacity-30">📭</div>
              <p className="text-xs">No hay sesiones registradas</p>
              <p className="text-[10px] text-text-secondary/40 mt-1">Inicia un Pomodoro desde esta tarea para ver resultados</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-white/5" />
              <div className="space-y-0">
                {logs.map((log) => {
                  const isCancelled = log.subtask_name?.includes('(cancelado)')
                  return (
                    <div key={log.id} className="relative flex items-start gap-3 py-2.5 group">
                      {/* Timeline dot + line */}
                      <div className="relative z-10 shrink-0 flex flex-col items-center">
                        <div className={`w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] border-2 transition-all ${
                          isCancelled
                            ? 'bg-danger/10 border-danger/30 text-danger/60'
                            : 'bg-success/10 border-success/30 text-success'
                        }`}>
                          {isCancelled ? '✕' : '✓'}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium text-white/80">{log.date}</span>
                          <span className={`text-[11px] tabular-nums font-bold ${isCancelled ? 'text-danger/50 line-through' : 'text-white'}`}>
                            {log.minutes}min
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {isCancelled ? (
                            <span className="text-[10px] text-danger/40 italic">Cancelado</span>
                          ) : (
                            <span className="text-[10px] text-success/60">✅ Completado</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
          <span className="text-[9px] text-text-secondary/40">{totalTimeAll}min de esfuerzo total ({wastedMin}min perdidos)</span>
          <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-[10px] font-medium bg-secondary hover:bg-white/10 text-text-secondary hover:text-white transition-all">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}