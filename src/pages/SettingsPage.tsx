import { useEffect, useState } from 'react'
import { supabase } from '../supabase/client'
import { useUser } from '../supabase/auth'
import { useSettingsStore } from '../store/useSettingsStore'
import { ProfileSettings } from '../components/settings/ProfileSettings'
import { TimerSettings } from '../components/settings/TimerSettings'
import { ThemeSettings } from '../components/settings/ThemeSettings'
import { DangerZone } from '../components/settings/DangerZone'

export function SettingsPage() {
  const user = useUser()
  const { name, activityType, timerConfig, setName, setActivityType, setTimerConfig } = useSettingsStore()
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('*').eq('user_id', user.id).single().then(({ data }: any) => {
      if (data) {
        setName(data.name)
        setActivityType(data.activity_type)
        if (data.config?.timer) setTimerConfig({ workMinutes: 25, breakMinutes: 5, maxPauseMinutes: 5, ...data.config.timer })
      }
    })
  }, [user])

  const save = async () => {
    if (!user) return
    await supabase.from('profiles').update({
      name,
      activity_type: activityType,
      config: { timer: timerConfig, ui: { theme: 'dark', language: 'es' }, notifications: { enabled: true, soundEnabled: true } },
    }).eq('user_id', user.id)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <ProfileSettings name={name} activityType={activityType} onNameChange={setName} onActivityChange={setActivityType} />

      <TimerSettings key={JSON.stringify(timerConfig)}
        workMinutes={timerConfig.workMinutes}
        breakMinutes={timerConfig.breakMinutes}
        maxPauseMinutes={timerConfig.maxPauseMinutes}
        onChange={(c) => setTimerConfig(c)}
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
