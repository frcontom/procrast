import { useEffect, useState } from 'react'
import { supabase } from '../../supabase/client'
import type { Book } from '../../supabase/types'
import { BookCover } from './BookCover'
import { formatMinutes } from '../../lib/formatters'

export function statusOf(b: Book): 'nuevo' | 'progress' | 'done' {
  if (b.status === 'finished') return 'done'
  if ((b.current_page || 0) > 0) return 'progress'
  return 'nuevo'
}

export const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  nuevo: { label: 'Por leer', color: '#60A5FA', bg: 'rgba(96,165,250,0.15)' },
  progress: { label: 'Leyendo', color: '#FF9800', bg: 'rgba(255,152,0,0.15)' },
  done: { label: 'Terminado', color: '#28C76F', bg: 'rgba(40,199,111,0.15)' },
}

interface Props {
  book: Book
  stats?: { minutes: number; days: number; last: string; speed?: number; streak?: number }
  onOpen: (book: Book) => void
  onDetails?: (book: Book) => void
  onTogglePin: (e: React.MouseEvent, id: string) => void
  onEdit: (e: React.MouseEvent, book: Book) => void
  onDelete: (id: string) => void
  draggable?: boolean
  isDragging?: boolean
  isOver?: boolean
  onDragStart?: (e: React.DragEvent, id: string) => void
  onDragOver?: (e: React.DragEvent, id: string) => void
  onDrop?: (e: React.DragEvent, id: string) => void
  onDragEnd?: () => void
}

export function ShelfBook({ book, stats, onOpen, onDetails, onTogglePin, onEdit, onDelete, draggable, isDragging, isOver, onDragStart, onDragOver, onDrop, onDragEnd }: Props) {
  const [url, setUrl] = useState('')
  const pct = book.total_pages > 0 ? Math.min(100, Math.round((book.current_page / book.total_pages) * 100)) : 0
  const status = statusOf(book)
  const meta = STATUS_META[status]

  useEffect(() => {
    let cancelled = false
    supabase.storage.from('books').createSignedUrl(book.file_path, 3600).then(({ data }) => {
      if (data?.signedUrl && !cancelled) setUrl(data.signedUrl)
    })
    return () => { cancelled = true }
  }, [book.file_path])

  return (
    <div className={`group flex flex-col rounded-xl overflow-hidden border border-white/10 bg-card transition-all cursor-pointer relative ${isDragging ? 'opacity-40 border-accent/50' : ''} ${isOver ? 'border-accent/60 ring-1 ring-accent/30' : ''} hover:border-[var(--accent)] ${book.is_pinned ? 'border-[var(--accent)]/40' : ''}`}
      draggable={draggable}
      onDragStart={onDragStart ? (e) => onDragStart(e, book.id) : undefined}
      onDragOver={onDragOver ? (e) => onDragOver(e, book.id) : undefined}
      onDrop={onDrop ? (e) => onDrop(e, book.id) : undefined}
      onDragEnd={onDragEnd}
      onClick={() => onOpen(book)}>
      {book.is_pinned && <span className="absolute top-2 right-2 z-10 text-sm">📌</span>}
      <BookCover url={url} title={book.title} fallbackColor={book.category ? '#156390' : '#16213e'} />
      <div className="p-2.5 flex-1 flex flex-col gap-1">
        <div className="text-[11px] font-semibold text-white leading-tight line-clamp-2 min-h-[2.2em]">{book.title}</div>
        <div className="text-[10px] text-text-secondary truncate">{book.author || '—'}</div>
        <div className="flex items-center justify-between mt-auto pt-1">
          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider"
            style={{ color: meta.color, backgroundColor: meta.bg }}>{meta.label}</span>
          <span className="flex items-center gap-1.5">
            {book.deadline && book.status !== 'finished' && (() => {
              const daysLeft = Math.max(0, Math.round((new Date(book.deadline).getTime() - Date.now()) / 86400000))
              return <span className="text-[9px] font-bold" style={{ color: daysLeft <= 3 ? '#EA5455' : '#a0a0b0' }} title={`Meta: ${book.deadline}`}>⏳ {daysLeft}d</span>
            })()}
            <span className="text-[10px] font-bold" style={{ color: meta.color }}>{pct}%</span>
          </span>
        </div>
        <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: pct >= 80 ? 'linear-gradient(90deg, #28C76F, #81E6A0)' : 'linear-gradient(90deg, var(--accent), #b388ff)' }} />
        </div>
        <div className="flex items-center justify-between text-[9px] text-text-secondary/60">
          <span className="flex items-center gap-1">
            {stats?.speed ? <span title="Velocidad">⚡ {stats.speed.toFixed(1)} pág/min</span> : <span>{book.current_page}/{book.total_pages || '?'}</span>}
          </span>
          <span className="flex items-center gap-1">
            {stats && stats.streak && stats.streak > 0 && <span title="Racha del libro" style={{ color: '#FF6B6B' }}>🔥 {stats.streak}d</span>}
            {stats && stats.minutes > 0 && <span title={`${stats.minutes}min · ${stats.days} día(s)`}>⏱ {formatMinutes(stats.minutes)}</span>}
            <button onClick={(e) => { e.stopPropagation(); onDetails?.(book) }} title="Detalles" className="hover:scale-110 transition-transform">ℹ️</button>
            <button onClick={(e) => onTogglePin(e, book.id)} className="hover:scale-110 transition-transform">📌</button>
            <button onClick={(e) => onEdit(e, book)} className="hover:scale-110 transition-transform">✏️</button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(book.id) }} className="text-danger/50 hover:text-danger transition-colors">🗑️</button>
          </span>
        </div>
      </div>
    </div>
  )
}