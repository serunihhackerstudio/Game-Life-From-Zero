import { clamp01, rng, type Opts, type Sim } from './core'

export interface Motor { id: number; hue: number; stay: number; t: number; state: 'parked' | 'ready'; readyLeft: number }
export interface Waiting { id: number; hue: number; patience: number; left: number }

/** Atur Parkir: parkirkan motor yang antre ke slot kosong, lalu ambil uang saat mereka siap pergi. */
export class ParkSim implements Sim {
  readonly total: number
  readonly nSlots: number
  readonly QUEUE_MAX = 4
  time: number
  slots: (Motor | null)[]
  queue: Waiting[] = []
  cursor = 0
  collected = 0; angry = 0; lostFull = 0; missed = 0; wrong = 0
  done = false
  events: Sim['events'] = []
  private r: () => number
  private nextArrive = 0.4
  private id = 0
  constructor(private o: Opts) {
    this.total = Math.round(45 * o.timeMul); this.time = this.total; this.r = rng(o.seed)
    this.nSlots = 4 + (o.tier >= 2 ? 1 : 0)
    this.slots = Array.from({ length: this.nSlots }, () => null)
  }
  get timeLeft() { return Math.max(0, this.time) }
  get progress() { return 1 - this.time / this.total }
  private interval() { return Math.max(1.5, 2.6 - 0.28 * this.o.tier - 0.4 * this.progress) }
  get patience() { return 8 * this.o.tol }
  get readyWindow() { return 2.4 * this.o.tol }

  step(dt: number) {
    if (this.done) return
    this.time -= dt
    this.nextArrive -= dt
    if (this.nextArrive <= 0 && this.time > 4) {
      if (this.queue.length >= this.QUEUE_MAX) { this.lostFull++; this.events.push('bad') }
      else this.queue.push({ id: this.id++, hue: Math.floor(this.r() * 6), patience: this.patience, left: this.patience })
      this.nextArrive = this.interval()
    }
    for (const w of this.queue) w.left -= dt
    const gone = this.queue.filter((w) => w.left <= 0)
    if (gone.length) { this.angry += gone.length; this.queue = this.queue.filter((w) => w.left > 0); this.events.push('bad') }
    this.slots.forEach((m, i) => {
      if (!m) return
      if (m.state === 'parked') { m.t += dt; if (m.t >= m.stay) { m.state = 'ready'; m.readyLeft = this.readyWindow } }
      else { m.readyLeft -= dt; if (m.readyLeft <= 0) { this.missed++; this.slots[i] = null; this.events.push('bad') } }
    })
    if (this.time <= 0) this.done = true
  }

  key(code: string) {
    if (this.done) return
    if (code === 'ArrowLeft' || code === 'KeyA') { this.cursor = (this.cursor + this.nSlots - 1) % this.nSlots; this.events.push('click') }
    else if (code === 'ArrowRight' || code === 'KeyD') { this.cursor = (this.cursor + 1) % this.nSlots; this.events.push('click') }
    else if (code === 'Space') {
      const m = this.slots[this.cursor]
      if (!m) {
        const w = this.queue.shift()
        if (!w) { this.wrong++; this.events.push('bad'); return }
        this.slots[this.cursor] = { id: w.id, hue: w.hue, stay: 3 + this.r() * 2, t: 0, state: 'parked', readyLeft: 0 }
        this.events.push('click')
      } else if (m.state === 'ready') { this.collected++; this.slots[this.cursor] = null; this.events.push('coin') }
      else { this.wrong++; this.events.push('bad') }
    }
  }
  get resolved() { return this.collected + this.angry + this.lostFull + this.missed }
  get perf() { return clamp01(this.collected / Math.max(1, this.resolved) - 0.03 * this.wrong) }
}
