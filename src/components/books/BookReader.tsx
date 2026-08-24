import { useEffect, useRef, useState, useCallback } from 'react'
import * as pdfjs from 'pdfjs-dist'
import type { Book } from '../../supabase/types'

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
  const containerRef = useRef<HTMLDivElement>(null)
  const docRef = useRef<any>(null)
  const pageRef = useRef<HTMLCanvasElement>(null)
  const [currentPage, setCurrentPage] = useState(Math.min(book.current_page || 1, Math.max(1, book.total_pages || 1)))
  const [totalPages, setTotalPages] = useState(book.total_pages || 0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [jump, setJump] = useState('')
  const lastPageRef = useRef<number>(currentPage)
  const turnedAtRef = useRef<number>(Date.now())
  const secondsRef = useRef(0)

  const renderPage = useCallback(async (pageNum: number) => {
    const doc = docRef.current
    if (!doc || !pageRef.current) return
    const page = await doc.getPage(pageNum)
    const baseViewport = page.getViewport({ scale: 1 })
    const canvas = pageRef.current
    const container = containerRef.current
    const containerWidth = container ? Math.max(container.clientWidth - 40, 400) : 700
    const targetWidth = Math.min(containerWidth, 820)
    const scale = targetWidth / baseViewport.width
    const viewport = page.getViewport({ scale })
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const ctx = canvas.getContext('2d')!
    canvas.width = viewport.width * dpr
    canvas.height = viewport.height * dpr
    canvas.style.width = `${viewport.width}px`
    canvas.style.height = `${viewport.height}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    await page.render({ canvasContext: ctx, viewport }).promise
  }, [])

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
        // el canvas ya está montado; renderizamos tras el pintado
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
      secondsRef.current += elapsed
      onLogReading(prev, pageNum, elapsed)
    }
    lastPageRef.current = pageNum
    setCurrentPage(pageNum)
    turnedAtRef.current = Date.now()
    onProgress(pageNum, doc.numPages)
    await renderPage(pageNum)
  }, [renderPage, onLogReading, onProgress])

  const next = () => goToPage(currentPage + 1)
  const prev = () => goToPage(currentPage - 1)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [currentPage])

  useEffect(() => {
    if (!docRef.current || loading) return
    const onResize = () => renderPage(currentPage)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [currentPage, loading, renderPage])

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

  const pct = totalPages > 0 ? Math.min(100, Math.round((currentPage / totalPages) * 100)) : 0
  const remaining = Math.max(0, totalPages - currentPage)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 bg-card rounded-xl border border-white/10 px-4 py-3">
        <div className="min-w-0">
          <div className="text-sm font-bold text-white truncate">{book.title}</div>
          <div className="text-[11px] text-text-secondary">Página {currentPage} de {totalPages}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={prev} disabled={currentPage <= 1}
            className="w-10 h-10 rounded-lg bg-secondary border border-white/10 text-text-secondary hover:text-white disabled:opacity-30 transition-all text-lg">‹</button>
          <input type="number" min={1} max={totalPages || 1} value={jump}
            onChange={(e) => setJump(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { const n = parseInt(jump); if (n >= 1 && n <= totalPages) { setJump(''); goToPage(n) } } }}
            placeholder={String(currentPage)}
            className="w-14 bg-secondary border border-white/10 rounded-lg py-1.5 text-center text-sm text-white focus:outline-none focus:border-accent" />
          <button onClick={next} disabled={currentPage >= totalPages}
            className="w-10 h-10 rounded-lg bg-accent text-white hover:opacity-90 disabled:opacity-30 transition-all text-lg">›</button>
        </div>
      </div>

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
        className="relative bg-black/40 rounded-xl border border-white/10 overflow-auto flex justify-center"
        style={{ maxHeight: '70vh' }}>
        <canvas ref={pageRef} className="shadow-2xl" />
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