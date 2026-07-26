import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../../supabase/client'
import { useUser } from '../../supabase/auth'
import { formatTime } from '../../lib/formatters'

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

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'justo ahora'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`
  if (diff < 604800) return `hace ${Math.floor(diff / 86400)} d`
  return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

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
    <div className="bg-card rounded-2xl border border-white/10 overflow-hidden">
      {/* Stats header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">📋 Historial</span>
          <span className="text-[9px] text-text-secondary/60">{total} sesiones</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Completadas', value: completed, color: '#28C76F' },
            { label: 'Min focus', value: focusMin, color: '#A66CFF' },
            { label: 'Mejor sesión', value: `${best}min`, color: '#00BCD4' },
            { label: 'Tasa', value: `${total > 0 ? Math.round((completed / total) * 100) : 0}%`, color: total > 0 && (completed / total) >= 0.7 ? '#28C76F' : '#FF9800' },
          ].map((s) => (
            <div key={s.label} className="bg-white/5 rounded-lg p-2 text-center">
              <div className="text-sm font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[8px] text-text-secondary/60 uppercase tracking-wider mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="max-h-80 overflow-y-auto">
        {Object.entries(groups).map(([groupName, groupSessions]) => (
          <div key={groupName}>
            <div className="sticky top-0 px-4 py-1.5 bg-[var(--bg-card)] border-b border-white/5 z-10">
              <span className="text-[9px] font-semibold text-text-secondary/60 uppercase tracking-wider">{groupName}</span>
            </div>
            {groupSessions.map((s: any, i: number) => {
              const isCompleted = s.state === 'completed'
              const pct = s.duration_minutes > 0 ? Math.min(100, Math.round(((s.elapsed_seconds || 0) / 60 / s.duration_minutes) * 100)) : 0
              const isLast = i === groupSessions.length - 1

              return (
                <div key={s.id} className="flex gap-3 px-4 py-2.5 hover:bg-white/[0.02] transition-colors group relative">
                  {/* Timeline line */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${isCompleted ? 'bg-[#28C76F]' : 'bg-[#EA5455]/60'}`} />
                    {!isLast && <div className="w-px flex-1 bg-white/5 mt-1" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-xs flex-wrap">
                      <span className="text-[11px] font-medium text-white/80">{ACTIVITY_ICONS[s.activity_type] || '⏱'} {s.activity_type || 'focus'}</span>
                      <span className="text-text-secondary/30">·</span>
                      <span className={`text-[10px] ${isCompleted ? 'text-[#28C76F]/80' : 'text-[#EA5455]/70'}`}>
                        {isCompleted ? pickPhrase(s.id, DONE_PHRASES) : pickPhrase(s.id, FAIL_PHRASES)}
                      </span>
                      {s.session_name && <span className="text-[10px] text-text-secondary/50 truncate">· {s.session_name}</span>}
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-text-secondary/40 mt-0.5 flex-wrap">
                      <span>{new Date(s.started_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      <span>·</span>
                      <span>{formatTime(s.elapsed_seconds || 0)}</span>
                      {s.duration_minutes > 0 && (
                        <>
                          <span>·</span>
                          <span className={pct >= 90 ? 'text-[#28C76F]/60' : pct >= 50 ? 'text-[#FF9800]/60' : 'text-[#EA5455]/60'}>
                            {pct}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-[9px] text-text-secondary/30 shrink-0 whitespace-nowrap self-center">
                    {timeAgo(s.started_at)}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
        <div ref={loaderRef} className="h-3" />
        {hasMore && (
          <div className="text-center text-[9px] text-text-secondary/40 py-3 bg-white/[0.02]">
            Cargando más sesiones...
          </div>
        )}
      </div>
    </div>
  )
}
