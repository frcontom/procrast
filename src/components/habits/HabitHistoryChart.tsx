import { useEffect, useState } from 'react'
import { supabase } from '../../supabase/client'
import { useUser } from '../../supabase/auth'

interface MonthData {
  label: string
  pct: number
  daysWithLogs: number
  daysInMonth: number
}

export function HabitHistoryChart({ habitsLength, refreshKey }: { habitsLength: number; refreshKey: number }) {
  const user = useUser()
  const [data, setData] = useState<MonthData[]>([])
  const now = new Date()

  useEffect(() => {
    if (!user || habitsLength === 0) return
    const months: MonthData[] = []
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), i, 1)
      const daysInMonth = new Date(now.getFullYear(), i + 1, 0).getDate()
      months.push({ label: d.toLocaleDateString('es-ES', { month: 'short' }), pct: 0, daysWithLogs: 0, daysInMonth })
    }
    supabase.from('habit_logs').select('date').eq('user_id', user.id).gte('date', `${now.getFullYear()}-01-01`).then(({ data: logs }: any) => {
      if (logs) {
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
    <div className="flex gap-3">
      {/* Y-axis */}
      <div className="flex flex-col justify-between items-end pr-2 text-[9px] text-text-secondary/40 tabular-nums shrink-0" style={{ height: 100, paddingTop: 0, paddingBottom: 16 }}>
        <span>100</span>
        <span>75</span>
        <span>50</span>
        <span>25</span>
        <span>0</span>
      </div>

      {/* Chart area */}
      <div className="flex-1">
        {/* Labels row */}
        <div className="flex gap-2 mb-1">
          {data.map((m, i) => {
            const effectiveDays = (i === now.getMonth()) ? now.getDate() : m.daysInMonth
            return (
              <div key={m.label} className="flex-1 text-center">
                <span className="text-[10px] font-bold tabular-nums text-text-secondary/50">
                  {m.daysWithLogs}/{effectiveDays}
                </span>
              </div>
            )
          })}
        </div>

        {/* Bars with grid background */}
        <div className="relative" style={{ height: 100 }}>
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            <div className="border-t border-white/5" />
            <div className="border-t border-white/5" />
            <div className="border-t border-white/5" />
            <div className="border-t border-white/5" />
            <div className="border-t border-white/5" />
          </div>
          {/* Bars */}
          <div className="flex items-end gap-2 absolute inset-0">
            {data.map((m, i) => {
              const isCurrent = i === now.getMonth()
              const effectiveDays = isCurrent ? now.getDate() : m.daysInMonth
              const pctToShow = Math.round((m.daysWithLogs / Math.max(1, effectiveDays)) * 100)
              const h = Math.max(4, (pctToShow / 100) * 100)
              return (
                <div key={m.label} className="flex-1 flex flex-col items-center justify-end">
                  <div
                    className="w-full rounded-t transition-all"
                    style={{
                      height: `${h}px`,
                      backgroundColor: isCurrent ? '#28C76F' : '#3B82F6',
                      boxShadow: isCurrent ? '0 0 8px rgba(40,199,111,0.4)' : 'none',
                    }}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* Month labels */}
        <div className="flex gap-2 mt-1">
          {data.map((m, i) => {
            const isCurrent = i === now.getMonth()
            return (
              <div key={m.label} className="flex-1 text-center">
                <span className={`text-[10px] ${isCurrent ? 'text-white font-bold' : 'text-text-secondary/60'}`}>{m.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
