import { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabase/client'
import { useUser } from '../supabase/auth'
import type { Book } from '../supabase/types'
import { BookReader } from '../components/books/BookReader'

export function BooksPage() {
  const user = useUser()
  const [books, setBooks] = useState<Book[]>([])
  const [reading, setReading] = useState<Book | null>(null)
  const [readerUrl, setReaderUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) return
    supabase.from('books').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data }: any) => {
      if (data) setBooks(data)
    })
  }, [user])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !file || !title.trim()) return
    if (file.type !== 'application/pdf') { alert('Solo se permiten archivos PDF'); return }

    setUploading(true)
    try {
      const filePath = `${user.id}/${crypto.randomUUID()}.pdf`
      const { error: upErr } = await supabase.storage.from('books').upload(filePath, file, { contentType: 'application/pdf' })
      if (upErr) throw upErr

      const { data: book, error } = await supabase.from('books').insert({
        user_id: user.id,
        title: title.trim(),
        author: author.trim(),
        file_path: filePath,
        file_name: file.name,
        status: 'reading',
        current_page: 1,
      }).select().single()
      if (error) throw error

      setBooks((prev) => [book, ...prev])
      setShowForm(false)
      setTitle('')
      setAuthor('')
      setFile(null)
      if (fileRef.current) fileRef.current.value = ''
    } catch (err: any) {
      alert('Error al subir: ' + err.message)
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
    const updates: any = { current_page: page }
    if (totalPages > 0 && reading.total_pages !== totalPages) updates.total_pages = totalPages
    if (page >= totalPages) updates.status = 'finished'
    await supabase.from('books').update(updates).eq('id', reading.id)
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
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este libro y su PDF?')) return
    const book = books.find((b) => b.id === id)
    if (book?.file_path) await supabase.storage.from('books').remove([book.file_path])
    await supabase.from('books').delete().eq('id', id)
    setBooks((prev) => prev.filter((b) => b.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">📚 Libros</h1>
          <p className="text-xs text-text-secondary mt-0.5">Sube tus PDFs y sigue tu progreso de lectura página a página</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition-all">+ Subir libro</button>
      </div>

      {books.length === 0 ? (
        <div className="bg-card rounded-xl border border-white/10 p-12 text-center text-text-secondary text-sm">
          <div className="text-3xl mb-2">📚</div>
          <p>Sube tu primer PDF para empezar a medir tu lectura</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {books.map((b) => {
            const pct = b.total_pages > 0 ? Math.min(100, Math.round((b.current_page / b.total_pages) * 100)) : 0
            const remaining = Math.max(0, b.total_pages - b.current_page)
            return (
              <div key={b.id} className="bg-card rounded-xl border border-white/10 p-4 hover:border-[var(--accent)] transition-all cursor-pointer"
                onClick={() => openReader(b)}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-white truncate">{b.title}</div>
                    {b.author && <div className="text-[11px] text-text-secondary truncate">{b.author}</div>}
                  </div>
                  {b.status === 'finished' && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-success/20 text-success shrink-0">Terminado</span>}
                </div>
                <div className="flex items-center justify-between text-[11px] text-text-secondary mb-1.5">
                  <span>Página {b.current_page} de {b.total_pages || '—'}</span>
                  <span className="text-accent font-bold">{pct}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2 overflow-hidden mb-1.5">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--accent), #b388ff)' }} />
                </div>
                <div className="flex items-center justify-between text-[10px] text-text-secondary/60">
                  <span>Quedan {remaining} pág.</span>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(b.id) }}
                    className="text-danger/50 hover:text-danger transition-colors">🗑️</button>
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
              <span className="text-sm font-semibold text-white">Subir libro</span>
              <button onClick={() => setShowForm(false)} className="text-text-secondary hover:text-white text-lg leading-none">&times;</button>
            </div>
            <form onSubmit={handleUpload} className="space-y-3">
              <div>
                <label className="text-[10px] text-text-secondary uppercase tracking-wider mb-1 block">Título *</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value.slice(0, 120))}
                  className="w-full bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" required />
              </div>
              <div>
                <label className="text-[10px] text-text-secondary uppercase tracking-wider mb-1 block">Autor</label>
                <input type="text" value={author} onChange={(e) => setAuthor(e.target.value.slice(0, 80))}
                  className="w-full bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="text-[10px] text-text-secondary uppercase tracking-wider mb-1 block">Archivo PDF *</label>
                <input ref={fileRef} type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-text-secondary file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-accent file:text-white file:text-xs file:cursor-pointer" />
              </div>
              <div className="text-[10px] text-text-secondary/60">
                El PDF se guarda en Supabase Storage (privado, solo tú puedes acceder).
              </div>
              <button type="submit" disabled={uploading}
                className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50">
                {uploading ? 'Subiendo…' : '📤 Subir y leer'}
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
            <BookReader book={reading} url={readerUrl} onProgress={handleProgress} onLogReading={handleLogReading} />
          </div>
        </div>
      )}
    </div>
  )
}