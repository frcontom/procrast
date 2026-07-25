import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../supabase/client'
import { useUser } from '../supabase/auth'
import type { TaskGoal, TaskSubtask } from '../supabase/types'
import { GoalList } from '../components/tasks/GoalList'
import { TaskDashboard } from '../components/tasks/TaskDashboard'
import { GoalDetail } from '../components/tasks/GoalDetail'
import { GoalForm } from '../components/tasks/GoalForm'
import { GoalHistory } from '../components/tasks/GoalHistory'
import { TodayView } from '../components/tasks/TodayView'

type TabView = 'metas' | 'hoy' | 'history'

export function TasksPage() {
  const user = useUser()
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

  useEffect(() => { loadGoals() }, [loadGoals])

  useEffect(() => {
    if (selectedId) loadSubtasks(selectedId)
  }, [selectedId, loadSubtasks])

  const selectGoal = (id: string) => {
    setSelectedId(id)
    setTab('metas')
  }

  const saveGoal = async (data: any) => {
    if (!user) return
    if (editingGoal) {
      await supabase.from('task_goals').update(data).eq('id', editingGoal.id)
    } else {
      const { data: newGoal }: any = await supabase.from('task_goals').insert({ user_id: user.id, ...data }).select().single()
      if (newGoal) setSelectedId(newGoal.id)
    }
    setShowForm(false)
    setEditingGoal(null)
    loadGoals()
  }

  const updateSubtaskStatus = async (id: string, status: string) => {
    await supabase.from('task_subtasks').update({ status: status as 'pending' | 'completed' }).eq('id', id)
    setSubtasks((prev) => prev.map((s) => (s.id === id ? { ...s, status: status as 'pending' | 'completed' } : s)))
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
      </div>

      {tab === 'history' ? (
        <GoalHistory />
      ) : tab === 'hoy' ? (
        <TodayView goals={activeGoals} onSelectGoal={selectGoal} />
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
                onSubtaskDelete={async (id) => { await supabase.from('task_subtasks').delete().eq('id', id); setSubtasks((p) => p.filter((s) => s.id !== id)) }}
                onAddSubtask={async (data) => {
                  if (!user) return
                  const { data: ns }: any = await supabase.from('task_subtasks').insert({ user_id: user.id, goal_id: selectedId!, sort_order: subtasks.length, ...data }).select().single()
                  if (ns) setSubtasks((p) => [...p, ns])
                }}
                onEditGoal={() => { setEditingGoal(selectedGoal); setShowForm(true) }}
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
