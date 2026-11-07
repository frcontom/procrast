import { useMemo, useState } from 'react'
import type { StudyItem, StudyItemInsert, StudyTechnique } from '../supabase/types'
import { useStudy } from '../hooks/useStudy'
import { todayStr } from '../lib/spacedRepetition'
import { StudyItemModal } from '../components/study/StudyItemModal'
import { StudyReviewModal } from '../components/study/StudyReviewModal'

const TECH_BADGES: { key: keyof StudyItem; icon: string; title: string }[] = [
  { key: 'question', icon: '🧠', title: 'Active Recall' },
  { key: 'feynman', icon: '🗣', title: 'Feynman' },
  { key: 'skill', icon: '🎯', title: 'Práctica deliberada' },
]

export function StudyPage() {
  const { items, loading, createItem, updateItem, deleteItem, review, addRep } = useStudy()
  const [editing, setEditing] = useState<StudyItem | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [reviewing, setReviewing] = useState<StudyItem | null>(null)
  const [showReview, setShowReview] = useState(false)

  const today = todayStr()
  const due = useMemo(() => items.filter((i) => i.due_date <= today), [items, today])

  // Agrupa por materia
  const bySubject = useMemo(() => {
    const map: Record<string, StudyItem[]> = {}
    for (const i of items) {
      const k = i.subject || 'Sin materia'
      ;(map[k] ||= []).push(i)
    }
    return map
  }, [items])

  const openNew = () => { setEditing(null); setShowForm(true) }
  const openEdit = (i: StudyItem) => { setEditing(i); setShowForm(true) }
  const openReview = (i: StudyItem) => { setReviewing(i); setShowReview(true) }

  const save = async (data: Omit<StudyItemInsert, 'user_id'>) => {
    if (editing) await updateItem(editing.id, data)
    else await createItem(data)
    setShowForm(false)
    setEditing(null)
  }

  const onReview = async (id: string, quality: number, technique: StudyTechnique) => {
    await review(id, quality, technique)
  }

  const dueLabel = (d: string) =>
    d < today ? 'Atrasado' : d === today ? 'Hoy' : d

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Estudio</h1>
          <p className="text-sm text-text-secondary">Active Recall · Feynman · Repetición espaciada · Práctica deliberada</p>
        </div>
        <button onClick={openNew} className="bg-accent hover:bg-[var(--accent-hover)] text-white px-4 py-2 rounded-lg text-sm transition-colors">
          + Nuevo ítem
        </button>
      </div>

      {/* Para repasar hoy */}
      <section className="bg-secondary rounded-2xl p-5 border border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-accent">🔁</span>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Para repasar hoy</h2>
          <span className="ml-auto text-xs text-text-secondary">{due.length} pendiente{due.length === 1 ? '' : 's'}</span>
        </div>
        {due.length === 0 ? (
          <p className="text-sm text-text-secondary py-4 text-center">Nada pendiente. Todo al día 🎉</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {due.map((i) => (
              <button key={i.id} onClick={() => openReview(i)}
                className="text-left bg-card rounded-xl p-3 hover:ring-1 hover:ring-accent transition-all">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: i.color }} />
                  <span className="text-sm text-white truncate flex-1">{i.title}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                  <span className={i.due_date < today ? 'text-danger' : 'text-warning'}>{dueLabel(i.due_date)}</span>
                  <span className="ml-auto flex gap-0.5">
                    {TECH_BADGES.filter((b) => i[b.key]).map((b) => (
                      <span key={b.key} title={b.title}>{b.icon}</span>
                    ))}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Todo, por materia */}
      {loading ? (
        <p className="text-sm text-text-secondary">Cargando…</p>
      ) : items.length === 0 ? (
        <div className="bg-secondary rounded-2xl p-8 border border-white/10 text-center">
          <p className="text-text-secondary mb-3">Aún no tienes ítems de estudio.</p>
          <button onClick={openNew} className="bg-accent hover:bg-[var(--accent-hover)] text-white px-4 py-2 rounded-lg text-sm transition-colors">
            Crear el primero
          </button>
        </div>
      ) : (
        Object.entries(bySubject).map(([subject, list]) => (
          <section key={subject} className="space-y-2">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{subject}</h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((i) => (
                <div key={i.id} className="bg-secondary rounded-xl p-3 border border-white/10 group">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: i.color }} />
                    <span className="text-sm text-white truncate flex-1">{i.title}</span>
                    <button onClick={() => openEdit(i)} className="opacity-0 group-hover:opacity-100 text-text-secondary hover:text-white text-xs transition-opacity">✎</button>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-text-secondary mb-2">
                    <span>Repaso: {dueLabel(i.due_date)}</span>
                    {i.reps > 0 && <span className="ml-auto">🎯 {i.reps} reps</span>}
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {TECH_BADGES.filter((b) => i[b.key]).map((b) => (
                      <span key={b.key} title={b.title} className="text-xs bg-card rounded px-1.5 py-0.5">{b.icon}</span>
                    ))}
                  </div>
                  <button onClick={() => openReview(i)} className="w-full bg-accent/15 text-accent hover:bg-accent/25 py-1.5 rounded-lg text-xs transition-colors">
                    Repasar
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))
      )}

      <StudyItemModal
        open={showForm}
        item={editing}
        onSave={save}
        onDelete={async (id) => { await deleteItem(id); setShowForm(false); setEditing(null) }}
        onClose={() => { setShowForm(false); setEditing(null) }}
      />

      <StudyReviewModal
        open={showReview}
        item={reviewing}
        onReview={onReview}
        onAddRep={addRep}
        onClose={() => { setShowReview(false); setReviewing(null) }}
      />
    </div>
  )
}
