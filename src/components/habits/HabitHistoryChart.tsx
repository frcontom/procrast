import { useEffect, useState } from 'react'
import { supabase } from '../../supabase/client'
import { useUser } from '../../supabase/auth'

interface WindowData {
  label: string
  pct: number
  daysWithLogs: number
  daysInWindow: number
}

export function HabitHistoryChart({ habitsLength }: { habitsLength: number }) {
  const user = useUser()
  const [data, setData] = useState<WindowData[]>([])
  const now = new Date()

  useEffect(() => {
    if (!user || habitsLength === 0) return
    const windows: WindowData[] = []
    // 12 ventanas de 30 días, cada una empezando 30 días antes que la anterior
    for (let i = 0; i < 12; i++) {
      windows.push({
        label: new Date(now.getFullYear(), now.getMonth() - i, 1).toLocaleDateString('es-ES', { month: 'short' }),
        daysWithLogs: 0,
        daysInWindow: 30,
        pct: 0,
      })
    }
    supabase.from('habit_logs').select('date').eq('user_id', user.id).gte('date', `${now.getFullYear()}-01-01`).then(({ data: logs }: any) => {
      if (logs) {
        windows.forEach((w, i) => {
          if (i === 0) {
            // Ventana actual: desde hace 30 días hasta hoy
            const start = new Date(now)
            start.setDate(now.getDate() - 29)
            const days = Math.ceil((now.getTime() - start.getTime()) / 86400000) + 1
            w.daysInWindow = days
            const endStr = now.toISOString().slice(0, 10)
            const startStr = start.toISOString().slice(0, 10)
            w.daysWithLogs = new Set(logs.filter((l: any) => l.date >= startStr && l.date <= endStr).map((l: any) => l.date)).size
          } else {
            // Ventanas anteriores: mes completo hacia atrás
            const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
            const start = new Date(end)
            start.setDate(end.getDate() - 29)
            w.daysInWindow = 30
            const startStr = start.toISOString().slice(0, 10)
            const endStr = end.toISOString().slice(0, 10)
            w.daysWithLogs = new Set(logs.filter((l: any) => l.date >= startStr && l.date <= endStr).map((l: any) => l.date)).size
          }
          w.pct = Math.round((w.daysWithLogs / w.daysInWindow) * 100)
        })
        setData([...windows])
      }
    })
  }, [user, habitsLength])

  if (data.length === 0) return null
  const maxPct = Math.max(...data.map((d) => d.pct), 10)

  return (
    <div>
      <div className="flex gap-2 mb-1">
        {data.map((w) => (
          <div key={w.label} className="flex-1 text-center">
              <span className="text-[10px] font-bold tabular-nums text-text-secondary/50">
                {(w.daysWithLogs ?? 0)}/{(w.daysInWindow ?? 30)}
              </span>
          </div>
        ))}
      </div>
      <div className="flex items-end gap-2" style={{ height: 100 }}>
        {data.map((w, i) => {
          const isCurrent = i === 0
          const h = Math.max(6, (w.pct / maxPct) * 100)
          return (
            <div key={w.label} className="flex-1 flex flex-col items-center justify-end gap-0.5">
              <div
                className="w-full rounded-t transition-all"
                style={{
                  height: `${h}px`,
                  backgroundColor: isCurrent ? '#28C76F' : '#3B82F6',
                  boxShadow: isCurrent ? '0 0 8px rgba(40,199,111,0.4)' : 'none',
                }}
              />
              <span className={`text-[10px] ${isCurrent ? 'text-white font-bold' : 'text-text-secondary/60'}`}>{w.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
