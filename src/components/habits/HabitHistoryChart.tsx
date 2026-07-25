import { useEffect, useState } from 'react'
import { supabase } from '../../supabase/client'
import { useUser } from '../../supabase/auth'

interface MonthData {
  year: number
  month: number
  label: string
  pct: number
}

export function HabitHistoryChart({ habitsLength }: { habitsLength: number }) {
  const user = useUser()
  const [data, setData] = useState<MonthData[]>([])

  useEffect(() => {
    if (!user || habitsLength === 0) return
    const months: MonthData[] = []
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), i, 1)
      months.push({ year: d.getFullYear(), month: i + 1, label: d.toLocaleDateString('es-ES', { month: 'short' }), pct: 0 })
    }
    const firstStart = months[0]
    const lastEnd = months[months.length - 1]
    supabase.from('habit_logs').select('date').eq('user_id', user.id).gte('date', `${firstStart.year}-${String(firstStart.month).padStart(2, '0')}-01`).lte('date', `${lastEnd.year}-${String(lastEnd.month).padStart(2, '0')}-31`).then(({ data: logs }: any) => {
      if (logs) {
        months.forEach((m) => {
          const daysInMonth = new Date(m.year, m.month, 0).getDate()
          const daysWithLogs = new Set(logs.filter((l: any) => l.date.startsWith(`${m.year}-${String(m.month).padStart(2, '0')}`)).map((l: any) => l.date)).size
          m.pct = Math.round((daysWithLogs / daysInMonth) * 100)
        })
        setData([...months])
      }
    })
  }, [user, habitsLength])

  if (data.length === 0) return null
  const maxPct = Math.max(...data.map((d) => d.pct), 10)

  return (
    <div>
      <div className="flex items-end gap-2" style={{ height: 110 }}>
        {data.map((m, i) => {
          const isCurrent = m.year === now.getFullYear() && m.month === now.getMonth() + 1
          const h = Math.max(6, (m.pct / maxPct) * 100)
          return (
            <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t transition-all"
                style={{
                  height: `${h}px`,
                  backgroundColor: isCurrent ? '#28C76F' : '#3B82F6',
                  boxShadow: isCurrent ? '0 0 8px rgba(40,199,111,0.4)' : 'none',
                }}
              />
              <span className={`text-[9px] ${isCurrent ? 'text-white font-bold' : 'text-text-secondary/60'}`}>{m.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
