import { useEffect, useRef, useState, useCallback } from 'react'
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
  const docRef = useRef<any>(null)
  const pageRef = useRef<HTMLCanvasElement>(null)
  const page2Ref = useRef<HTMLCanvasElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentPage, setCurrentPage] = useState(Math.min(book.current_page || 1, Math.max(1, book.total_pages || 1)))
  const [totalPages, setTotalPages] = useState(book.total_pages || 0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [jump, setJump] = useState('')
  const [zoom, setZoom] = useState(1)
  const [twoPage, setTwoPage] = useState(false)
  const [bookmarks, setBookmarks] = useState<any[]>([])
  const [showBookmarks, setShowBookmarks] = useState(false)
  const [noteDraft, setNoteDraft] = useState('')
  const lastPageRef = useRef<number>(currentPage)
  const turnedAtRef = useRef<number>(Date.now())

  useEffect(() => {
    if (!user || !book.id) return
    supabase.from('book_bookmarks').select('*').eq('user_id', user.id).eq('book_id', book.id).order('page').then(({ data }: any) => {
      if (data) setBookmarks(data)
    })
  }, [user, book.id])

  const renderSingle = useCallback(async (canvas: HTMLCanvasElement, pageNum: number) => {
    const doc = docRef.current
    if (!doc) return
    const page = await doc.getPage(pageNum)
    const base = page.getViewport({ scale: 1 })
    const container = containerRef.current
    const containerWidth = container ? Math.max(container.clientWidth - 32, 400) : 700
    const scale = zoom * Math.min(containerWidth, isFullscreen ? 1200 : 820) / base.width
    const viewport = page.getViewport({ scale })
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const ctx = canvas.getContext('2d')!
    canvas.width = viewport.width * dpr
    canvas.height = viewport.height * dpr
    canvas.style.width = `${viewport.width}px`
    canvas.style.height = `${viewport.height}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    await page.render({ canvasContext: ctx, viewport }).promise
  }, [zoom, isFullscreen])

  const renderSpread = useCallback(async (canvas: HTMLCanvasElement, canvas2: HTMLCanvasElement, leftPage: number) => {
    const doc = docRef.current
    if (!doc) return
    const container = containerRef.current
    const cw = container ? Math.max(container.clientWidth - 32, 400) : 900
    const half = cw / 2
    const [p1, p2] = await Promise.all([doc.getPage(leftPage), doc.getPage(leftPage + 1)])
    const b1 = p1.getViewport({ scale: 1 })
    const b2 = p2.getViewport({ scale: 1 })
    const scale = zoom * Math.min(half / b1.width, half / b2.width)
    const v1 = p1.getViewport({ scale })
    const v2 = p2.getViewport({ scale })
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const draw = async (c: HTMLCanvasElement, viewport: any, page: any) => {
      const ctx = c.getContext('2d')!
      c.width = viewport.width * dpr
      c.height = viewport.height * dpr
      c.style.width = `${viewport.width}px`
      c.style.height = `${viewport.height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      await page.render({ canvasContext: ctx, viewport }).promise
    }
    await Promise.all([draw(canvas, v1, p1), draw(canvas2, v2, p2)])
  }, [zoom, isFullscreen])

  const renderPage = useCallback(async (pageNum: number) => {
    if (!docRef.current || !pageRef.current) return
    if (twoPage && pageNum < docRef.current.numPages) {
      await renderSpread(pageRef.current, page2Ref.current!, pageNum)
    } else {
      await renderSingle(pageRef.current, pageNum)
      if (page2Ref.current) {
        page2Ref.current.width = 1
        page2Ref.current.height = 1
        page2Ref.current.style.width = '0px'
        page2Ref.current.style.height = '0px'
      }
    }
  }, [twoPage, renderSingle, renderSpread])

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
        const start = Math.min(book.current_page || 1, total)
        lastPageRef.current = start
        setCurrentPage(start)
        turnedAtRef.current = Date.now()
        onProgress(start, total)
        setLoading(false)
        requestAnimationFrame(() => renderPage(start))
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || 'Error al abrir el PDF')
          setLoading(false)
        }
      }
    })()
    return () => { cancelled = true }
  }, [url])

  const goToPage = useCallback(async (pageNum: number) => {
    const doc = docRef.current
    if (!doc || pageNum < 1 || pageNum > doc.numPages) return
    const prev = lastPageRef.current
    const elapsed = Math.round((Date.now() - turnedAtRef.current) / 1000)
    if (elapsed > 0 && pageNum !== prev) {
      onLogReading(prev, pageNum, elapsed)
    }
    lastPageRef.current = pageNum
    setCurrentPage(pageNum)
    turnedAtRef.current = Date.now()
    onProgress(pageNum, doc.numPages)
    await renderPage(pageNum)
    if (containerRef.current) containerRef.current.scrollTop = 0
  }, [renderPage, onLogReading, onProgress])

  const next = () => goToPage(twoPage ? Math.min(currentPage + 2, totalPages) : currentPage + 1)
  const prev = () => goToPage(twoPage ? Math.max(currentPage - 2, 1) : currentPage - 1)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [currentPage, twoPage])

  useEffect(() => {
    if (!docRef.current || loading) return
    const onResize = () => renderPage(currentPage)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [currentPage, loading, renderPage, zoom, twoPage])

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  useEffect(() => {
    if (!docRef.current || loading) return
    renderPage(currentPage)
  }, [zoom, twoPage])

  // Registrar el tiempo de la última página al cerrar el lector
  useEffect(() => {
    const doc = docRef.current
    if (!doc) return
    return () => {
      const elapsed = Math.round((Date.now() - turnedAtRef.current) / 1000)
      if (elapsed > 0) {
        onLogReading(lastPageRef.current, lastPageRef.current, elapsed)
      }
    }
  }, [])

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
    } else if (rootRef.current) {
      await rootRef.current.requestFullscreen()
    }
  }

  const toggleBookmark = async () => {
    if (!user) return
    const existing = bookmarks.find((b) => b.page === currentPage)
    if (existing) {
      await supabase.from('book_bookmarks').delete().eq('id', existing.id)
      setBookmarks((prev) => prev.filter((b) => b.id !== existing.id))
    } else {
      const { data } = await supabase.from('book_bookmarks').insert({
        user_id: user.id,
        book_id: book.id,
        page: currentPage,
        note: noteDraft.trim(),
      }).select().single()
      if (data) setBookmarks((prev) => [...prev, data])
    }
    setNoteDraft('')
  }

  const gotoBookmark = (p: number) => { setShowBookmarks(false); goToPage(p) }

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
          <button onClick={prev} disabled={currentPage <= 1}
            className="w-9 h-9 rounded-lg bg-secondary border border-white/10 text-text-secondary hover:text-white disabled:opacity-30 transition-all text-lg">‹</button>
          <input type="number" min={1} max={totalPages || 1} value={jump}
            onChange={(e) => setJump(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { const n = parseInt(jump); if (n >= 1 && n <= totalPages) { setJump(''); goToPage(n) } } }}
            placeholder={String(currentPage)}
            className="w-14 bg-secondary border border-white/10 rounded-lg py-1.5 text-center text-sm text-white focus:outline-none focus:border-accent" />
          <button onClick={next} disabled={currentPage >= totalPages}
            className="w-9 h-9 rounded-lg bg-accent text-white hover:opacity-90 disabled:opacity-30 transition-all text-lg">›</button>
          <span className="text-white/15">|</span>
          <button onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))} title="Alejar"
            className="w-8 h-8 rounded-lg bg-secondary border border-white/10 text-text-secondary hover:text-white transition-all">−</button>
          <span className="text-[11px] text-text-secondary w-12 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(2, +(z + 0.25).toFixed(2)))} title="Acercar"
            className="w-8 h-8 rounded-lg bg-secondary border border-white/10 text-text-secondary hover:text-white transition-all">+</button>
          <button onClick={() => setTwoPage((t) => !t)} title="Vista doble página"
            className={`w-8 h-8 rounded-lg text-xs transition-all ${twoPage ? 'bg-accent text-white' : 'bg-secondary border border-white/10 text-text-secondary hover:text-white'}`}>⧉</button>
          <button onClick={() => setShowBookmarks((s) => !s)} title="Marcadores"
            className={`w-8 h-8 rounded-lg text-xs transition-all ${showBookmarks || bookmarks.length > 0 ? 'bg-accent/20 text-accent' : 'bg-secondary border border-white/10 text-text-secondary hover:text-white'}`}>🔖 {bookmarks.length > 0 ? bookmarks.length : ''}</button>
          <button onClick={toggleBookmark} title={hasBookmark ? 'Quitar marcador' : 'Marcar esta página'}
            className={`w-8 h-8 rounded-lg text-xs transition-all ${hasBookmark ? 'bg-accent text-white' : 'bg-secondary border border-white/10 text-text-secondary hover:text-white'}`}>{hasBookmark ? '📍' : '☆'}</button>
          <button onClick={toggleFullscreen} title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            className="w-8 h-8 rounded-lg bg-secondary border border-white/10 text-text-secondary hover:text-white transition-all text-lg">⛶</button>
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
                  <button onClick={() => gotoBookmark(bm.page)}
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

      <div ref={containerRef}
        className="relative bg-black/40 rounded-xl border border-white/10 overflow-auto flex justify-center items-start"
        style={{ maxHeight: isFullscreen ? '88vh' : '70vh' }}>
        <div className="flex justify-center gap-2 p-3">
          <canvas ref={pageRef} className="shadow-2xl" />
          <canvas ref={page2Ref} className="shadow-2xl" />
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

      <div className="text-center text-[10px] text-text-secondary/50">
        Usa ← → del teclado o los botones para pasar página · el tiempo de lectura se registra al cambiar de página
      </div>
    </div>
  )
}