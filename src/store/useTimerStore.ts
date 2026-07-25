import { create } from 'zustand'

export type TimerState = 'IDLE' | 'RUNNING' | 'PAUSED' | 'FINISHED' | 'CANCELLED'

interface TimerStore {
  state: TimerState
  activityType: string
  sessionName: string
  durationMinutes: number
  elapsedSeconds: number
  remainingSeconds: number
  progressPercent: number
  strictMode: boolean
  lockdownMode: boolean
  isStopwatch: boolean
  cycleCount: number
  cycleTotal: number
  workDuration: number
  phase: 'work' | 'short_break' | 'long_break'
  startedAt: string | null
  finishedAt: string | null
  cancelledAt: string | null
  returnGoalId: string | null
  returnGoalName: string | null

  setState: (state: TimerState) => void
  setActivityType: (type: string) => void
  setSessionName: (name: string) => void
  setDuration: (minutes: number) => void
  setElapsed: (seconds: number) => void
  setRemaining: (seconds: number) => void
  setProgress: (percent: number) => void
  setStrictMode: (strict: boolean) => void
  setLockdownMode: (lock: boolean) => void
  setIsStopwatch: (on: boolean) => void
  setCycleCount: (n: number) => void
  setCycleTotal: (n: number) => void
  setWorkDuration: (n: number) => void
  setPhase: (phase: 'work' | 'short_break' | 'long_break') => void
  setStartedAt: (v: string | null) => void
  setFinishedAt: (v: string | null) => void
  setCancelledAt: (v: string | null) => void
  setReturnGoal: (id: string | null, name: string | null) => void
  reset: () => void
}

const initialState = {
  state: 'IDLE' as TimerState,
  activityType: 'focus',
  sessionName: '',
  durationMinutes: 25,
  elapsedSeconds: 0,
  remainingSeconds: 1500,
  progressPercent: 0,
  strictMode: false,
  lockdownMode: false,
  isStopwatch: false,
  cycleCount: 0,
  cycleTotal: 0,
  workDuration: 0,
  phase: 'work' as const,
  startedAt: null as string | null,
  finishedAt: null as string | null,
  cancelledAt: null as string | null,
  returnGoalId: null as string | null,
  returnGoalName: null as string | null,
}

export const useTimerStore = create<TimerStore>((set) => ({
  ...initialState,
  setState: (state) => set({ state }),
  setActivityType: (activityType) => set({ activityType }),
  setSessionName: (sessionName) => set({ sessionName }),
  setDuration: (durationMinutes) => set({ durationMinutes, remainingSeconds: durationMinutes * 60, isStopwatch: durationMinutes >= 480 }),
  setElapsed: (elapsedSeconds) => set({ elapsedSeconds }),
  setRemaining: (remainingSeconds) => set({ remainingSeconds }),
  setProgress: (progressPercent) => set({ progressPercent }),
  setStrictMode: (strictMode) => set({ strictMode }),
  setLockdownMode: (lockdownMode) => set({ lockdownMode }),
  setIsStopwatch: (isStopwatch) => set({ isStopwatch }),
  setCycleCount: (cycleCount) => set({ cycleCount }),
  setCycleTotal: (cycleTotal) => set({ cycleTotal }),
  setWorkDuration: (workDuration) => set({ workDuration }),
  setPhase: (phase) => set({ phase }),
  setStartedAt: (startedAt) => set({ startedAt }),
  setFinishedAt: (finishedAt) => set({ finishedAt }),
  setCancelledAt: (cancelledAt) => set({ cancelledAt }),
  setReturnGoal: (returnGoalId, returnGoalName) => set({ returnGoalId, returnGoalName }),
  reset: () => set(initialState),
}))
