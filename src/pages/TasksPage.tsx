import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../supabase/client'
import { useUser } from '../supabase/auth'
import type { TaskGoal, TaskSubtask } from '../supabase/types'
import { GoalList } from '../components/tasks/GoalList'
import { TaskDashboard } from '../components/tasks/TaskDashboard'
import { GoalDetail } from '../components/tasks/GoalDetail'
import { GoalForm } from '../components/tasks/GoalForm'
import { GoalHistory } from '../components/tasks/GoalHistory'
import { TodayView } from '../components/tasks/TodayView'
import { WeekView } from '../components/tasks/WeekView'
import { sessionManager } from '../lib/sessionManager'
import { useTimerStore } from '../store/useTimerStore'

type TabView = 'metas' | 'hoy' | 'semana' | 'history'

export function TasksPage() {
  const user = useUser()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [goals, setGoals] = useState<TaskGoal[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState<TaskGoal | null>(null)
  const [tab, setTab] = useState<TabView>('metas')
  const [subtasks, setSubtasks] = useState<TaskSubtask[]>([])

  const selectedGoal = goals.find((g) => g.id === selectedId) || null

  const loadGoals = useCallback(() => {
    if (!user) return
    supabase.from('task_goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data }: any) => {
      if (data) setGoals(data)
    })
  }, [user])

  const loadSubtasks = useCallback((goalId: string) => {
    supabase.from('task_subtasks').select('*').eq('goal_id', goalId).order('sort_order').then(({ data }: any) => {
      if (data) setSubtasks(data)
    })
  }, [])

  const syncGoalEstimate = async (goalId: string, subs: TaskSubtask[]) => {
    const total = subs.reduce((a, s) => a + (s.estimated_minutes || 0), 0)
    await supabase.from('task_goals').update({ estimated_minutes: total }).eq('id', goalId)
    loadGoals()
  }

  // Auto-select goal from ?goal= param on mount
  useEffect(() => {
    const goalParam = searchParams.get('goal')
    if (goalParam && goals.length > 0) {
      const found = goals.find((g) => g.id === goalParam)
      if (found) {
        setSelectedId(goalParam)
        setTab('metas')
        loadSubtasks(goalParam)
      }
    }
  }, [searchParams, goals, loadSubtasks])

  // Reset when goal changes
  useEffect(() => {
    setSubtasks([])
  }, [selectedId])

  useEffect(() => { loadGoals() }, [loadGoals])

  useEffect(() => {
    if (selectedId) loadSubtasks(selectedId)
  }, [selectedId, loadSubtasks])

  // Refresh subtasks and goals after returning from a pomodoro session
  useEffect(() => {
    const needsRefresh = sessionStorage.getItem('_refreshSubtasks')
    if (needsRefresh === '1') {
      sessionStorage.removeItem('_refreshSubtasks')
      loadGoals()
      if (selectedId) loadSubtasks(selectedId)
      else {
        const gs = searchParams.get('goal')
        if (gs) loadSubtasks(gs)
      }
    }
    // Clear return goal and subtask from session manager
    const store = useTimerStore.getState()
    if (store.returnGoalId) store.setReturnGoal(null, null)
    sessionManager.setCurrentSubtask(null)
  })

  const selectGoal = (id: string) => {
    setSelectedId(id)
    setTab('metas')
    setSearchParams({ goal: id })
  }

  const saveGoal = async (data: any) => {
    if (!user) return
    if (editingGoal) {
      await supabase.from('task_goals').update(data).eq('id', editingGoal.id)
    } else {
      const { data: newGoal }: any = await supabase.from('task_goals').insert({ user_id: user.id, ...data }).select().single()
      if (newGoal) {
        setSelectedId(newGoal.id)
        setSearchParams({ goal: newGoal.id })
      }
    }
    setShowForm(false)
    setEditingGoal(null)
    loadGoals()
  }

  const updateSubtaskStatus = async (id: string, status: string) => {
    await supabase.from('task_subtasks').update({ status: status as 'pending' | 'completed' }).eq('id', id)
    const updated = subtasks.map((s) => (s.id === id ? { ...s, status: status as 'pending' | 'completed' } : s))
    setSubtasks(updated)
    const allDone = updated.every((s) => s.status === 'completed')
    if (allDone && selectedId && selectedGoal?.status === 'active') {
      await supabase.from('task_goals').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', selectedId)
      loadGoals()
    }
  }

  const startPomodoroFromSubtask = async (st: TaskSubtask) => {
    if (!user) return
    const sessionMinutes = Math.max(1, st.estimated_minutes)
    const store = useTimerStore.getState()
    store.setDuration(sessionMinutes)
    store.setActivityType('focus')
    store.setSessionName(st.name)
    store.setReturnGoal(selectedId, selectedGoal?.name || null)
    store.setCurrentSubtask(st.id)
    sessionManager.setUser(user.id)
    sessionManager.setCurrentSubtask(st.id)
    sessionStorage.setItem('_refreshSubtasks', '1')
    store.setIsStopwatch(false)
    await sessionManager.startSession(sessionMinutes, 'focus', st.name, false, false)
    store.setIsStopwatch(false)
    navigate('/focus/fullscreen')
  }

  const activeGoals = goals.filter((g) => g.status === 'active')

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎯</span>
          <span className="text-lg font-semibold">Metas</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowForm(true)}
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2 rounded-lg text-xs font-medium transition-all active:scale-[0.97]">
            + Nueva meta
          </button>
          <button onClick={() => setTab(tab === 'history' ? 'metas' : 'history')}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${tab === 'history' ? 'bg-[var(--accent)] text-white' : 'bg-secondary text-text-secondary hover:text-white'}`}>
            🕐 Historial
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => { setTab('metas'); setSelectedId(null) }}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === 'metas' ? 'bg-[var(--accent)] text-white' : 'bg-secondary text-text-secondary hover:text-white'}`}>
          🏴 Metas
        </button>
        <button onClick={() => setTab('hoy')}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === 'hoy' ? 'bg-[var(--accent)] text-white' : 'bg-secondary text-text-secondary hover:text-white'}`}>
          📅 Hoy
        </button>
        <button onClick={() => setTab('semana')}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === 'semana' ? 'bg-[var(--accent)] text-white' : 'bg-secondary text-text-secondary hover:text-white'}`}>
          📋 Semana
        </button>
      </div>

      {tab === 'history' ? (
        <GoalHistory />
      ) : tab === 'hoy' ? (
        <TodayView goals={activeGoals} onSelectGoal={selectGoal} />
      ) : tab === 'semana' ? (
        <WeekView />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <GoalList goals={activeGoals} selectedId={selectedId} onSelect={selectGoal} onEdit={(g) => { setEditingGoal(g); setShowForm(true) }} />
          </div>
          <div className="md:col-span-3">
            {selectedGoal ? (
              <GoalDetail
                goal={selectedGoal}
                subtasks={subtasks}
                onSubtaskToggle={(id, status) => updateSubtaskStatus(id, status)}
                onSubtaskDelete={async (id) => { await supabase.from('task_subtasks').delete().eq('id', id); const next = subtasks.filter((s) => s.id !== id); setSubtasks(next); if (selectedId) syncGoalEstimate(selectedId, next) }}
                onAddSubtask={async (data) => {
                  if (!user) return
                  const { data: ns }: any = await supabase.from('task_subtasks').insert({ user_id: user.id, goal_id: selectedId!, sort_order: subtasks.length, ...data }).select().single()
                  if (ns) { const next = [...subtasks, ns]; setSubtasks(next); if (selectedId) syncGoalEstimate(selectedId, next) }
                }}
                onEditSubtask={async (id, data) => {
                  if (!user) return
                  await supabase.from('task_subtasks').update(data).eq('id', id)
                  const next = subtasks.map((s) => s.id === id ? { ...s, ...data } : s)
                  setSubtasks(next)
                  if (selectedId) syncGoalEstimate(selectedId, next)
                }}
                onImportSubtasks={async (tasks) => {
                  if (!user || !selectedId) return
                  const toInsert = tasks.map((t: any, i: number) => ({ user_id: user.id, goal_id: selectedId, sort_order: subtasks.length + i, ...t }))
                  const { data }: any = await supabase.from('task_subtasks').insert(toInsert).select()
                  if (data) { const next = [...subtasks, ...data]; setSubtasks(next); syncGoalEstimate(selectedId, next) }
                }}
                onSetDependency={async (id, dependsOn) => {
                  if (!user) return
                  await supabase.from('task_subtasks').update({ depends_on: dependsOn }).eq('id', id)
                  setSubtasks((prev) => prev.map((s) => s.id === id ? { ...s, depends_on: dependsOn } : s))
                }}
                onCleanAll={async () => {
                  if (!user || !selectedId) return
                  const ids = subtasks.map((s) => s.id)
                  await supabase.from('task_subtasks').delete().in('id', ids)
                  setSubtasks([])
                  syncGoalEstimate(selectedId, [])
                }}
                onReorderSubtasks={async (ids) => {
                  if (!user) return
                  const updates = ids.map((id, i) => supabase.from('task_subtasks').update({ sort_order: i }).eq('id', id))
                  await Promise.all(updates)
                  setSubtasks((prev) => {
                    const map = new Map(prev.map((s) => [s.id, s]))
                    return ids.map((id, i) => ({ ...map.get(id)!, sort_order: i }))
                  })
                  }}
                onExtendGoal={async (days) => {
                  if (!user || !selectedId) return
                  const newDeadline = new Date()
                  newDeadline.setDate(newDeadline.getDate() + days)
                  await supabase.from('task_goals').update({ deadline: newDeadline.toLocaleDateString('en-CA') }).eq('id', selectedId)
                  loadGoals()
                }}
                onArchiveGoal={async () => {
                  if (!user || !selectedId) return
                  await supabase.from('task_goals').update({ status: 'archived' }).eq('id', selectedId)
                  // XP penalty if expired > 7 days
                  const goal = goals.find((g) => g.id === selectedId)
                  if (goal) {
                    const daysOverdue = Math.round((Date.now() - new Date(goal.deadline).getTime()) / 86400000)
                    if (daysOverdue >= 7) {
                      const lostXp = Math.round((100 - (subtasks.reduce((a, s) => a + Math.min(s.completed_minutes, s.estimated_minutes), 0) / Math.max(1, subtasks.reduce((a, s) => a + s.estimated_minutes, 0))) * 100) * 0.5)
                      if (lostXp > 0) { try { await supabase.rpc('add_xp', { p_xp: -lostXp }) } catch {} }
                    }
                  }
                  setSelectedId(null)
                  loadGoals()
                }}
                onStartPomodoro={startPomodoroFromSubtask}
              />
            ) : (
              <TaskDashboard goals={activeGoals} onSelectGoal={selectGoal} />
            )}
          </div>
        </div>
      )}

      {showForm && (
        <GoalForm
          goal={editingGoal}
          onSave={saveGoal}
          onClose={() => { setShowForm(false); setEditingGoal(null) }}
        />
      )}
    </div>
  )
}
