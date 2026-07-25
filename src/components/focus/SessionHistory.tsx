import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../../supabase/client'
import { useUser } from '../../supabase/auth'

const ACTIVITY_ICONS: Record<string, string> = {
  estudio: '📚', programacion: '💻', trading: '📈', lectura: '📖', escritura: '✍️', trabajo: '💼',
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

  if (sessions.length === 0) return null

  return (
    <div className="bg-card rounded-xl border border-white/10 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Historial</h3>
        <span className="text-[10px] text-text-secondary">{total} sesiones</span>
      </div>
      <div className="space-y-1 max-h-80 overflow-y-auto">
        {sessions.map((s: any) => (
          <div key={s.id} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-2 min-w-0">
              <span>{ACTIVITY_ICONS[s.activity_type] || '⏱'}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium truncate">{s.activity_type || 'focus'}</span>
                  <span className={`text-[10px] px-1 rounded ${s.state === 'completed' ? 'text-success bg-success/10' : 'text-danger bg-danger/10'}`}>
                    {s.state === 'completed' ? '✅' : '❌'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-text-secondary">
                  <span>{new Date(s.started_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                  {s.session_name && <span className="truncate max-w-[120px]">· {s.session_name}</span>}
                </div>
              </div>
            </div>
            <span className="text-xs text-text-secondary whitespace-nowrap ml-2">
              {s.duration_minutes} min
            </span>
          </div>
        ))}
        <div ref={loaderRef} className="h-4" />
        {hasMore && <div className="text-center text-[10px] text-text-secondary py-2">Cargando más...</div>}
      </div>
    </div>
  )
}
