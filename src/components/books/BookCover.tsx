import { useEffect, useRef, useState } from 'react'
import * as pdfjs from 'pdfjs-dist'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

const coverCache = new Map<string, string>()

interface Props {
  url: string
  title: string
  fallbackColor: string
}

export function BookCover({ url, title, fallbackColor }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    setFailed(false)
    const cached = coverCache.get(url)
    if (cached) {
      const img = new Image()
      img.src = cached
      img.onload = () => {
        if (!cancelled || true) drawDataUrl(cached)
      }
    }
    ;(async () => {
      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error('fetch fail')
        const buf = await res.arrayBuffer()
        if (cancelled) return
        const doc = await pdfjs.getDocument({ data: buf }).promise
        const page = await doc.getPage(1)
        const base = page.getViewport({ scale: 1 })
        const scale = 140 / base.width
        const viewport = page.getViewport({ scale })
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')!
        canvas.width = viewport.width
        canvas.height = viewport.height
        await page.render({ canvasContext: ctx as any, viewport } as any).promise
        const dataUrl = canvas.toDataURL('image/png')
        coverCache.set(url, dataUrl)
      } catch {
        if (!cancelled) setFailed(true)
      }
    })()
    return () => { cancelled = true }
  }, [url])

  const drawDataUrl = (dataUrl: string) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const img = new Image()
    img.onload = () => {
      const ctx = canvas.getContext('2d')!
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
    }
    img.src = dataUrl
  }

  return (
    <div className="w-full aspect-[2/3] rounded-lg overflow-hidden bg-secondary flex items-center justify-center"
      style={{ backgroundColor: failed || !url ? fallbackColor : undefined }}>
      {!failed && url ? (
        <canvas ref={canvasRef} className="w-full h-full object-cover" />
      ) : (
        <div className="text-center px-2">
          <div className="text-3xl mb-1">📖</div>
          <div className="text-[10px] font-semibold text-white/80 line-clamp-3 text-center leading-tight">{title}</div>
        </div>
      )}
    </div>
  )
}