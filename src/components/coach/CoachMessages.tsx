import type { CoachingMessage } from '../../supabase/types'

interface Props {
  messages: CoachingMessage[]
  onMarkShown: (id: string) => void
}

const TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  insight: { icon: '💡', color: '#A66CFF' },
  nudge: { icon: '👋', color: '#FF9800' },
  achievement: { icon: '🏆', color: '#4CAF50' },
  milestone: { icon: '🎯', color: '#FF6B6B' },
}

export function CoachMessages({ messages, onMarkShown }: Props) {
  const sorted = [...messages].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  if (sorted.length === 0) {
    return (
      <div className="text-center py-12 text-text-secondary">
        <span className="text-4xl block mb-3">🤖</span>
        <p className="text-sm">Completa sesiones y mantén rachas</p>
        <p className="text-xs mt-1">para recibir mensajes del coach</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sorted.map((msg) => {
        const config = TYPE_CONFIG[msg.msg_type] || { icon: '💬', color: '#A66CFF' }
        return (
          <div key={msg.id}
            onClick={() => !msg.shown && onMarkShown(msg.id)}
            className={`bg-card rounded-xl border p-4 transition-all cursor-pointer ${
              msg.shown ? 'border-white/5 opacity-50' : 'border-white/10 hover:border-accent/30'
            }`}>
            <div className="flex items-start gap-3">
              <span className="text-xl">{config.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{msg.title}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: config.color + '30', color: config.color }}>
                    {msg.msg_type}
                  </span>
                </div>
                <p className="text-sm text-text-secondary">{msg.message}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] text-text-secondary">
                    {new Date(msg.created_at).toLocaleDateString()}
                  </span>
                  {msg.category !== 'general' && (
                    <span className="text-[10px] text-text-secondary">· {msg.category}</span>
                  )}
                  {!msg.shown && (
                    <span className="text-[10px] text-accent">Nuevo</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
