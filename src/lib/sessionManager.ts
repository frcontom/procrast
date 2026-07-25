import { supabase } from '../supabase/client'
import { TimerEngine } from './timerEngine'
import { useTimerStore } from '../store/useTimerStore'

const XP = {
  SESSION_COMPLETED: 50,
  SESSION_CANCELLED: 5,
  STREAK_BONUS: 20,
  MINUTE_BONUS: 1,
}

export class SessionManager {
  private engine = new TimerEngine()
  private currentUserId: string | null = null

  setUser(userId: string) {
    this.currentUserId = userId
  }

  getEngine() { return this.engine }

  async startSession(durationMinutes: number, activityType: string, sessionName: string, strictMode: boolean, lockdownMode: boolean) {
    const store = useTimerStore.getState()
    const isStopwatch = durationMinutes >= 480

    const durationSeconds = durationMinutes * 60
    this.engine.start(durationSeconds)
    const snapshot = this.engine.getSnapshot()

    store.setState('RUNNING')
    store.setDuration(durationMinutes)
    store.setElapsed(snapshot.elapsedSeconds)
    store.setRemaining(snapshot.remainingSeconds)
    store.setProgress(snapshot.progressPercent)
    store.setStartedAt(snapshot.startedAt)
    store.setActivityType(activityType)
    store.setSessionName(sessionName)
    store.setStrictMode(strictMode)
    store.setLockdownMode(lockdownMode)
    store.setIsStopwatch(isStopwatch)
  }

  pause() {
    const store = useTimerStore.getState()
    if (store.state !== 'RUNNING') return
    this.engine.pause()
    const snapshot = this.engine.getSnapshot()
    store.setState('PAUSED')
    store.setRemaining(snapshot.remainingSeconds)
    store.setElapsed(snapshot.elapsedSeconds)
    store.setProgress(snapshot.progressPercent)
  }

  resume() {
    const store = useTimerStore.getState()
    if (store.state !== 'PAUSED') return
    this.engine.resume()
    const snapshot = this.engine.getSnapshot()
    store.setState('RUNNING')
    store.setRemaining(snapshot.remainingSeconds)
    store.setElapsed(snapshot.elapsedSeconds)
    store.setProgress(snapshot.progressPercent)
  }

  async cancel(reason?: string) {
    const store = useTimerStore.getState()
    if (store.state === 'IDLE' || store.state === 'FINISHED' || store.state === 'CANCELLED') return
    if (store.strictMode) return

    this.engine.cancel()
    const s = this.engine.getSnapshot()
    store.setState('CANCELLED')
    store.setCancelledAt(s.cancelledAt)
    store.setRemaining(s.remainingSeconds)
    store.setElapsed(s.elapsedSeconds)

    if (this.currentUserId) {
      await supabase.from('sessions').insert({
        user_id: this.currentUserId,
        activity_type: store.activityType,
        session_name: store.sessionName,
        duration_minutes: store.durationMinutes,
        elapsed_seconds: s.elapsedSeconds,
        state: 'cancelled',
        finished_at: new Date().toISOString(),
        interruption_reason: reason || null,
      })
      await this.addXp(XP.SESSION_CANCELLED)
    }
  }

  async finish() {
    const store = useTimerStore.getState()
    this.engine.reset()
    store.setState('FINISHED')
    store.setFinishedAt(new Date().toISOString())
    store.setRemaining(0)
    store.setElapsed(store.durationMinutes * 60)
    store.setProgress(100)

    if (this.currentUserId) {
      await supabase.from('sessions').insert({
        user_id: this.currentUserId,
        activity_type: store.activityType,
        session_name: store.sessionName,
        duration_minutes: store.durationMinutes,
        elapsed_seconds: store.durationMinutes * 60,
        state: 'completed',
        finished_at: new Date().toISOString(),
      })

      const xpGained = XP.SESSION_COMPLETED + Math.round(store.durationMinutes * XP.MINUTE_BONUS)
      await this.addXp(xpGained)
    }
  }

  private async addXp(xpAmount: number) {
    if (!this.currentUserId) return
    try { await supabase.rpc('add_xp', { p_xp: xpAmount }) } catch {}
  }

  reset() {
    this.engine.reset()
    useTimerStore.getState().reset()
  }
}

export const sessionManager = new SessionManager()
