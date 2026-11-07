import { useState } from 'react'
import type { StudyItem, StudyItemInsert } from '../../supabase/types'
import { Modal } from '../shared/Modal'

const COLORS = ['#a66cff', '#00bcd4', '#28c76f', '#ff9800', '#f44336', '#e91e63', '#3f51b5', '#8bc34a']

const TABS = [
  { id: 'recall', label: '🧠 Active Recall' },
  { id: 'feynman', label: '🗣 Feynman' },
  { id: 'deliberate', label: '🎯 Deliberada' },
] as const

type Tab = typeof TABS[number]['id']

interface Props {
  open: boolean
  item?: StudyItem | null
  onSave: (data: Omit<StudyItemInsert, 'user_id'>) => void
  onDelete?: (id: string) => void
  onClose: () => void
}

export function StudyItemModal({ open, item, onSave, onDelete, onClose }: Props) {
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [feynman, setFeynman] = useState('')
  const [feynmanGaps, setFeynmanGaps] = useState('')
  const [skill, setSkill] = useState('')
  const [tab, setTab] = useState<Tab>('recall')

  const seedKey = item?.id ?? 'new'
  const [lastSeed, setLastSeed] = useState('')
  if (open && seedKey !== lastSeed) {
    setLastSeed(seedKey)
    setTitle(item?.title ?? '')
    setSubject(item?.subject ?? '')
    setColor(item?.color ?? COLORS[0])
    setQuestion(item?.question ?? '')
    setAnswer(item?.answer ?? '')
    setFeynman(item?.feynman ?? '')
    setFeynmanGaps(item?.feynman_gaps ?? '')
    setSkill(item?.skill ?? '')
    setTab('recall')
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSave({
      title: title.trim(),
      subject: subject.trim(),
      color,
      question: question.trim(),
      answer: answer.trim(),
      feynman: feynman.trim(),
      feynman_gaps: feynmanGaps.trim(),
      skill: skill.trim(),
    })
  }

  const input = 'w-full bg-card border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-accent outline-none'
  const label = 'block text-[11px] uppercase tracking-wider text-text-secondary mb-1'

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-lg">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10" style={{ background: `linear-gradient(90deg, ${color}22, transparent)` }}>
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
          {item ? 'Editar ítem de estudio' : 'Nuevo ítem de estudio'}
        </h3>
        <button type="button" onClick={onClose} className="text-text-secondary hover:text-white text-lg leading-none">✕</button>
      </div>

      <form onSubmit={submit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Título</label>
            <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Ciclo de Krebs" autoFocus />
          </div>
          <div>
            <label className={label}>Materia</label>
            <input className={input} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ej: Biología" />
          </div>
        </div>

        {/* Pestañas de técnica */}
        <div className="flex gap-1 bg-card rounded-lg p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-1 px-2 py-1.5 rounded-md text-xs transition-colors ${tab === t.id ? 'bg-accent text-white' : 'text-text-secondary hover:text-white'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'recall' && (
          <div className="space-y-3">
            <p className="text-[11px] text-text-secondary">Escribe la pregunta. En el repaso intentarás responder de memoria antes de ver la respuesta.</p>
            <div>
              <label className={label}>Pregunta</label>
              <textarea className={`${input} resize-none`} rows={2} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="¿Qué debo poder recordar?" />
            </div>
            <div>
              <label className={label}>Respuesta</label>
              <textarea className={`${input} resize-none`} rows={3} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="La respuesta correcta" />
            </div>
          </div>
        )}

        {tab === 'feynman' && (
          <div className="space-y-3">
            <p className="text-[11px] text-text-secondary">Explícalo como si se lo contaras a un niño. Donde te trabes, ahí está tu hueco.</p>
            <div>
              <label className={label}>Tu explicación simple</label>
              <textarea className={`${input} resize-none`} rows={4} value={feynman} onChange={(e) => setFeynman(e.target.value)} placeholder="Explícalo con tus palabras, sin tecnicismos" />
            </div>
            <div>
              <label className={label}>Huecos que detectaste</label>
              <textarea className={`${input} resize-none`} rows={2} value={feynmanGaps} onChange={(e) => setFeynmanGaps(e.target.value)} placeholder="¿Qué parte no supiste explicar bien?" />
            </div>
          </div>
        )}

        {tab === 'deliberate' && (
          <div className="space-y-3">
            <p className="text-[11px] text-text-secondary">Define la habilidad concreta y difícil que quieres dominar con repeticiones enfocadas.</p>
            <div>
              <label className={label}>Habilidad a practicar</label>
              <textarea className={`${input} resize-none`} rows={3} value={skill} onChange={(e) => setSkill(e.target.value)} placeholder="Ej: derivar funciones compuestas sin errores" />
            </div>
          </div>
        )}

        <div>
          <label className={label}>Color</label>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full transition-transform ${color === c ? 'ring-2 ring-white scale-110' : ''}`}
                style={{ backgroundColor: c }} aria-label={`color ${c}`} />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          {item && onDelete && (
            <button type="button" onClick={() => onDelete(item.id)} className="text-danger hover:bg-danger/10 px-3 py-2 rounded-lg text-sm transition-colors">
              🗑 Eliminar
            </button>
          )}
          <button type="submit" className="ml-auto bg-accent hover:bg-[var(--accent-hover)] text-white px-5 py-2 rounded-lg text-sm transition-colors">
            {item ? 'Guardar' : 'Crear ítem'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
