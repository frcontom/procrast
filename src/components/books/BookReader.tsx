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
  const lastPageRef = useRef<number>(currentPage)
  const turnedAtRef = useRef<number>(Date.now())
  const secondsRef = useRef(0)

  const renderPage = useCallback(async (pageNum: number) => {
    const doc = docRef.current
    if (!doc || !pageRef.current) return
    const page = await doc.getPage(pageNum)
    const viewport = page.getViewport({ scale: 1.2 })
    const canvas = pageRef.current
    const ctx = canvas.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    canvas.width = viewport.width * dpr
    canvas.height = viewport.height * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    await page.render({ canvasContext: ctx, viewport }).promise
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    pdfjs.getDocument({ url }).promise.then(async (doc) => {
      if (cancelled) return
      docRef.current = doc
      const total = doc.numPages
      setTotalPages(total)
      const start = Math.min(book.current_page || 1, total)
      lastPageRef.current = start
      setCurrentPage(start)
      turnedAtRef.current = Date.now()
      onProgress(start, total)
      await renderPage(start)
      setLoading(false)
    }).catch(() => setLoading(false))
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
            className="w-9 h-9 rounded-lg bg-secondary border border-white/10 text-text-secondary hover:text-white disabled:opacity-30 transition-all">←</button>
          <button onClick={next} disabled={currentPage >= totalPages}
            className="w-9 h-9 rounded-lg bg-accent text-white hover:opacity-90 disabled:opacity-30 transition-all">→</button>
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
        className="bg-black/40 rounded-xl border border-white/10 overflow-auto flex justify-center"
        style={{ maxHeight: '70vh' }}>
        {loading ? (
          <div className="py-20 text-center text-text-secondary text-sm">⏳ Cargando PDF…</div>
        ) : (
          <canvas ref={pageRef} className="max-w-full" style={{ width: '100%', maxWidth: 900 }} />
        )}
      </div>

      <div className="text-center text-[10px] text-text-secondary/50">
        Usa ← → del teclado o los botones para pasar página · el tiempo de lectura se registra al cambiar de página
      </div>
    </div>
  )
}