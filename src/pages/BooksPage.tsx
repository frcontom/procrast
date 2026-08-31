import { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabase/client'
import { useUser } from '../supabase/auth'
import type { Book } from '../supabase/types'
import { BookReader } from '../components/books/BookReader'
import { ShelfBook, statusOf, STATUS_META } from '../components/books/ShelfBook'
import { ReadingHeatmap } from '../components/books/ReadingHeatmap'
import { formatMinutes } from '../lib/formatters'
import { XP } from '../lib/gamification'

export function BooksPage() {
  const user = useUser()
  const [books, setBooks] = useState<Book[]>([])
  const [reading, setReading] = useState<Book | null>(null)
  const [readerUrl, setReaderUrl] = useState('')
  const [sessionSummary, setSessionSummary] = useState<{ seconds: number; pagesRead: number } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Book | null>(null)
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [category, setCategory] = useState('')
  const [deadline, setDeadline] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [totalMinutes, setTotalMinutes] = useState(0)
  const [todayMinutes, setTodayMinutes] = useState(0)
  const [streak, setStreak] = useState(0)
  const [sortBy, setSortBy] = useState<'custom' | 'progress'>('progress')
  const [view, setView] = useState<'grid' | 'shelf'>('shelf')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [search, setSearch] = useState('')
  const [logsByBook, setLogsByBook] = useState<Record<string, { minutes: number; days: number; last: string }>>({})
  const [activityMap, setActivityMap] = useState<Record<string, number>>({})
  const [detailBook, setDetailBook] = useState<Book | null>(null)
  const [chapters, setChapters] = useState<any[]>([])

  const loadBooks = () => {
    if (!user) return
    supabase.from('books').select('*').eq('user_id', user.id).order('sort_order', { ascending: true }).then(({ data }: any) => {
      if (data) setBooks(data)
    })
  }

  useEffect(() => { loadBooks() }, [user])

  // Stats globales: tiempo total, hoy, racha
  useEffect(() => {
    if (!user) return
    supabase.from('book_reading_logs').select('seconds, date, book_id').eq('user_id', user.id).then(({ data }: any) => {
      if (!data) return
      setTotalMinutes(Math.round(data.reduce((a: number, l: any) => a + (l.seconds || 0), 0) / 60))
      const today = new Date().toLocaleDateString('en-CA')
      setTodayMinutes(Math.round(data.filter((l: any) => l.date === today).reduce((a: number, l: any) => a + (l.seconds || 0), 0) / 60))

      // Racha: días consecutivos con lectura
      const days = [...new Set(data.map((l: any) => l.date))].sort()
      const daySet = new Set(days)
      let s = 0
      const d = new Date()
      for (let i = 0; i < 365; i++) {
        if (daySet.has(d.toLocaleDateString('en-CA'))) { s++; d.setDate(d.getDate() - 1) }
        else break
      }
      setStreak(s)

      // Stats por libro
      const byBook: Record<string, { minutes: number; days: Set<string>; last: string; pages: number; streak: number }> = {}
      for (const l of data) {
        if (!byBook[l.book_id]) byBook[l.book_id] = { minutes: 0, days: new Set(), last: '', pages: 0, streak: 0 }
        byBook[l.book_id].minutes += (l.seconds || 0)
        byBook[l.book_id].days.add(l.date)
        byBook[l.book_id].pages += Math.max(1, (l.page_end || 0) - (l.page_start || 0))
        if (l.date > byBook[l.book_id].last) byBook[l.book_id].last = l.date
      }
      const out: Record<string, { minutes: number; days: number; last: string; speed?: number; streak?: number }> = {}
      for (const [k, v] of Object.entries(byBook)) {
        const speed = v.minutes > 0 ? v.pages / (v.minutes / 60) : undefined
        out[k] = { minutes: Math.round(v.minutes / 60), days: v.days.size, last: v.last, speed }
        // Racha por libro: días consecutivos con lectura de este libro
        const daySet = [...v.days].sort()
        const set = new Set(daySet)
        let s = 0
        const dd = new Date()
        for (let i = 0; i < 365; i++) {
          if (set.has(dd.toLocaleDateString('en-CA'))) { s++; dd.setDate(dd.getDate() - 1) }
          else break
        }
        if (s > 0) out[k].streak = s
      }
      setLogsByBook(out)

      // Mapa de actividad por fecha (minutos)
      const act: Record<string, number> = {}
      for (const l of data) {
        act[l.date] = (act[l.date] || 0) + (l.seconds || 0) / 60
      }
      setActivityMap(act)
    })
  }, [user])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !title.trim()) return
    if (!file && !editing) { alert('Selecciona un PDF'); return }
    if (file && file.type !== 'application/pdf') { alert('Solo se permiten archivos PDF'); return }

    setUploading(true)
    try {
      if (editing) {
        await supabase.from('books').update({
          title: title.trim(),
          author: author.trim(),
          category: category.trim(),
          deadline: deadline || null,
        }).eq('id', editing.id)
        setBooks((prev) => prev.map((b) => b.id === editing.id ? { ...b, title: title.trim(), author: author.trim(), category: category.trim(), deadline: deadline || null } : b))
        setShowForm(false)
        setEditing(null)
        return
      }

      const filePath = `${user.id}/${crypto.randomUUID()}.pdf`
      const { error: upErr } = await supabase.storage.from('books').upload(filePath, file!, { contentType: 'application/pdf' })
      if (upErr) throw upErr

      const nextOrder = books.length
      const { data: book, error } = await supabase.from('books').insert({
        user_id: user.id,
        title: title.trim(),
        author: author.trim(),
        category: category.trim(),
        deadline: deadline || null,
        file_path: filePath,
        file_name: file!.name,
        status: 'reading',
        current_page: 0,
        sort_order: nextOrder,
      }).select().single()
      if (error) throw error

      setBooks((prev) => [...prev, book])
      setShowForm(false)
      setTitle('')
      setAuthor('')
      setCategory('')
      setDeadline('')
      setFile(null)
      if (fileRef.current) fileRef.current.value = ''
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const openReader = async (book: Book) => {
    const { data } = await supabase.storage.from('books').createSignedUrl(book.file_path, 3600)
    if (data?.signedUrl) {
      setReading(book)
      setReaderUrl(data.signedUrl)
    } else {
      alert('No se pudo abrir el PDF. Asegúrate de crear el bucket "books" en Supabase.')
    }
  }

  const handleProgress = async (page: number, totalPages: number) => {
    if (!reading) return
    const updates: any = { current_page: page, last_read_at: new Date().toISOString() }
    if (totalPages > 0 && reading.total_pages !== totalPages) updates.total_pages = totalPages
    if (page >= totalPages) updates.status = 'finished'
    else if (page > 0) updates.status = 'reading'
    await supabase.from('books').update(updates).eq('id', reading.id)
    if (page >= totalPages && reading.status !== 'finished') {
      // Insignia primer libro terminado + XP de meta completada
      const { data: existing } = await supabase.from('badges').select('id').eq('user_id', user!.id).eq('code', 'first_book').maybeSingle()
      if (!existing) {
        await supabase.from('badges').insert({ user_id: user!.id, code: 'first_book', title: 'Lector', description: 'Terminaste tu primer libro', icon: '📚', unlocked: true })
        try { await supabase.rpc('add_xp', { p_xp: XP.GOAL_COMPLETED }) } catch {}
      }
    }
    setReading((prev) => prev ? { ...prev, ...updates } : prev)
    setBooks((prev) => prev.map((b) => b.id === reading.id ? { ...b, ...updates } : b))
  }

  const handleLogReading = async (pageStart: number, pageEnd: number, seconds: number) => {
    if (!user || !reading || seconds < 1) return
    await supabase.from('book_reading_logs').insert({
      user_id: user.id,
      book_id: reading.id,
      page_start: pageStart,
      page_end: pageEnd,
      seconds,
    })
    // XP por lectura: 1 XP por minuto leído
    const xp = Math.round(seconds / 60)
    if (xp > 0) { try { await supabase.rpc('add_xp', { p_xp: xp }) } catch {} }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este libro y su PDF?')) return
    const book = books.find((b) => b.id === id)
    if (book?.file_path) await supabase.storage.from('books').remove([book.file_path])
    await supabase.from('books').delete().eq('id', id)
    setBooks((prev) => prev.filter((b) => b.id !== id))
  }

  const togglePin = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const b = books.find((x) => x.id === id)
    if (!b) return
    await supabase.from('books').update({ is_pinned: !b.is_pinned }).eq('id', id)
    setBooks((prev) => prev.map((x) => x.id === id ? { ...x, is_pinned: !x.is_pinned } : x))
  }

  const pctOf = (b: Book) => b.total_pages > 0 ? Math.min(100, Math.round((b.current_page / b.total_pages) * 100)) : 0

  const categories = [...new Set(books.map((b) => b.category).filter(Boolean))].sort()

  const filtered = books.filter((b) => {
  if (categoryFilter && b.category !== categoryFilter) return false
  if (search.trim()) {
    const q = search.trim().toLowerCase()
    if (!b.title.toLowerCase().includes(q) && !(b.author || '').toLowerCase().includes(q) && !(b.category || '').toLowerCase().includes(q)) return false
  }
  return true
})
  const ordered = [...filtered]
  if (sortBy === 'progress') {
    ordered.sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0) || pctOf(b) - pctOf(a))
  } else {
    ordered.sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0) || (a.sort_order ?? 0) - (b.sort_order ?? 0))
  }

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
    setDragId(id)
  }
  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setOverId(id)
  }
  const handleDrop = async (e: React.DragEvent, id: string) => {
    e.preventDefault()
    const fromId = dragId || e.dataTransfer.getData('text/plain')
    if (!fromId || fromId === id) { setDragId(null); setOverId(null); return }
    const list = [...ordered]
    const fromIdx = list.findIndex((b) => b.id === fromId)
    const toIdx = list.findIndex((b) => b.id === id)
    if (fromIdx < 0 || toIdx < 0) { setDragId(null); setOverId(null); return }
    const [moved] = list.splice(fromIdx, 1)
    list.splice(toIdx, 0, moved)
    const updates = list.map((b, i) => supabase.from('books').update({ sort_order: i }).eq('id', b.id))
    await Promise.all(updates)
    setBooks((prev) => prev.map((b) => {
      const found = list.findIndex((x) => x.id === b.id)
      return found >= 0 ? { ...b, sort_order: found } : b
    }))
    setDragId(null)
    setOverId(null)
  }

  const openEdit = (e: React.MouseEvent, b: Book) => {
    e.stopPropagation()
    setEditing(b)
    setTitle(b.title)
    setAuthor(b.author || '')
    setCategory(b.category || '')
    setDeadline(b.deadline || '')
    setFile(null)
    setShowForm(true)
  }

  const openDetails = (b: Book) => {
    setDetailBook(b)
    if (!user) return
    supabase.from('book_chapters').select('*').eq('user_id', user.id).eq('book_id', b.id).order('sort_order').then(({ data }: any) => {
      setChapters(data || [])
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">📚 Libros</h1>
          <p className="text-xs text-text-secondary mt-0.5">Sube tus PDFs y sigue tu progreso de lectura página a página</p>
        </div>
        <button onClick={() => { setEditing(null); setTitle(''); setAuthor(''); setCategory(''); setDeadline(''); setFile(null); setShowForm(true) }}
          className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition-all">+ Subir libro</button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-card rounded-xl border border-white/10 p-3 text-center">
          <div className="text-lg font-bold text-white">{books.length}</div>
          <div className="text-[10px] text-text-secondary uppercase tracking-wider">Libros</div>
        </div>
        <div className="bg-card rounded-xl border border-white/10 p-3 text-center">
          <div className="text-lg font-bold text-[#FF9800]">{books.filter((b) => statusOf(b) === 'progress').length}</div>
          <div className="text-[10px] text-text-secondary uppercase tracking-wider">En progreso</div>
        </div>
        <div className="bg-card rounded-xl border border-white/10 p-3 text-center">
          <div className="text-lg font-bold text-[#28C76F]">{books.filter((b) => statusOf(b) === 'done').length}</div>
          <div className="text-[10px] text-text-secondary uppercase tracking-wider">Terminados</div>
        </div>
        <div className="bg-card rounded-xl border border-white/10 p-3 text-center">
          <div className="text-lg font-bold text-accent">{formatMinutes(totalMinutes)}</div>
          <div className="text-[10px] text-text-secondary uppercase tracking-wider">Total leído</div>
        </div>
        <div className="bg-card rounded-xl border border-white/10 p-3 text-center">
          <div className="text-lg font-bold" style={{ color: todayMinutes > 0 ? '#FF9800' : '#a0a0b0' }}>{todayMinutes}min</div>
          <div className="text-[10px] text-text-secondary uppercase tracking-wider">Hoy</div>
        </div>
        <div className="bg-card rounded-xl border border-white/10 p-3 text-center">
          <div className="text-lg font-bold" style={{ color: streak > 0 ? '#FF6B6B' : '#a0a0b0' }}>🔥 {streak}d</div>
          <div className="text-[10px] text-text-secondary uppercase tracking-wider">Racha</div>
        </div>
      </div>

      <ReadingHeatmap activity={activityMap} />

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 bg-secondary border border-white/10 rounded-lg px-2.5 py-1.5">
          <span className="text-text-secondary text-xs">🔍</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar libro…"
            className="w-40 bg-transparent text-xs text-white placeholder:text-text-secondary/50 focus:outline-none" />
        </div>
        <button onClick={() => setView(view === 'shelf' ? 'grid' : 'shelf')}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${view === 'shelf' ? 'bg-[var(--accent)] text-white' : 'bg-secondary text-text-secondary hover:text-white'}`}>
          {view === 'shelf' ? '🏛️ Estantería' : '📋 Cuadrícula'}
        </button>
        <span className="text-white/20">|</span>
        <span className="text-[10px] text-text-secondary uppercase tracking-wider">Ordenar:</span>
        <button onClick={() => setSortBy('progress')}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${sortBy === 'progress' ? 'bg-[var(--accent)] text-white' : 'bg-secondary text-text-secondary hover:text-white'}`}>
          📈 Más avanzados
        </button>
        <button onClick={() => setSortBy('custom')}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${sortBy === 'custom' ? 'bg-[var(--accent)] text-white' : 'bg-secondary text-text-secondary hover:text-white'}`}>
          🖐️ Mi orden (drag & drop)
        </button>
        {categories.length > 0 && (
          <>
            <span className="text-white/20">|</span>
            <span className="text-[10px] text-text-secondary uppercase tracking-wider">Categoría:</span>
            <button onClick={() => setCategoryFilter('')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${categoryFilter === '' ? 'bg-[var(--accent)] text-white' : 'bg-secondary text-text-secondary hover:text-white'}`}>
              Todas
            </button>
            {categories.map((c) => (
              <button key={c} onClick={() => setCategoryFilter(c)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${categoryFilter === c ? 'bg-[var(--accent)] text-white' : 'bg-secondary text-text-secondary hover:text-white'}`}>
                {c}
              </button>
            ))}
          </>
        )}
      </div>

      {books.length === 0 ? (
        <div className="bg-card rounded-xl border border-white/10 p-12 text-center text-text-secondary text-sm">
          <div className="text-3xl mb-2">📚</div>
          <p>Sube tu primer PDF para empezar a medir tu lectura</p>
        </div>
      ) : view === 'shelf' ? (
        (() => {
          const sections = [
            { key: 'progress', title: '📖 Leyendo', color: '#FF9800' },
            { key: 'nuevo', title: '🆕 Por leer', color: '#60A5FA' },
            { key: 'done', title: '✅ Terminados', color: '#28C76F' },
          ]
          return (
            <div className="space-y-6">
              {sections.map((sec) => {
                const items = ordered.filter((b) => statusOf(b) === sec.key)
                if (items.length === 0) return null
                return (
                  <div key={sec.key}>
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: sec.color }}>{sec.title}</span>
                      <span className="text-[10px] text-text-secondary/50">({items.length})</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                      {items.map((b) => (
                        <ShelfBook
                          key={b.id}
                          book={b}
                          stats={logsByBook[b.id]}
                          onOpen={openReader}
                          onDetails={openDetails}
                          onTogglePin={togglePin}
                          onEdit={openEdit}
                          onDelete={handleDelete}
                          draggable={sortBy === 'custom'}
                          isDragging={dragId === b.id}
                          isOver={overId === b.id}
                          onDragStart={handleDragStart}
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                          onDragEnd={() => { setDragId(null); setOverId(null) }}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })()
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ordered.map((b) => {
            const pct = pctOf(b)
            const remaining = Math.max(0, b.total_pages - b.current_page)
            const status = statusOf(b)
            const meta = STATUS_META[status]
            const isDragging = dragId === b.id
            const isOver = overId === b.id
            const stats = logsByBook[b.id]
            const onTrack = b.deadline && b.total_pages > 0 && b.current_page < b.total_pages
              ? (() => {
                  const start = b.created_at.slice(0, 10)
                  const totalDays = Math.max(1, Math.round((new Date(b.deadline).getTime() - new Date(start).getTime()) / 86400000))
                  const elapsed = Math.max(0, Math.round((Date.now() - new Date(start).getTime()) / 86400000))
                  const expected = Math.round((b.current_page + Math.max(0, b.total_pages - b.current_page) * (elapsed / totalDays)))
                  return b.current_page >= expected
                })() : null
            return (
              <div key={b.id}
                draggable={sortBy === 'custom'}
                onDragStart={(e) => handleDragStart(e, b.id)}
                onDragOver={(e) => handleDragOver(e, b.id)}
                onDrop={(e) => handleDrop(e, b.id)}
                onDragEnd={() => { setDragId(null); setOverId(null) }}
                className={`bg-card rounded-xl border border-white/10 p-4 transition-all cursor-pointer ${isDragging ? 'opacity-40 border-accent/50' : ''} ${isOver ? 'border-accent/60 ring-1 ring-accent/30' : ''} hover:border-[var(--accent)] ${b.is_pinned ? 'border-[var(--accent)]/40' : ''}`}
                onClick={() => openReader(b)}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {sortBy === 'custom' && <span className="text-text-secondary/30 text-xs cursor-grab select-none">⠿</span>}
                      {b.is_pinned && <span className="text-[11px]">📌</span>}
                      <div className="text-sm font-bold text-white truncate">{b.title}</div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-text-secondary truncate ml-4">
                      {b.author && <span>{b.author}</span>}
                      {b.category && <span className="px-1 rounded bg-white/10">{b.category}</span>}
                    </div>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0"
                    style={{ color: meta.color, backgroundColor: meta.bg }}>{meta.label}</span>
                </div>

                {onTrack !== null && (
                  <div className={`text-[10px] mb-1 font-medium ${onTrack ? 'text-success' : 'text-[#EA5455]'}`}>
                    {onTrack ? '🟢 Al día con tu meta' : '🔴 Atrasado con tu meta'}
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-text-secondary mb-1.5">
                  <span>{b.current_page}/{b.total_pages || '?'} páginas {pct === 0 && '· sin iniciar'}</span>
                  <span className="font-bold" style={{ color: meta.color }}>{pct}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2 overflow-hidden mb-1.5">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: pct >= 80 ? 'linear-gradient(90deg, #28C76F, #81E6A0)' : 'linear-gradient(90deg, var(--accent), #b388ff)' }} />
                </div>
                <div className="flex items-center justify-between text-[10px] text-text-secondary/60">
                  <span>{pct > 0 ? `Quedan ${remaining} pág.` : `${b.total_pages || '?'} páginas en total`}</span>
                  <span className="flex items-center gap-1.5">
                    {stats && stats.minutes > 0 && <span title={`${stats.minutes}min · ${stats.days} día(s)`}>⏱ {formatMinutes(stats.minutes)}</span>}
                    <button onClick={(e) => togglePin(e, b.id)} title={b.is_pinned ? 'Quitar de favoritos' : 'Marcar favorito'}
                      className="hover:scale-110 transition-transform">📌</button>
                    <button onClick={(e) => openEdit(e, b)} title="Editar"
                      className="hover:scale-110 transition-transform">✏️</button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(b.id) }}
                      className="text-danger/50 hover:text-danger transition-colors">🗑️</button>
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowForm(false)}>
          <div className="bg-card rounded-xl border border-white/10 p-5 w-full max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-white">{editing ? 'Editar libro' : 'Subir libro'}</span>
              <button onClick={() => setShowForm(false)} className="text-text-secondary hover:text-white text-lg leading-none">&times;</button>
            </div>
            <form onSubmit={handleUpload} className="space-y-3">
              <div>
                <label className="text-[10px] text-text-secondary uppercase tracking-wider mb-1 block">Título *</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value.slice(0, 120))}
                  className="w-full bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-text-secondary uppercase tracking-wider mb-1 block">Autor</label>
                  <input type="text" value={author} onChange={(e) => setAuthor(e.target.value.slice(0, 80))}
                    className="w-full bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="text-[10px] text-text-secondary uppercase tracking-wider mb-1 block">Categoría</label>
                  <input type="text" value={category} onChange={(e) => setCategory(e.target.value.slice(0, 40))} placeholder="Ej: Programación"
                    className="w-full bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-text-secondary uppercase tracking-wider mb-1 block">Meta: fecha límite de lectura</label>
                <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
              </div>
              {!editing && (
                <div>
                  <label className="text-[10px] text-text-secondary uppercase tracking-wider mb-1 block">Archivo PDF *</label>
                  <input ref={fileRef} type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-text-secondary file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-accent file:text-white file:text-xs file:cursor-pointer" />
                </div>
              )}
              <button type="submit" disabled={uploading}
                className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50">
                {uploading ? 'Guardando…' : editing ? '💾 Guardar' : '📤 Subir y leer'}
              </button>
            </form>
          </div>
        </div>
      )}

      {reading && (
        <div className="fixed inset-0 z-50 bg-black/90 overflow-y-auto" onClick={() => setReading(null)}>
          <div className="max-w-4xl mx-auto p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-white truncate">📖 {reading.title}</span>
              <button onClick={() => setReading(null)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-text-secondary hover:text-white transition-all">✕ Cerrar</button>
            </div>
            <BookReader book={reading} url={readerUrl} onProgress={handleProgress} onLogReading={handleLogReading} dailyGoalMinutes={30} onSessionEnd={setSessionSummary} />
          </div>
        </div>
      )}

      {sessionSummary && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70" onClick={() => setSessionSummary(null)}>
          <div className="bg-card rounded-xl border border-white/10 p-6 w-full max-w-sm mx-4 shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
            <div className="text-3xl mb-2">📚</div>
            <h3 className="text-base font-bold text-white mb-1">Sesión terminada</h3>
            <p className="text-[11px] text-text-secondary mb-4">{reading?.title}</p>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-secondary rounded-lg p-3">
                <div className="text-lg font-bold text-accent">{Math.round(sessionSummary.seconds / 60)}min</div>
                <div className="text-[10px] text-text-secondary uppercase tracking-wider mt-0.5">Leído hoy</div>
              </div>
              <div className="bg-secondary rounded-lg p-3">
                <div className="text-lg font-bold text-white">{sessionSummary.pagesRead} pág.</div>
                <div className="text-[10px] text-text-secondary uppercase tracking-wider mt-0.5">Avance en sesión</div>
              </div>
            </div>
            <button onClick={() => setSessionSummary(null)}
              className="w-full py-2 rounded-lg text-sm font-medium text-white transition-all"
              style={{ backgroundColor: 'var(--accent)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent)'}>
              Continuar
            </button>
          </div>
        </div>
      )}

      {detailBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 overflow-y-auto" onClick={() => setDetailBook(null)}>
          <div className="bg-card rounded-xl border border-white/10 p-5 w-full max-w-md mx-4 my-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-3xl shrink-0">📖</span>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-white leading-tight truncate">{detailBook.title}</h3>
                  <div className="text-xs text-text-secondary">{detailBook.author || 'Sin autor'}</div>
                </div>
              </div>
              <button onClick={() => setDetailBook(null)} className="text-text-secondary hover:text-white text-lg leading-none">&times;</button>
            </div>

            {detailBook.category && (
              <div className="mb-2">
                <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] text-text-secondary">{detailBook.category}</span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-secondary rounded-lg p-2.5 text-center">
                <div className="text-base font-bold text-white">{detailBook.current_page}/{detailBook.total_pages || '?'}</div>
                <div className="text-[9px] text-text-secondary uppercase tracking-wider mt-0.5">Páginas</div>
              </div>
              <div className="bg-secondary rounded-lg p-2.5 text-center">
                <div className="text-base font-bold text-accent">{pctOf(detailBook)}%</div>
                <div className="text-[9px] text-text-secondary uppercase tracking-wider mt-0.5">Avance</div>
              </div>
              <div className="bg-secondary rounded-lg p-2.5 text-center">
                <div className="text-base font-bold text-white">
                  {detailBook.deadline ? (() => {
                    const days = Math.max(0, Math.round((new Date(detailBook.deadline).getTime() - Date.now()) / 86400000))
                    return <span style={{ color: days <= 3 ? '#EA5455' : '#fff' }}>{days}d</span>
                  })() : '—'}
                </div>
                <div className="text-[9px] text-text-secondary uppercase tracking-wider mt-0.5">Quedan</div>
              </div>
            </div>

            <div className="mb-3">
              <div className="text-[10px] text-text-secondary uppercase tracking-wider mb-1">Capitulos ({chapters.length})</div>
              {chapters.length === 0 ? (
                <div className="text-[11px] text-text-secondary/50">Aún no defines capítulos. Cada capítulo se marca como leído al pasar su página inicial.</div>
              ) : (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {chapters.map((ch, i) => {
                    const done = detailBook.current_page >= ch.start_page
                    const next = chapters[i + 1]
                    const doneNext = next ? detailBook.current_page >= next.start_page : done
                    return (
                      <div key={ch.id} className="flex items-center gap-2 text-xs py-1 border-b border-white/5 last:border-0">
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] shrink-0 ${doneNext ? 'bg-success/20 text-success' : 'bg-secondary text-text-secondary/50'}`}>{doneNext ? '✓' : ''}</span>
                        <span className={`truncate flex-1 ${doneNext ? 'text-white' : 'text-text-secondary'}`}>{ch.title}</span>
                        <span className="text-text-secondary/50 text-[10px]">p{ch.start_page}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button onClick={() => { setDetailBook(null); openReader(detailBook) }}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-white transition-all"
                style={{ backgroundColor: 'var(--accent)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent)'}>
                📖 Continuar leyendo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}