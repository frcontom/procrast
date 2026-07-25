import { create } from 'zustand'
import type { Session } from '../supabase/types'

interface SessionStore {
  currentSession: Session | null
  history: Session[]
  setCurrentSession: (session: Session | null) => void
  setHistory: (sessions: Session[]) => void
  addToHistory: (session: Session) => void
}

export const useSessionStore = create<SessionStore>((set) => ({
  currentSession: null,
  history: [],
  setCurrentSession: (currentSession) => set({ currentSession }),
  setHistory: (history) => set({ history }),
  addToHistory: (session) => set((state) => ({ history: [session, ...state.history] })),
}))
