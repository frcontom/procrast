export type TimerState = 'IDLE' | 'RUNNING' | 'PAUSED' | 'FINISHED' | 'CANCELLED'
export type TimerEvent = 'START' | 'PAUSE' | 'RESUME' | 'CANCEL' | 'FINISH' | 'TICK'

export interface TimerSnapshot {
  state: TimerState
  durationSeconds: number
  remainingSeconds: number
  elapsedSeconds: number
  progressPercent: number
  startedAt: string | null
  finishedAt: string | null
  cancelledAt: string | null
}

export class TimerEngine {
  private _state: TimerState = 'IDLE'
  private durationSeconds = 0
  private remainingSeconds = 0
  private elapsedSeconds = 0
  private _startedAt: string | null = null
  private _finishedAt: string | null = null
  private _cancelledAt: string | null = null
  private targetTime = 0
  private tickTimer: ReturnType<typeof setTimeout> | null = null
  private listeners = new Map<TimerEvent, Set<(...args: any[]) => void>>()

  get state() { return this._state }

  start(durationSeconds: number): TimerSnapshot {
    if (this._state !== 'IDLE' && this._state !== 'FINISHED' && this._state !== 'CANCELLED') {
      return this.getSnapshot()
    }
    this.durationSeconds = durationSeconds
    this.remainingSeconds = durationSeconds
    this.elapsedSeconds = 0
    this.targetTime = performance.now() + durationSeconds * 1000
    this._startedAt = new Date().toISOString()
    this._finishedAt = null
    this._cancelledAt = null
    this._state = 'RUNNING'
    this.emit('START')
    this.startTicking()
    return this.getSnapshot()
  }

  pause(): TimerSnapshot {
    if (this._state !== 'RUNNING') return this.getSnapshot()
    this.stopTicking()
    this._state = 'PAUSED'
    this.emit('PAUSE')
    return this.getSnapshot()
  }

  resume(): TimerSnapshot {
    if (this._state !== 'PAUSED') return this.getSnapshot()
    this.targetTime = performance.now() + this.remainingSeconds * 1000
    this._state = 'RUNNING'
    this.emit('RESUME')
    this.startTicking()
    return this.getSnapshot()
  }

  cancel(): TimerSnapshot {
    if (this._state === 'IDLE' || this._state === 'FINISHED' || this._state === 'CANCELLED') {
      return this.getSnapshot()
    }
    this.stopTicking()
    this._state = 'CANCELLED'
    this._cancelledAt = new Date().toISOString()
    this.emit('CANCEL')
    return this.getSnapshot()
  }

  reset(): void {
    this.stopTicking()
    this._state = 'IDLE'
    this.durationSeconds = 0
    this.remainingSeconds = 0
    this.elapsedSeconds = 0
    this._startedAt = null
    this._finishedAt = null
    this._cancelledAt = null
  }

  getSnapshot(): TimerSnapshot {
    return {
      state: this._state,
      durationSeconds: this.durationSeconds,
      remainingSeconds: this.remainingSeconds,
      elapsedSeconds: this.elapsedSeconds,
      progressPercent: this.durationSeconds > 0
        ? Math.min(100, Math.round((this.elapsedSeconds / this.durationSeconds) * 100))
        : 0,
      startedAt: this._startedAt,
      finishedAt: this._finishedAt,
      cancelledAt: this._cancelledAt,
    }
  }

  on(event: TimerEvent, cb: (...args: any[]) => void): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set())
    this.listeners.get(event)!.add(cb)
    return () => this.listeners.get(event)?.delete(cb)
  }

  private startTicking() {
    this.stopTicking()
    const tick = () => {
      if (this._state !== 'RUNNING') return
      const now = performance.now()
      const remainingMs = Math.max(0, this.targetTime - now)
      this.remainingSeconds = Math.ceil(remainingMs / 1000)
      this.elapsedSeconds = Math.floor((this.durationSeconds * 1000 - remainingMs) / 1000)
      this.emit('TICK')

      if (remainingMs <= 0) {
        this.stopTicking()
        this.remainingSeconds = 0
        this.elapsedSeconds = this.durationSeconds
        this._state = 'FINISHED'
        this._finishedAt = new Date().toISOString()
        this.emit('FINISH')
        return
      }

      const nextMs = (Math.floor(now / 1000) + 1) * 1000
      this.tickTimer = setTimeout(tick, Math.max(50, nextMs - now))
    }
    tick()
  }

  private stopTicking() {
    if (this.tickTimer !== null) {
      clearTimeout(this.tickTimer)
      this.tickTimer = null
    }
  }

  private emit(event: TimerEvent, ...args: any[]) {
    this.listeners.get(event)?.forEach((cb) => cb(...args))
  }
}
