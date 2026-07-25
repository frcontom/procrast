import { useEffect, useState } from 'react'
import { supabase } from '../supabase/client'
import { useUser } from '../supabase/auth'
import { useSettingsStore } from '../store/useSettingsStore'
import type { TimerConfig } from '../store/useSettingsStore'
import { ProfileSettings } from '../components/settings/ProfileSettings'
import { TimerSettings } from '../components/settings/TimerSettings'
import { ThemeSettings } from '../components/settings/ThemeSettings'
import { DangerZone } from '../components/settings/DangerZone'

export function SettingsPage() {
  const user = useUser()
  const store = useSettingsStore()
  const [localConfig, setLocalConfig] = useState<TimerConfig>(store.timerConfig)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('*').eq('user_id', user.id).single().then(({ data }: any) => {
      if (data) {
        store.setName(data.name)
        store.setActivityType(data.activity_type)
        const cfg: TimerConfig = { workMinutes: 25, breakMinutes: 5, maxPauseMinutes: 5, ...(data.config?.timer || {}) }
        store.setTimerConfig(cfg)
        setLocalConfig(cfg)
      }
    })
  }, [user])

  const save = async () => {
    if (!user) return
    store.setTimerConfig(localConfig)
    const { error } = await supabase.from('profiles').update({
      name: store.name,
      activity_type: store.activityType,
      config: { timer: localConfig, ui: { theme: 'dark', language: 'es' }, notifications: { enabled: true, soundEnabled: true } },
    }).eq('user_id', user.id)
    if (error) { console.error('Save error:', error); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <ProfileSettings name={store.name} activityType={store.activityType} onNameChange={store.setName} onActivityChange={store.setActivityType} />

      <TimerSettings
        workMinutes={localConfig.workMinutes}
        breakMinutes={localConfig.breakMinutes}
        maxPauseMinutes={localConfig.maxPauseMinutes}
        onChange={(c) => setLocalConfig(c)}
      />

      <ThemeSettings />

      <DangerZone />

      <button onClick={save}
        className="bg-[#156390] hover:bg-[#1a7ab5] text-white px-8 py-3 rounded-xl text-sm font-medium transition-all active:scale-[0.97] shadow-lg shadow-[#156390]/30">
        {saved ? '✓ Guardado' : 'Guardar cambios'}
      </button>
    </div>
  )
}
