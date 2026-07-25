import { create } from 'zustand'

interface TimerConfig {
  workMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
}

interface SettingsStore {
  name: string
  activityType: string
  strictMode: boolean
  timerConfig: TimerConfig
  loaded: boolean
  setName: (name: string) => void
  setActivityType: (type: string) => void
  setStrictMode: (strict: boolean) => void
  setTimerConfig: (config: TimerConfig) => void
  setLoaded: (loaded: boolean) => void
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  name: 'Focus',
  activityType: 'focus',
  strictMode: false,
  timerConfig: { workMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15 },
  loaded: false,
  setName: (name) => set({ name }),
  setActivityType: (activityType) => set({ activityType }),
  setStrictMode: (strictMode) => set({ strictMode }),
  setTimerConfig: (timerConfig) => set({ timerConfig }),
  setLoaded: (loaded) => set({ loaded }),
}))
