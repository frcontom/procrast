import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../../supabase/client'
import { useUser } from '../../supabase/auth'

const ACTIVITY_ICONS: Record<string, string> = {
  estudio: '📚', programacion: '💻', trading: '📈', lectura: '📖', escritura: '✍️', trabajo: '💼',
}

const DONE_PHRASES = [
  '¡Lo lograste!', 'Bien hecho', 'Meta cumplida', 'Sin excusas',
  'Un paso más', 'Modo fiera', 'Te mereces esto', 'En llamas 🔥',
  'Sigues en pie', 'Un día a la vez',
]

const FAIL_PHRASES = [
  'Podía ser mejor', '¿La próxima?', 'Sin excusa',
  'Tú decides', 'Duele, pero enseña', 'No pasa nada, sigue',
  'Mañana es otro día', 'Levántate y sigue',
]

function pickPhrase(id: string, list: string[]): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash) + id.charCodeAt(i)
  return list[Math.abs(hash) % list.length]
}

function groupDate(dateStr: string): string {
  const d = new Date(dateStr)
  const today = new Date()
  const diff = Math.floor((today.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Ayer'
  if (diff < 7) return 'Esta semana'
  if (diff < 30) return 'Este mes'
  return 'Anteriores'
}

export function SessionHistory() {
  const user = useUser()
  const [sessions, setSessions] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const loaderRef = useRef<HTMLDivElement>(null)
  const PAGE_SIZE = 20

  useEffect(() => {
    if (!user) return
    supabase.from('sessions').select('id', { count: 'exact', head: true }).eq('user_id', user.id).then(({ count }: any) => {
      if (count) setTotal(count)
    })
    loadMore()
  }, [user])

  const loadMore = useCallback(async () => {
    if (!user || !hasMore) return
    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    const { data }: any = await supabase.from('sessions')
      .select('*').eq('user_id', user.id).order('started_at', { ascending: false }).range(from, to)
    if (data) {
      setSessions((prev) => [...prev, ...data])
      setPage((p) => p + 1)
      if (data.length < PAGE_SIZE) setHasMore(false)
    }
  }, [user, page, hasMore])

  useEffect(() => {
    if (!loaderRef.current) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasMore) loadMore()
    })
    obs.observe(loaderRef.current)
    return () => obs.disconnect()
  }, [loadMore, hasMore])

  const completed = sessions.filter((s) => s.state === 'completed').length
  const best = sessions.length > 0 ? Math.round(Math.max(...sessions.filter((s) => s.duration_minutes).map((s: any) => s.duration_minutes))) : 0
  const focusMin = Math.round(sessions.filter((s) => s.state === 'completed').reduce((a: number, s: any) => a + (s.elapsed_seconds || 0) / 60, 0))

  if (sessions.length === 0) return null

  const groups: Record<string, any[]> = {}
  sessions.forEach((s: any) => {
    const g = groupDate(s.started_at)
    if (!groups[g]) groups[g] = []
    groups[g].push(s)
  })

  return (
    <div className="bg-card rounded-xl border border-white/10 overflow-hidden">
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">📋 Historial</h3>
          <span className="text-[10px] text-text-secondary">{total} sesiones</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-secondary/50 rounded-lg p-2 text-center">
            <div className="text-sm font-bold text-white">{completed}</div>
            <div className="text-[9px] text-text-secondary uppercase tracking-wider">Hechas</div>
          </div>
          <div className="bg-secondary/50 rounded-lg p-2 text-center">
            <div className="text-sm font-bold text-white">{focusMin}</div>
            <div className="text-[9px] text-text-secondary uppercase tracking-wider">Min focus</div>
          </div>
          <div className="bg-secondary/50 rounded-lg p-2 text-center">
            <div className="text-sm font-bold text-white">{best}</div>
            <div className="text-[9px] text-text-secondary uppercase tracking-wider">Mejor ses</div>
          </div>
          <div className="bg-secondary/50 rounded-lg p-2 text-center">
            <div className="text-sm font-bold text-white">{total > 0 ? Math.round((completed / total) * 100) : 0}%</div>
            <div className="text-[9px] text-text-secondary uppercase tracking-wider">Tasa</div>
          </div>
        </div>
      </div>

      <div className="max-h-72 overflow-y-auto">
        {Object.entries(groups).map(([groupName, groupSessions]) => (
          <div key={groupName}>
            <div className="px-4 py-1.5 bg-white/5 sticky top-0">
              <span className="text-[10px] font-medium text-text-secondary uppercase tracking-wider">{groupName}</span>
            </div>
            {groupSessions.map((s: any) => {
              const isCompleted = s.state === 'completed'
              const pct = s.duration_minutes > 0 ? Math.min(100, Math.round(((s.elapsed_seconds || 0) / 60 / s.duration_minutes) * 100)) : 0
              return (
                <div key={s.id} className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors group">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${isCompleted ? 'bg-success/10' : 'bg-danger/5'}`}>
                    {ACTIVITY_ICONS[s.activity_type] || '⏱'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-xs flex-wrap">
                      <span className="font-medium truncate">{s.activity_type || 'focus'}</span>
                      <span className="text-text-secondary">·</span>
                      <span className={`${isCompleted ? 'text-success' : 'text-danger'}`}>
                        {isCompleted ? pickPhrase(s.id, DONE_PHRASES) : pickPhrase(s.id, FAIL_PHRASES)}
                      </span>
                      <span className="text-text-secondary">·</span>
                      <span className="text-text-secondary">{s.duration_minutes}min</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-text-secondary/60 mt-0.5 flex-wrap">
                      <span>{new Date(s.started_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                      {s.session_name && <span className="truncate italic">· {s.session_name}</span>}
                      {s.elapsed_seconds > 0 && (
                        <span className={pct >= 90 ? 'text-success/60' : pct >= 50 ? 'text-warning/60' : 'text-danger/60'}>
                          · {Math.round((s.elapsed_seconds || 0) / 60)}/{s.duration_minutes}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-12 shrink-0">
                    <div className="w-full bg-secondary rounded-full h-1">
                      <div className={`h-full rounded-full transition-all ${isCompleted ? 'bg-accent' : 'bg-danger/50'}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
        <div ref={loaderRef} className="h-4" />
        {hasMore && (
          <div className="text-center text-[10px] text-text-secondary py-3 bg-white/5">
            Cargando más...
          </div>
        )}
      </div>
    </div>
  )
}
