import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../supabase/client'
import { useUser } from '../supabase/auth'
import type { Habit, HabitLog } from '../supabase/types'
import { HabitForm } from '../components/habits/HabitForm'
import { HabitList } from '../components/habits/HabitList'
import { HabitCalendar } from '../components/habits/HabitCalendar'
import { HabitDayModal } from '../components/habits/HabitDayModal'
import { HabitWeekCircles } from '../components/habits/HabitWeekCircles'
import { HabitHistoryChart } from '../components/habits/HabitHistoryChart'
import { HabitMassImport } from '../components/habits/HabitMassImport'

export function HabitsPage() {
  const user = useUser()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [habits, setHabits] = useState<Habit[]>([])
  const [logs, setLogs] = useState<HabitLog[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editHabit, setEditHabit] = useState<Habit | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [dayModal, setDayModal] = useState<string | null>(null)

  const monthKey = `${year}-${String(month).padStart(2, '0')}`
  const daysInMonth = new Date(year, month, 0).getDate()
  const today = new Date().toISOString().slice(0, 10)

  const loadData = useCallback(() => {
    if (!user) return
    supabase.from('habits').select('*').eq('user_id', user.id).eq('month_key', monthKey).then(({ data }: any) => {
      if (data) setHabits(data)
    })
    supabase.from('habit_logs').select('*').eq('user_id', user.id).gte('date', `${monthKey}-01`).lte('date', `${monthKey}-${String(daysInMonth).padStart(2, '0')}`).then(({ data }: any) => {
      if (data) setLogs(data)
    })
  }, [user, monthKey, daysInMonth])

  useEffect(() => { loadData() }, [loadData])

  const prevMonth = () => {
    if (month === 1) { setYear(year - 1); setMonth(12) }
    else setMonth(month - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setYear(year + 1); setMonth(1) }
    else setMonth(month + 1)
  }

  const monthLabel = new Date(year, month - 1).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })

  const saveHabit = async (data: { name: string }) => {
    if (!user) return
    if (editHabit) {
      await supabase.from('habits').update({ name: data.name }).eq('id', editHabit.id)
      setEditHabit(null)
    } else {
      await supabase.from('habits').insert({ user_id: user.id, month_key: monthKey, name: data.name, icon: '◉', color: '#A66CFF', is_primary: false })
    }
    setShowForm(false)
    loadData()
  }

  const deleteHabit = async (id: string) => {
    await supabase.from('habits').delete().eq('id', id)
    loadData()
  }


  const toggleDay = async (habitId: string, date: string) => {
    if (!user) return
    const existing = logs.find((l) => l.habit_id === habitId && l.date === date)
    if (existing) {
      await supabase.from('habit_logs').delete().eq('id', existing.id)
    } else {
      await supabase.from('habit_logs').insert({ user_id: user.id, habit_id: habitId, date })
    }
    loadData()
  }

  const importHabits = async (names: string[]) => {
    if (!user) return
    const toInsert = names.map((name) => ({
      user_id: user.id, month_key: monthKey, name: name.trim(), icon: 'bi-star', color: '#A66CFF', is_primary: false,
    }))
    await supabase.from('habits').insert(toInsert)
    loadData()
  }

  const exportMonth = () => {
    const doneDays = new Set(logs.map((l) => l.date)).size
    const totalLogs = logs.length
    let text = `=== Hábitos ${monthKey} ===\n`
    text += `Consistencia: ${Math.round((doneDays / daysInMonth) * 100)}% (${doneDays}/${daysInMonth} días con registro)\n`
    text += `Total de registros: ${totalLogs}\n`
    text += `Hábitos: ${habits.length}\n\n`
    habits.forEach((h) => {
      const c = logs.filter((l) => l.habit_id === h.id).length
      text += `  ${h.name}: ${c}/${daysInMonth} días (${Math.round((c / daysInMonth) * 100)}%)\n`
    })
    text += `\nGenerado el ${today}\n`
    const blob = new Blob([text], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = `habits-${monthKey}.txt`; a.click()
    URL.revokeObjectURL(a.href)
  }

  // Consistency analysis
  const consistencyData = habits.map((h) => {
    const c = logs.filter((l) => l.habit_id === h.id).length
    const pct = Math.round((c / daysInMonth) * 100)
    const lastLog = logs.filter((l) => l.habit_id === h.id).sort((a, b) => b.date.localeCompare(a.date))[0]
    const daysSinceLast = lastLog ? Math.round((Date.now() - new Date(lastLog.date).getTime()) / 86400000) : 999
    return { ...h, pct, doneDays: c, daysSinceLast }
  })
  const bestHabit = consistencyData.length > 0 ? consistencyData.reduce((a, b) => a.pct > b.pct ? a : b) : null
  const worstHabit = consistencyData.length > 0 ? consistencyData.reduce((a, b) => a.pct < b.pct ? a : b) : null
  const abandonedHabits = consistencyData.filter((h) => h.daysSinceLast > 3)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div id="hm-header" className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-accent">📋</span> HÁBITOS
        </h2>
        <div id="hm-nav" className="flex items-center gap-1.5">
          <button id="hm-add-btn" onClick={() => setShowForm(true)} className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-accent hover:opacity-90 text-white transition-all">+ Nuevo</button>
          <button id="hm-import-btn" onClick={() => setShowImport(true)} className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-secondary hover:bg-white/10 text-text-secondary hover:text-white transition-all">📄 Masivo</button>
          <div className="w-px h-5 bg-white/10 mx-1" />
          <button onClick={prevMonth} className="px-2 py-1 rounded text-xs text-text-secondary hover:text-white hover:bg-white/5 transition-all">←</button>
          <span id="hm-month-label" className="text-sm font-bold w-[120px] text-center text-white capitalize">{monthLabel}</span>
          <button onClick={nextMonth} className="px-2 py-1 rounded text-xs text-text-secondary hover:text-white hover:bg-white/5 transition-all">→</button>
        </div>
      </div>

      {/* Habit List */}
      <div id="hm-list-card" className="bg-card rounded-xl border border-white/10 p-4">
        <div id="hm-list-title" className="text-[11px] font-medium text-text-secondary uppercase tracking-wider mb-3">📌 Hábitos de {monthLabel}</div>
        <div id="hm-list"><HabitList habits={habits} logs={logs} daysInMonth={daysInMonth} onDelete={deleteHabit} onEdit={(h) => { setEditHabit(h); setShowForm(true) }} /></div>
      </div>

      {/* Weekly Circles */}
      {habits.length > 0 && (
        <div id="hm-week-card" className="bg-card rounded-xl border border-white/10 p-4">
          <div id="hm-week-circles"><HabitWeekCircles habits={habits} logs={logs} /></div>
        </div>
      )}

      {/* Calendar */}
      {habits.length > 0 && (
        <div id="hm-calendar-card" className="bg-card rounded-xl border border-white/10 p-4">
          <div id="hm-calendar-title" className="text-[11px] font-medium text-text-secondary uppercase tracking-wider mb-3">📅 {monthLabel}</div>
          <div id="hm-calendar"><HabitCalendar habits={habits} logs={logs} year={year} month={month} onDayClick={setDayModal} /></div>
        </div>
      )}

      {/* Summary */}
      {consistencyData.length > 0 && (
        <div id="hm-summary-card" className="bg-card rounded-xl border border-white/10 p-4">
          <div id="hm-summary-title" className="text-[10px] font-medium text-text-secondary uppercase tracking-wider mb-3">📊 Resumen</div>
          <div id="hm-summary-grid" className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: 'Consist.', value: `${Math.round((new Set(logs.map((l) => l.date)).size / daysInMonth) * 100)}%` },
              { label: 'Perfectos', value: new Set(logs.filter((l) => habits.every((h) => logs.some((ll) => ll.habit_id === h.id && ll.date === l.date))).map((l) => l.date)).size.toString() },
              { label: 'C/Log', value: new Set(logs.map((l) => l.date)).size.toString() },
            ].map((s) => (
              <div key={s.label} className="bg-secondary rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-white">{s.value}</div>
                <div className="text-[10px] text-text-secondary mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
          {bestHabit && <div className="text-[11px] text-text-secondary">🏆 Mejor: <span className="text-white">{bestHabit.name}</span> ({bestHabit.pct}%)</div>}
        </div>
      )}

      {/* History Chart */}
      {habits.length > 0 && (
        <div id="hm-history-card" className="bg-card rounded-xl border border-white/10 p-4">
          <div id="hm-history-title" className="text-[10px] font-medium text-text-secondary uppercase tracking-wider mb-3">📊 Historial mensual</div>
          <div id="hm-history-chart"><HabitHistoryChart habitsLength={habits.length} refreshKey={logs.length} /></div>
        </div>
      )}

      {/* Consistency Analysis */}
      {consistencyData.length > 0 && (
        <div id="hm-analysis-card" className="bg-card rounded-xl border border-white/10 p-4">
          <div id="hm-analysis-title" className="text-[10px] font-medium text-text-secondary uppercase tracking-wider mb-3">📊 Análisis de consistencia</div>
          <div id="hm-analysis-content">
          {bestHabit && <div className="text-[11px] mb-1">🏆 Mejor: <span className="text-[#28C76F]">{bestHabit.name}</span> ({bestHabit.pct}%)</div>}
          {worstHabit && <div className="text-[11px] mb-1">⚠️ Peor: <span className="text-[#EA5455]">{worstHabit.name}</span> ({worstHabit.pct}%)</div>}
          {worstHabit && worstHabit.pct < 25 && (
            <div className="text-[11px] text-[#EA5455]/80 mb-1">⚠️ "{worstHabit.name}" solo tiene {worstHabit.pct}% de cumplimiento. Considera reducirlo o eliminarlo.</div>
          )}
          {abandonedHabits.map((h) => (
            <div key={h.id} className="text-[11px] text-warning/80 mb-1">⏳ "{h.name}" sin registrar desde hace {h.daysSinceLast} días.</div>
          ))}
          </div>
        </div>
      )}

      {/* Export */}
      {habits.length > 0 && (
        <button id="hm-export-btn" onClick={exportMonth} className="px-4 py-2 rounded-lg text-xs font-medium bg-secondary hover:bg-white/10 text-text-secondary hover:text-white transition-all">
          📥 Exportar mes
        </button>
      )}

      {/* Modals */}
      {showForm && <HabitForm initialName={editHabit?.name} onSave={(data) => { saveHabit(data); setShowForm(false) }} onClose={() => { setShowForm(false); setEditHabit(null) }} />}
      {showImport && <HabitMassImport monthKey={monthKey} onImport={importHabits} onClose={() => setShowImport(false)} />}
      {dayModal && (
        <HabitDayModal
          dateStr={dayModal}
          habits={habits}
          logs={logs}
          isToday={dayModal === today}
          onClose={() => setDayModal(null)}
          onToggle={toggleDay}
        />
      )}
    </div>
  )
}
