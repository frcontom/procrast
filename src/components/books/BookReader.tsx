import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import * as pdfjs from 'pdfjs-dist'
import type { Book } from '../../supabase/types'
import { supabase } from '../../supabase/client'
import { useUser } from '../../supabase/auth'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

interface Props {
  book: Book
  url: string
  onProgress: (page: number, totalPages: number) => void
  onLogReading: (pageStart: number, pageEnd: number, seconds: number) => void
}

export function BookReader({ book, url, onProgress, onLogReading }: Props) {
  const user = useUser()
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const docRef = useRef<any>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [totalPages, setTotalPages] = useState(book.total_pages || 0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [jump, setJump] = useState('')
  const [zoom, setZoom] = useState(1)
  const [viewMode, setViewMode] = useState<'scroll' | 'turn'>('scroll')
  const [twoPage, setTwoPage] = useState(false)
  const [bookmarks, setBookmarks] = useState<any[]>([])
  const [showBookmarks, setShowBookmarks] = useState(false)
  const [noteDraft, setNoteDraft] = useState('')
  const [pageDims, setPageDims] = useState<{ w: number; h: number }[]>([])
  const [containerW, setContainerW] = useState(0)
  const [scrollTop, setScrollTop] = useState(0)
  const [transitioning, setTransitioning] = useState(false)

  const currentPageRef = useRef<number>(Math.min(book.current_page || 1, Math.max(1, book.total_pages || 1)))
  const [currentPage, setCurrentPage] = useState(currentPageRef.current)
  const turnedAtRef = useRef<number>(Date.now())
  const renderedRef = useRef<Set<number>>(new Set())

  useEffect(() => {
    if (!user || !book.id) return
    supabase.from('book_bookmarks').select('*').eq('user_id', user.id).eq('book_id', book.id).order('page').then(({ data }: any) => {
      if (data) setBookmarks(data)
    })
  }, [user, book.id])

  // Cargar doc y calcular alturas base de cada página
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    ;(async () => {
      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error('No se pudo descargar el PDF (' + res.status + ')')
        const buf = await res.arrayBuffer()
        if (cancelled) return
        const doc = await pdfjs.getDocument({ data: buf }).promise
        if (cancelled) return
        docRef.current = doc
        const total = doc.numPages
        setTotalPages(total)
        const dims: { w: number; h: number }[] = []
        for (let i = 1; i <= total; i++) {
          const page = await doc.getPage(i)
          const vp = page.getViewport({ scale: 1 })
          dims.push({ w: vp.width, h: vp.height })
        }
        setPageDims(dims)
        const start = Math.min(book.current_page || 1, total)
        currentPageRef.current = start
        setCurrentPage(start)
        turnedAtRef.current = Date.now()
        onProgress(start, total)
        setLoading(false)
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || 'Error al abrir el PDF')
          setLoading(false)
        }
      }
    })()
    return () => { cancelled = true }
  }, [url])

  // Observar ancho del contenedor de scroll
  useEffect(() => {
    const el = scrollRef.current || containerRef.current
    if (!el) return
    const update = () => setContainerW(el.clientWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [loading])

  // Render de una página al canvas (modo volteo)
  const renderToCanvas = useCallback(async (canvas: HTMLCanvasElement, pageNum: number, widthCap: number): Promise<boolean> => {
    const doc = docRef.current
    if (!doc) return false
    try {
      const page = await doc.getPage(pageNum)
      const base = page.getViewport({ scale: 1 })
      const scale = zoom * widthCap / base.width
      const viewport = page.getViewport({ scale })
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const ctx = canvas.getContext('2d')!
      canvas.width = viewport.width * dpr
      canvas.height = viewport.height * dpr
      canvas.style.width = `${viewport.width}px`
      canvas.style.height = `${viewport.height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      await page.render({ canvasContext: ctx, viewport }).promise
      return true
    } catch {
      return false
    }
  }, [zoom])

  // Precarga: renderiza N-1 y N+1 en segundo plano (canvas temporales)
  const prefetch = useCallback(async (pageNum: number) => {
    const doc = docRef.current
    if (!doc) return
    const cap = isFullscreen ? 1600 : 1200
    const c = scrollRef.current || containerRef.current
    const cw = c ? Math.max(c.clientWidth - 32, 400) : 700
    const widthCap = Math.min(cw, cap)
    for (const p of [pageNum - 1, pageNum + 1]) {
      if (p < 1 || p > doc.numPages || renderedRef.current.has(p)) continue
      const tmp = document.createElement('canvas')
      const ok = await renderToCanvas(tmp, p, widthCap)
      if (ok) renderedRef.current.add(p)
    }
  }, [renderToCanvas, isFullscreen])

  // ---- MODO SCROLL CONTINUO ----
  const scrollWidthCap = useMemo(() => {
    const cw = containerW > 0 ? Math.max(containerW - 48, 400) : 700
    return Math.min(cw, isFullscreen ? 1600 : 1200)
  }, [containerW, isFullscreen])

  const pageRenderedH = useCallback((i: number) => {
    const d = pageDims[i]
    if (!d) return 0
    return (d.h * zoom * scrollWidthCap) / d.w
  }, [pageDims, zoom, scrollWidthCap])

  const offsets = useMemo(() => {
    const arr: number[] = []
    let acc = 0
    for (let i = 0; i < pageDims.length; i++) { arr.push(acc); acc += pageRenderedH(i) + 12 }
    return arr
  }, [pageDims, pageRenderedH])

  const totalScrollHeight = useMemo(() => {
    if (pageDims.length === 0) return 0
    let acc = 0
    for (let i = 0; i < pageDims.length; i++) acc += pageRenderedH(i) + 12
    return acc
  }, [pageDims, pageRenderedH])

  const visiblePage = useMemo(() => {
    if (pageDims.length === 0) return 1
    const mid = scrollTop + (scrollRef.current ? scrollRef.current.clientHeight / 2 : 0)
    for (let i = 0; i < offsets.length; i++) {
      if (mid >= offsets[i] && mid < offsets[i] + pageRenderedH(i) + 12) return i + 1
    }
    return pageDims.length
  }, [scrollTop, offsets, pageRenderedH, pageDims.length])

  useEffect(() => {
    if (viewMode !== 'scroll' || loading) return
    if (visiblePage !== currentPageRef.current) {
      const prev = currentPageRef.current
      const elapsed = Math.round((Date.now() - turnedAtRef.current) / 1000)
      if (elapsed > 0) onLogReading(prev, visiblePage, elapsed)
      currentPageRef.current = visiblePage
      setCurrentPage(visiblePage)
      turnedAtRef.current = Date.now()
      onProgress(visiblePage, totalPages)
    }
  }, [visiblePage, viewMode, loading, totalPages])

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop((e.target as HTMLDivElement).scrollTop)
  }, [])

  // ---- Render virtualizado en scroll mode ----
  const scrollRange = useMemo(() => {
    if (pageDims.length === 0) return []
    const buffer = 2
    const start = Math.max(1, visiblePage - buffer)
    const end = Math.min(pageDims.length, visiblePage + buffer)
    const out: number[] = []
    for (let i = start; i <= end; i++) out.push(i)
    return out
  }, [visiblePage, pageDims.length])

  const scrollPageRefs = useRef<Record<number, HTMLCanvasElement>>({})

  useEffect(() => {
    if (viewMode !== 'scroll' || loading) return
    for (const p of scrollRange) {
      const canvas = scrollPageRefs.current[p]
      if (canvas && !renderedRef.current.has(p)) {
        renderToCanvas(canvas, p, scrollWidthCap).then((ok) => { if (ok) renderedRef.current.add(p) })
      }
    }
  }, [scrollRange, viewMode, loading, renderToCanvas, zoom, scrollWidthCap])

  const scrollToPage = useCallback((pageNum: number) => {
    if (viewMode !== 'scroll') return
    const el = scrollRef.current
    const off = offsets[pageNum - 1]
    if (el && off !== undefined) {
      el.scrollTo({ top: off - 10, behavior: 'smooth' })
    }
  }, [viewMode, offsets])

  // ---- MODO VOLTEO ----
  const turnLeftRef = useRef<HTMLCanvasElement>(null)
  const turnRightRef = useRef<HTMLCanvasElement>(null)

  const renderTurn = useCallback(async (pageNum: number) => {
    const doc = docRef.current
    if (!doc || !turnLeftRef.current) return
    const c = scrollRef.current || containerRef.current
    const cw = c ? Math.max(c.clientWidth - 32, 400) : 700
    const widthCap = Math.min(cw, isFullscreen ? 1600 : 1200)
    if (twoPage && pageNum < doc.numPages) {
      const half = widthCap / 2
      await Promise.all([
        renderToCanvas(turnLeftRef.current, pageNum, half),
        turnRightRef.current ? renderToCanvas(turnRightRef.current, pageNum + 1, half) : Promise.resolve(),
      ])
    } else {
      await renderToCanvas(turnLeftRef.current, pageNum, widthCap)
      if (turnRightRef.current) { turnRightRef.current.width = 1; turnRightRef.current.height = 1; turnRightRef.current.style.width = '0px'; turnRightRef.current.style.height = '0px' }
    }
  }, [twoPage, renderToCanvas, isFullscreen])

  const goToTurnPage = useCallback(async (pageNum: number) => {
    const doc = docRef.current
    if (!doc || pageNum < 1 || pageNum > doc.numPages) return
    const prev = currentPageRef.current
    const elapsed = Math.round((Date.now() - turnedAtRef.current) / 1000)
    if (elapsed > 0 && pageNum !== prev) onLogReading(prev, pageNum, elapsed)
    currentPageRef.current = pageNum
    setCurrentPage(pageNum)
    turnedAtRef.current = Date.now()
    onProgress(pageNum, doc.numPages)
    setTransitioning(true)
    await renderTurn(pageNum)
    setTimeout(() => setTransitioning(false), 180)
    renderedRef.current.clear()
    prefetch(pageNum)
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [renderTurn, onLogReading, onProgress, prefetch])

  useEffect(() => {
    if (viewMode !== 'turn' || loading || !turnLeftRef.current) return
    renderTurn(currentPageRef.current)
    prefetch(currentPageRef.current)
  }, [viewMode, loading, zoom, twoPage])

  // ---- Navegación genérica ----
  const next = () => {
    if (viewMode === 'scroll') scrollToPage(visiblePage + 1)
    else goToTurnPage(twoPage ? Math.min(currentPage + 2, totalPages) : currentPage + 1)
  }
  const prev = () => {
    if (viewMode === 'scroll') scrollToPage(visiblePage - 1)
    else goToTurnPage(twoPage ? Math.max(currentPage - 2, 1) : currentPage - 1)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [currentPage, viewMode, twoPage])

  useEffect(() => {
    if (!docRef.current || loading) return
    const onResize = () => {
      renderedRef.current.clear()
      if (viewMode === 'scroll') { const el = scrollRef.current; if (el) setScrollTop(el.scrollTop) }
      else renderTurn(currentPageRef.current)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [loading, viewMode, renderTurn])

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  // Registrar el tiempo de la última página al cerrar el lector
  useEffect(() => {
    return () => {
      const elapsed = Math.round((Date.now() - turnedAtRef.current) / 1000)
      if (elapsed > 0) onLogReading(currentPageRef.current, currentPageRef.current, elapsed)
    }
  }, [])

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) await document.exitFullscreen()
    else if (rootRef.current) await rootRef.current.requestFullscreen()
  }

  // Zoom por rueda (Ctrl+scroll) y clic en zonas
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const factor = e.deltaY < 0 ? 0.1 : -0.1
      setZoom((z) => Math.min(2, Math.max(0.5, +(z + factor).toFixed(2))))
    }
  }, [])

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = e.clientX - rect.left
    if (x > rect.width * 0.55) next()
    else if (x < rect.width * 0.45) prev()
  }, [currentPage, viewMode, twoPage])

  const toggleBookmark = async () => {
    if (!user) return
    const existing = bookmarks.find((b) => b.page === currentPage)
    if (existing) {
      await supabase.from('book_bookmarks').delete().eq('id', existing.id)
      setBookmarks((prev) => prev.filter((b) => b.id !== existing.id))
    } else {
      const { data } = await supabase.from('book_bookmarks').insert({ user_id: user.id, book_id: book.id, page: currentPage, note: noteDraft.trim() }).select().single()
      if (data) setBookmarks((prev) => [...prev, data])
    }
    setNoteDraft('')
  }

  const pct = totalPages > 0 ? Math.min(100, Math.round((currentPage / totalPages) * 100)) : 0
  const remaining = Math.max(0, totalPages - currentPage)
  const hasBookmark = bookmarks.some((b) => b.page === currentPage)

  return (
    <div ref={rootRef} className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 bg-card rounded-xl border border-white/10 px-4 py-2.5 flex-wrap">
        <div className="min-w-0">
          <div className="text-sm font-bold text-white truncate">{book.title}</div>
          <div className="text-[11px] text-text-secondary">Página {currentPage} de {totalPages}</div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          <button onClick={() => setViewMode(viewMode === 'scroll' ? 'turn' : 'scroll')}
            className={`px-2 h-8 rounded-lg text-[10px] font-medium transition-all ${viewMode === 'scroll' ? 'bg-accent text-white' : 'bg-secondary border border-white/10 text-text-secondary hover:text-white'}`} title="Cambiar vista">
            {viewMode === 'scroll' ? '⤓ Scroll' : '⇄ Voltear'}
          </button>
          <button onClick={prev} disabled={currentPage <= 1}
            className="w-8 h-8 rounded-lg bg-secondary border border-white/10 text-text-secondary hover:text-white disabled:opacity-30 transition-all text-lg">‹</button>
          <input type="number" min={1} max={totalPages || 1} value={jump}
            onChange={(e) => setJump(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { const n = parseInt(jump); if (n >= 1 && n <= totalPages) { setJump(''); if (viewMode === 'scroll') scrollToPage(n); else goToTurnPage(n) } } }}
            placeholder={String(currentPage)}
            className="w-12 bg-secondary border border-white/10 rounded-lg py-1.5 text-center text-sm text-white focus:outline-none focus:border-accent" />
          <button onClick={next} disabled={currentPage >= totalPages}
            className="w-8 h-8 rounded-lg bg-accent text-white hover:opacity-90 disabled:opacity-30 transition-all text-lg">›</button>
          <span className="text-white/15">|</span>
          <button onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))} title="Alejar"
            className="w-7 h-8 rounded-lg bg-secondary border border-white/10 text-text-secondary hover:text-white transition-all">−</button>
          <span className="text-[10px] text-text-secondary w-10 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(2, +(z + 0.25).toFixed(2)))} title="Acercar (o Ctrl+rueda)"
            className="w-7 h-8 rounded-lg bg-secondary border border-white/10 text-text-secondary hover:text-white transition-all">+</button>
          {viewMode === 'turn' && (
            <button onClick={() => setTwoPage((t) => !t)} title="Vista doble página"
              className={`w-7 h-8 rounded-lg text-xs transition-all ${twoPage ? 'bg-accent text-white' : 'bg-secondary border border-white/10 text-text-secondary hover:text-white'}`}>⧉</button>
          )}
          <button onClick={() => setShowBookmarks((s) => !s)} title="Marcadores"
            className={`w-7 h-8 rounded-lg text-xs transition-all ${showBookmarks || bookmarks.length > 0 ? 'bg-accent/20 text-accent' : 'bg-secondary border border-white/10 text-text-secondary hover:text-white'}`}>🔖 {bookmarks.length > 0 ? bookmarks.length : ''}</button>
          <button onClick={toggleBookmark} title={hasBookmark ? 'Quitar marcador' : 'Marcar esta página'}
            className={`w-7 h-8 rounded-lg text-xs transition-all ${hasBookmark ? 'bg-accent text-white' : 'bg-secondary border border-white/10 text-text-secondary hover:text-white'}`}>{hasBookmark ? '📍' : '☆'}</button>
          <button onClick={toggleFullscreen} title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            className="w-7 h-8 rounded-lg bg-secondary border border-white/10 text-text-secondary hover:text-white transition-all text-base">⛶</button>
        </div>
      </div>

      {showBookmarks && (
        <div className="bg-card rounded-xl border border-white/10 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">🔖 Marcadores ({bookmarks.length})</span>
            <button onClick={() => setShowBookmarks(false)} className="text-text-secondary hover:text-white text-sm">&times;</button>
          </div>
          {bookmarks.length === 0 ? (
            <div className="text-xs text-text-secondary/60">Sin marcadores todavía. Pulsa ☆ en la página que quieras guardar.</div>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {bookmarks.map((bm) => (
                <div key={bm.id} className="flex items-center gap-2 text-xs">
                  <button onClick={() => { setShowBookmarks(false); if (viewMode === 'scroll') scrollToPage(bm.page); else goToTurnPage(bm.page) }}
                    className="px-2 py-1 rounded bg-secondary hover:bg-accent/20 text-accent transition-all shrink-0">Pág {bm.page}</button>
                  <span className="text-text-secondary truncate flex-1">{bm.note || '—'}</span>
                  <button onClick={async () => { await supabase.from('book_bookmarks').delete().eq('id', bm.id); setBookmarks((p) => p.filter((b) => b.id !== bm.id)) }}
                    className="text-danger/50 hover:text-danger transition-colors">🗑️</button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2 mt-2">
            <input value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} placeholder="Nota para la página actual…"
              className="flex-1 bg-secondary border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent" />
            <button onClick={toggleBookmark} className="px-3 py-1.5 rounded-lg text-xs bg-[var(--accent)] text-white transition-all">Guardar nota</button>
          </div>
        </div>
      )}

      <div className="bg-card rounded-xl border border-white/10 px-4 py-3">
        <div className="flex items-center justify-between text-[11px] mb-1.5">
          <span className="text-text-secondary">Leídas: <strong className="text-white">{currentPage}</strong> / {totalPages}</span>
          <span className="text-text-secondary">Quedan <strong className="text-accent">{remaining} páginas</strong></span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--accent), #b388ff)' }} />
        </div>
        <div className="text-right text-[11px] text-accent font-bold mt-1">{pct}%</div>
      </div>

      {/* MODO SCROLL */}
      {viewMode === 'scroll' ? (
        <div ref={scrollRef} onScroll={onScroll} onWheel={handleWheel}
          className="relative bg-black/40 rounded-xl border border-white/10 overflow-auto"
          style={{ maxHeight: isFullscreen ? '88vh' : '70vh' }}>
          <div style={{ height: totalScrollHeight, position: 'relative' }}>
            {scrollRange.map((p) => (
              <div key={p} style={{ position: 'absolute', top: offsets[p - 1], left: 0, right: 0, display: 'flex', justifyContent: 'center', padding: '6px 0' }}
                onClick={handleCanvasClick}>
                <canvas ref={(el) => { scrollPageRefs.current[p] = el! }} className="shadow-2xl rounded-sm" />
              </div>
            ))}
          </div>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="text-center">
                <div className="text-lg mb-2">⏳</div>
                <div className="text-text-secondary text-sm">Cargando PDF…</div>
              </div>
            </div>
          )}
          {!loading && error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center px-6">
                <div className="text-[#EA5455] mb-2 text-sm">❌ {error}</div>
                <div className="text-text-secondary text-xs">Verifica que el bucket "books" exista y que el archivo esté subido.</div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* MODO VOLTEO */
        <div ref={scrollRef} onWheel={handleWheel}
          className="relative bg-black/40 rounded-xl border border-white/10 overflow-auto flex justify-center items-start"
          style={{ maxHeight: isFullscreen ? '88vh' : '70vh' }}>
          <div className={`flex justify-center gap-2 p-3 transition-all duration-200 ${transitioning ? 'opacity-0 translate-x-3' : 'opacity-100 translate-x-0'}`}
            onClick={handleCanvasClick}>
            <canvas ref={turnLeftRef} className="shadow-2xl" />
            <canvas ref={turnRightRef} className="shadow-2xl" />
          </div>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="text-center">
                <div className="text-lg mb-2">⏳</div>
                <div className="text-text-secondary text-sm">Cargando PDF…</div>
              </div>
            </div>
          )}
          {!loading && error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center px-6">
                <div className="text-[#EA5455] mb-2 text-sm">❌ {error}</div>
                <div className="text-text-secondary text-xs">Verifica que el bucket "books" exista y que el archivo esté subido.</div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="text-center text-[10px] text-text-secondary/50">
        {viewMode === 'scroll' ? 'Haz scroll para leer · clic en el borde derecho/izquierdo de la página para avanzar/retroceder · Ctrl+rueda para zoom'
          : 'Usa ← → o clic en los bordes de la página · Ctrl+rueda para zoom · el tiempo se registra al cambiar de página'}
      </div>
    </div>
  )
}