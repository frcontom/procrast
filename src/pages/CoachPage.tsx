import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../supabase/client'
import { useUser } from '../supabase/auth'
import type { CoachingMessage } from '../supabase/types'
import { CoachMessages } from '../components/coach/CoachMessages'
import { CoachInsights } from '../components/coach/CoachInsights'

export function CoachPage() {
  const user = useUser()
  const [messages, setMessages] = useState<CoachingMessage[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [currentStreak, setCurrentStreak] = useState(0)
  const [goalProgress, setGoalProgress] = useState(0)

  const loadData = useCallback(() => {
    if (!user) return
    supabase.from('coaching_messages').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data }: any) => {
      if (data) setMessages(data)
    })
    supabase.from('sessions').select('*').eq('user_id', user.id).eq('state', 'completed').order('started_at', { ascending: false }).limit(50).then(({ data }: any) => {
      if (data) setSessions(data)
    })
    supabase.from('statistics').select('current_streak').eq('user_id', user.id).single().then(({ data }: any) => {
      if (data) setCurrentStreak(data.current_streak || 0)
    })
    supabase.from('task_goals').select('estimated_minutes').eq('user_id', user.id).eq('status', 'active').then(({ data: goals }: any) => {
      if (goals && goals.length > 0) {
        supabase.from('task_subtasks').select('completed_minutes, estimated_minutes').in('goal_id', goals.map((g: any) => g.id)).then(({ data: subs }: any) => {
          if (subs && subs.length > 0) {
            const total = subs.reduce((a: number, s: any) => a + (s.estimated_minutes || 0), 0)
            const done = subs.reduce((a: number, s: any) => a + (s.completed_minutes || 0), 0)
            setGoalProgress(total > 0 ? Math.round((done / total) * 100) : 0)
          }
        })
      }
    })
  }, [user])

  useEffect(() => { loadData() }, [loadData])

  const markShown = async (id: string) => {
    await supabase.from('coaching_messages').update({ shown: true }).eq('id', id)
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, shown: true } : m)))
  }

  const generateInsight = async () => {
    if (!user) return
    const tips = [
      { title: 'Recordatorio', msg: 'Tomar pausas de 5 minutos entre sesiones mejora la retención.', type: 'insight' },
      { title: 'Consejo', msg: 'Divide tareas grandes en bloques de 25 minutos.', type: 'nudge' },
      { title: 'Dato', msg: 'Personas que registran su progreso tienen 33% más probabilidad de cumplir metas.', type: 'insight' },
    ]
    const t = tips[Math.floor(Math.random() * tips.length)]
    const { data }: any = await supabase.from('coaching_messages').insert({
      user_id: user.id, msg_type: t.type, category: 'general', title: t.title, message: t.msg,
    }).select().single()
    if (data) setMessages((prev) => [data, ...prev])
  }

  const completedSessions = sessions.filter((s: any) => s.state === 'completed')

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">AI Coach</h2>
          <button onClick={generateInsight}
            className="text-xs text-accent hover:text-white transition-colors">
            + Generar insight
          </button>
        </div>
        <CoachMessages messages={messages} onMarkShown={markShown} />
      </div>

      <div className="space-y-4">
        <CoachInsights
          sessions={completedSessions}
          currentStreak={currentStreak}
          goalProgress={goalProgress}
        />

        <div className="bg-card rounded-xl border border-white/10 p-4">
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Estadísticas</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-text-secondary">Sesiones completadas</span>
              <span className="font-medium">{completedSessions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Racha actual</span>
              <span className="font-medium">{currentStreak} días</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Progreso metas</span>
              <span className="font-medium">{goalProgress}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Mensajes del coach</span>
              <span className="font-medium">{messages.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
