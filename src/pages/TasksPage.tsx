import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../supabase/client'
import { useUser } from '../supabase/auth'
import type { TaskGoal, TaskSubtask } from '../supabase/types'
import { GoalForm, type GoalFormData } from '../components/tasks/GoalForm'
import { GoalDetail } from '../components/tasks/GoalDetail'
import { SubtaskList } from '../components/tasks/SubtaskList'
import { SubtaskForm } from '../components/tasks/SubtaskForm'
import { HexCalendar } from '../components/tasks/HexCalendar'
import { GoalHistory } from '../components/tasks/GoalHistory'

export function TasksPage() {
  const user = useUser()
  const [goals, setGoals] = useState<TaskGoal[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [subtasks, setSubtasks] = useState<TaskSubtask[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState<TaskGoal | null>(null)

  const selectedGoal = goals.find((g) => g.id === selectedId) || null

  const loadGoals = useCallback(() => {
    if (!user) return
    supabase.from('task_goals').select('*').eq('user_id', user.id).eq('status', 'active').order('created_at', { ascending: false }).then(({ data }: any) => {
      if (data) {
        setGoals(data)
        if (!selectedId && data.length > 0) setSelectedId(data[0].id)
      }
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

  const saveGoal = async (data: GoalFormData) => {
    if (!user) return
    if (editingGoal) {
      await supabase.from('task_goals').update({ ...data, start_date: data.start_date || null }).eq('id', editingGoal.id)
    } else {
      const { data: newGoal }: any = await supabase.from('task_goals').insert({
        user_id: user.id,
        ...data,
        start_date: data.start_date || null,
      }).select().single()
      if (newGoal) setSelectedId(newGoal.id)
    }
    setShowForm(false)
    setEditingGoal(null)
    loadGoals()
  }

  const archiveGoal = async (id: string) => {
    await supabase.from('task_goals').update({ status: 'archived' }).eq('id', id)
    setGoals((prev) => prev.filter((g) => g.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const toggleSubtask = async (id: string) => {
    const st = subtasks.find((s) => s.id === id)
    if (!st) return
    const newStatus = st.status === 'completed' ? 'pending' : 'completed'
    await supabase.from('task_subtasks').update({ status: newStatus }).eq('id', id)
    setSubtasks((prev) => prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s)))
  }

  const deleteSubtask = async (id: string) => {
    await supabase.from('task_subtasks').delete().eq('id', id)
    setSubtasks((prev) => prev.filter((s) => s.id !== id))
  }

  const addSubtask = async (data: { name: string; estimated_minutes: number; difficulty: 'easy' | 'normal' | 'hard' }) => {
    if (!user || !selectedId) return
    const { data: newSt }: any = await supabase.from('task_subtasks').insert({
      user_id: user.id,
      goal_id: selectedId,
      sort_order: subtasks.length,
      ...data,
    }).select().single()
    if (newSt) setSubtasks((prev) => [...prev, newSt])
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 space-y-4">
        <div className="bg-card rounded-xl border border-white/10 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs uppercase tracking-wider text-text-secondary font-semibold">Metas</h2>
            <button onClick={() => { setEditingGoal(null); setShowForm(true) }}
              className="text-accent hover:text-white text-xs transition-colors">+ Nueva</button>
          </div>

          <div className="space-y-1.5">
            {goals.map((goal) => (
              <button key={goal.id} onClick={() => setSelectedId(goal.id)}
                className={`w-full text-left p-3 rounded-lg text-sm transition-colors relative ${selectedId === goal.id ? 'bg-accent/20 border border-accent/50' : 'bg-secondary hover:bg-white/5'}`}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: goal.color }} />
                  <span className="font-medium truncate flex-1">{goal.name}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-text-secondary">
                  <span>📅 {goal.deadline}</span>
                  <span>⏱ {goal.estimated_minutes}min</span>
                </div>
              </button>
            ))}

            {goals.length === 0 && (
              <p className="text-text-secondary text-xs text-center py-4">Crea tu primera meta</p>
            )}
          </div>
        </div>

        <GoalHistory />
      </div>

      <div className="md:col-span-2 space-y-4">
        {selectedGoal ? (
          <>
            <GoalDetail goal={selectedGoal} subtasks={subtasks} />

            <div className="bg-card rounded-xl border border-white/10 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs uppercase tracking-wider text-text-secondary font-semibold">
                  Subtareas ({subtasks.filter((s) => s.status !== 'completed').length} pendientes)
                </h3>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingGoal(selectedGoal); setShowForm(true) }}
                    className="text-text-secondary hover:text-white text-xs transition-colors">Editar</button>
                  <button onClick={() => archiveGoal(selectedGoal.id)}
                    className="text-danger/50 hover:text-danger text-xs transition-colors">Archivar</button>
                </div>
              </div>

              <SubtaskList subtasks={subtasks} onToggle={toggleSubtask} onDelete={deleteSubtask} />
              <SubtaskForm onSave={addSubtask} />
            </div>

            <div className="bg-card rounded-xl border border-white/10 p-4">
              <h3 className="text-xs uppercase tracking-wider text-text-secondary font-semibold mb-3">
                Calendario
              </h3>
              <HexCalendar
                startDate={selectedGoal.start_date || selectedGoal.created_at.slice(0, 10)}
                deadline={selectedGoal.deadline}
                estimatedMinutes={selectedGoal.estimated_minutes}
                completedMinutes={subtasks.reduce((a, s) => a + s.completed_minutes, 0)}
                subtaskDays={[]}
              />
            </div>
          </>
        ) : (
          <div className="bg-card rounded-xl border border-white/10 p-12 text-center text-text-secondary">
            <p className="text-lg mb-2">Selecciona una meta</p>
            <p className="text-sm">o crea una nueva para empezar</p>
          </div>
        )}
      </div>

      {showForm && (
        <GoalForm goal={editingGoal} onSave={saveGoal} onClose={() => { setShowForm(false); setEditingGoal(null) }} />
      )}
    </div>
  )
}
