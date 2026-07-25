import { useEffect, useState } from 'react'
import { supabase } from '../../supabase/client'
import { useUser } from '../../supabase/auth'
import { getLevelProgress, getLevelTitle } from '../../lib/gamification'

export function GamificationPanel() {
  const user = useUser()
  const [data, setData] = useState<{ total_xp: number; level: number } | null>(null)
  const [badges, setBadges] = useState<any[]>([])

  useEffect(() => {
    if (!user) return
    supabase.from('gamification').select('total_xp, level').eq('user_id', user.id).single().then(({ data: d }: any) => {
      if (d) setData(d)
    })
    supabase.from('badges').select('*').eq('user_id', user.id).eq('unlocked', true).then(({ data: b }: any) => {
      if (b) setBadges(b)
    })
  }, [user])

  if (!data) return null

  const progress = getLevelProgress(data.total_xp, data.level)
  const title = getLevelTitle(data.level)

  return (
    <div className="bg-card rounded-xl border border-white/10 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">💎</span>
        <div>
          <div className="text-sm font-semibold">Nivel {data.level}</div>
          <div className="text-[10px] text-text-secondary">{title}</div>
        </div>
      </div>

      <div className="w-full bg-secondary rounded-full h-2 mb-1">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} />
      </div>
      <div className="text-[10px] text-text-secondary mb-3">{data.total_xp} XP</div>

      {badges.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {badges.map((b) => (
            <span key={b.code} className="text-sm" title={b.title || b.code}>🏅</span>
          ))}
        </div>
      )}
    </div>
  )
}
