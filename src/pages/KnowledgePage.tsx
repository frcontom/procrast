import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../supabase/client'
import { useUser } from '../supabase/auth'
import type { KnowledgeNote } from '../supabase/types'
import { NoteSearch } from '../components/knowledge/NoteSearch'
import { NoteEditor } from '../components/knowledge/NoteEditor'
import { NoteList } from '../components/knowledge/NoteList'

export function KnowledgePage() {
  const user = useUser()
  const [notes, setNotes] = useState<KnowledgeNote[]>([])
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<KnowledgeNote | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [showEditor, setShowEditor] = useState(true)

  const loadNotes = useCallback(() => {
    if (!user) return
    let query = supabase.from('knowledge_notes').select('*').eq('user_id', user.id)
    if (filterType !== 'all') query = query.eq('note_type', filterType)
    query.order('created_at', { ascending: false }).then(({ data }: any) => {
      if (data) setNotes(data)
    })
  }, [user, filterType])

  useEffect(() => { loadNotes() }, [loadNotes])

  const filtered = search
    ? notes.filter((n) =>
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.content.toLowerCase().includes(search.toLowerCase()) ||
        n.tags.toLowerCase().includes(search.toLowerCase())
      )
    : notes

  const saveNote = async (data: { title: string; content: string; note_type: 'general' | 'session' | 'mission' | 'habit'; tags: string }) => {
    if (!user) return
    if (editing) {
      await supabase.from('knowledge_notes').update({ ...data, updated_at: new Date().toISOString() }).eq('id', editing.id)
      setNotes((prev) => prev.map((n) => (n.id === editing.id ? { ...n, ...data } : n)))
      setEditing(null)
    } else {
      const { data: newNote }: any = await supabase.from('knowledge_notes').insert({
        user_id: user.id, ...data,
      }).select().single()
      if (newNote) setNotes((prev) => [newNote, ...prev])
    }
  }

  const deleteNote = async (id: string) => {
    await supabase.from('knowledge_notes').delete().eq('id', id)
    setNotes((prev) => prev.filter((n) => n.id !== id))
    if (editing?.id === id) setEditing(null)
  }

  const selectNote = (note: KnowledgeNote) => {
    setEditing(note)
    setShowEditor(true)
  }

  const FILTERS = [
    { id: 'all', label: 'Todas' },
    { id: 'general', label: '📝 General' },
    { id: 'session', label: '⏱ Sesión' },
    { id: 'mission', label: '🎯 Misión' },
    { id: 'habit', label: '✓ Hábito' },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-4">
        <NoteSearch value={search} onChange={setSearch} />

        <div className="flex gap-1 bg-secondary rounded-lg p-1 w-fit">
          {FILTERS.map((f) => (
            <button key={f.id} onClick={() => setFilterType(f.id)}
              className={`px-3 py-1.5 rounded-md text-xs transition-colors ${filterType === f.id ? 'bg-accent text-white' : 'text-text-secondary hover:text-white'}`}>
              {f.label}
            </button>
          ))}
        </div>

        <NoteList notes={filtered} onSelect={selectNote} onDelete={deleteNote} />
      </div>

      <div className="space-y-4">
        <button onClick={() => { setEditing(null); setShowEditor(!showEditor) }}
          className="w-full bg-accent hover:bg-[var(--accent-hover)] text-white px-4 py-2 rounded-lg text-sm transition-colors">
          {showEditor ? '✕ Cerrar' : '+ Nueva nota'}
        </button>

        {showEditor && (
          <NoteEditor
            key={editing?.id || 'new'}
            note={editing}
            onSave={saveNote}
            onClose={() => setEditing(null)}
          />
        )}
      </div>
    </div>
  )
}
