import { useState, useEffect } from 'react'
import type { KnowledgeNote } from '../../supabase/types'

interface Props {
  note?: KnowledgeNote | null
  onSave: (data: { title: string; content: string; note_type: 'general' | 'session' | 'mission' | 'habit'; tags: string }) => void
  onClose: () => void
}

const NOTE_TYPES: { id: 'general' | 'session' | 'mission' | 'habit'; label: string; icon: string }[] = [
  { id: 'general', label: 'General', icon: '📝' },
  { id: 'session', label: 'Sesión', icon: '⏱' },
  { id: 'mission', label: 'Misión', icon: '🎯' },
  { id: 'habit', label: 'Hábito', icon: '✓' },
]

export function NoteEditor({ note, onSave, onClose }: Props) {
  const [title, setTitle] = useState(note?.title || '')
  const [content, setContent] = useState(note?.content || '')
  const [noteType, setNoteType] = useState<'general' | 'session' | 'mission' | 'habit'>(note?.note_type || 'general')
  const [tags, setTags] = useState(note?.tags || '')

  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setContent(note.content)
      setNoteType(note.note_type)
      setTags(note.tags)
    }
  }, [note])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() && !content.trim()) return
    onSave({ title: title.trim(), content: content.trim(), note_type: noteType, tags })
    if (!note) {
      setTitle('')
      setContent('')
      setNoteType('general')
      setTags('')
    }
  }

  return (
    <div className="bg-card rounded-xl border border-white/10 p-4">
      <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
        {note ? 'Editar nota' : 'Nueva nota'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          {NOTE_TYPES.map((t) => (
            <button key={t.id} type="button" onClick={() => setNoteType(t.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors ${noteType === t.id ? 'bg-accent text-white' : 'bg-secondary text-text-secondary hover:text-white'}`}>
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="Título de la nota"
          className="w-full bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />

        <textarea value={content} onChange={(e) => setContent(e.target.value)}
          placeholder="Escribe tu nota aquí..."
          rows={6}
          className="w-full bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none" />

        <input type="text" value={tags} onChange={(e) => setTags(e.target.value)}
          placeholder="Tags separados por comas"
          className="w-full bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />

        <div className="flex gap-2">
          <button type="submit"
            className="bg-accent hover:bg-[var(--accent-hover)] text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors">
            {note ? 'Guardar' : 'Crear nota'}
          </button>
          {note && (
            <button type="button" onClick={onClose}
              className="text-text-secondary hover:text-white text-sm px-4 py-2 transition-colors">
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
