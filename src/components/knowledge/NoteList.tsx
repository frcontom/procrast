import type { KnowledgeNote } from '../../supabase/types'

interface Props {
  notes: KnowledgeNote[]
  onSelect: (note: KnowledgeNote) => void
  onDelete: (id: string) => void
}

const TYPE_ICONS: Record<string, string> = {
  general: '📝',
  session: '⏱',
  mission: '🎯',
  habit: '✓',
}

export function NoteList({ notes, onSelect, onDelete }: Props) {
  if (notes.length === 0) {
    return (
      <div className="text-center text-text-secondary text-sm py-8">
        Sin notas. Crea tu primera nota.
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      {notes.map((note) => (
        <div key={note.id}
          onClick={() => onSelect(note)}
          className="bg-secondary rounded-lg p-3 cursor-pointer hover:bg-white/5 transition-colors group">
          <div className="flex items-start gap-3">
            <span className="text-base mt-0.5">{TYPE_ICONS[note.note_type] || '📝'}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{note.title || 'Sin título'}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-text-secondary uppercase">{note.note_type}</span>
              </div>
              {note.content && (
                <p className="text-xs text-text-secondary mt-1 line-clamp-2">{note.content}</p>
              )}
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] text-text-secondary">{new Date(note.created_at).toLocaleDateString()}</span>
                {note.tags && note.tags.split(',').map((t) => t.trim()).filter(Boolean).map((tag) => (
                  <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent">{tag}</span>
                ))}
              </div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onDelete(note.id) }}
              className="text-danger/30 hover:text-danger text-xs opacity-0 group-hover:opacity-100 transition-all">
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
