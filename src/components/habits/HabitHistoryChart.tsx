import { useEffect, useState } from 'react'
import { supabase } from '../../supabase/client'
import { useUser } from '../../supabase/auth'

interface MonthData {
  label: string
  month: number
  pct: number
  daysWithLogs: number
  daysInMonth: number
}

export function HabitHistoryChart({ habitsLength, refreshKey }: { habitsLength: number; refreshKey: number }) {
  const user = useUser()
  const [data, setData] = useState<MonthData[]>(() => {
    // Initialize with test data
    const mock: MonthData[] = []
    const pattern = [15, 20, 8, 3, 25, 18, 12, 5, 22, 10, 28, 6]
    const n = new Date()
    for (let i = 0; i < 12; i++) {
      const d = new Date(n.getFullYear(), i, 1)
      const dim = new Date(n.getFullYear(), i + 1, 0).getDate()
      const isCur = i === n.getMonth()
      const eff = isCur ? n.getDate() : dim
      const dwl = Math.min(pattern[i], eff)
      mock.push({ label: d.toLocaleDateString('es-ES', { month: 'short' }), month: i, pct: Math.round((dwl / eff) * 100), daysWithLogs: dwl, daysInMonth: dim })
    }
    return mock
  })
  const now = new Date()

  useEffect(() => {
    if (!user || habitsLength === 0) return
    const months: MonthData[] = []
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), i, 1)
      const daysInMonth = new Date(now.getFullYear(), i + 1, 0).getDate()
      months.push({ label: d.toLocaleDateString('es-ES', { month: 'short' }), month: i, pct: 0, daysWithLogs: 0, daysInMonth })
    }
    supabase.from('habit_logs').select('date').eq('user_id', user.id).gte('date', `${now.getFullYear()}-01-01`).then(({ data: logs }: any) => {
      if (logs && logs.length > 0) {
        months.forEach((m, i) => {
          const monthStr = `${now.getFullYear()}-${String(i + 1).padStart(2, '0')}`
          m.daysWithLogs = new Set(logs.filter((l: any) => l.date.startsWith(monthStr)).map((l: any) => l.date)).size
          const effectiveDays = (i === now.getMonth()) ? now.getDate() : m.daysInMonth
          m.pct = Math.round((m.daysWithLogs / effectiveDays) * 100)
        })
        setData([...months])
      }
    })
  }, [user, habitsLength, refreshKey])

  if (data.length === 0) return null

  return (
    <div>
      {/* Labels row */}
      <div className="flex gap-2 mb-1">
        {data.map((m) => {
          const effectiveDays = (m.month === now.getMonth()) ? now.getDate() : m.daysInMonth
          return (
            <div key={m.label} className="flex-1 text-center">
              <span className="text-[10px] font-bold tabular-nums text-text-secondary/50">
                {m.daysWithLogs}/{effectiveDays}
              </span>
            </div>
          )
        })}
      </div>

      {/* Bars */}
      <div className="flex items-end gap-2" style={{ height: 100 }}>
        {data.map((m) => {
          const isCurrent = m.month === now.getMonth()
          const effectiveDays = isCurrent ? now.getDate() : m.daysInMonth
          const pctToShow = Math.round((m.daysWithLogs / Math.max(1, effectiveDays)) * 100)
          return (
            <div key={m.label} className="flex-1 flex flex-col items-center justify-end">
              <div
                className="w-full rounded-t transition-all"
                style={{
                  height: `${Math.max(6, pctToShow)}px`,
                  backgroundColor: isCurrent ? '#28C76F' : '#3B82F6',
                  boxShadow: isCurrent ? '0 0 8px rgba(40,199,111,0.4)' : 'none',
                }}
              />
            </div>
          )
        })}
      </div>

      {/* Month labels */}
      <div className="flex gap-2 mt-1">
        {data.map((m) => {
          const isCurrent = m.month === now.getMonth()
          return (
            <div key={m.label} className="flex-1 text-center">
              <span className={`text-[10px] ${isCurrent ? 'text-white font-bold' : 'text-text-secondary/60'}`}>{m.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
