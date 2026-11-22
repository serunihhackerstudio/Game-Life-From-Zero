import { clamp01, rng, type Opts, type Sim } from './core'

export interface Box { id: number; x: number; color: 0 | 1 | 2; hp: number; heavy: boolean; state: 'belt' | 'sorted' | 'lost'; t: number }
const KEYS: Record<string, 0 | 1 | 2> = { Digit1: 0, Numpad1: 0, ArrowLeft: 0, Digit2: 1, Numpad2: 1, ArrowDown: 1, Digit3: 2, Numpad3: 2, ArrowRight: 2 }

/** Sortir Peti: peti berwarna lewat di ban berjalan, kirim ke palet warna yang sama. */
export class SortSim implements Sim {
  static readonly LENGTH = 560
  readonly total: number
  time: number
  boxes: Box[] = []
  spawned = 0; correct = 0; wrong = 0; lost = 0; combo = 0; best = 0
  flash: { color: number; ok: boolean; t: number } | null = null
  done = false
  events: Sim['events'] = []
  private r: () => number
  private nextSpawn = 0.5
  private id = 0
  constructor(private o: Opts) { this.total = Math.round(45 * o.timeMul); this.time = this.total; this.r = rng(o.seed) }

  get timeLeft() { return Math.max(0, this.time) }
  get progress() { return 1 - this.time / this.total }
  private speed() { return (105 + 16 * this.o.tier + this.progress * 50) * (1 + (1 - this.o.tol) * 0.6) }
  private interval() { return Math.max(0.55, 1.5 - 0.1 * this.o.tier - 0.55 * this.progress) }

  step(dt: number) {
    if (this.done) return
    this.time -= dt
    if (this.flash) { this.flash.t -= dt; if (this.flash.t <= 0) this.flash = null }
    this.nextSpawn -= dt
    if (this.nextSpawn <= 0 && this.time > 3) {
      const heavy = this.o.tier >= 2 && this.r() < 0.18 + 0.05 * (this.o.tier - 2)
      this.boxes.push({ id: this.id++, x: 0, color: Math.floor(this.r() * 3) as 0 | 1 | 2, hp: heavy ? 2 : 1, heavy, state: 'belt', t: 0 })
      this.spawned++
      this.nextSpawn = this.interval()
    }
    const v = this.speed()
    for (const b of this.boxes) {
      b.t += dt
      if (b.state !== 'belt') continue
      b.x += v * dt
      if (b.x >= SortSim.LENGTH) { b.state = 'lost'; b.t = 0; this.lost++; this.combo = 0; this.events.push('bad') }
    }
    this.boxes = this.boxes.filter((b) => b.state === 'belt' || b.t < 0.5)
    if (this.time <= 0) { this.done = true; this.lost += this.boxes.filter((b) => b.state === 'belt').length }
  }

  key(code: string) {
    if (this.done) return
    const c = KEYS[code]
    if (c === undefined) return
    let front: Box | null = null
    for (const b of this.boxes) if (b.state === 'belt' && (!front || b.x > front.x)) front = b
    if (!front) return
    if (front.color === c) {
      if (front.hp > 1) { front.hp--; this.flash = { color: c, ok: true, t: 0.15 }; this.events.push('click'); return }
      front.state = 'sorted'; front.t = 0; this.correct++; this.combo++; this.best = Math.max(this.best, this.combo)
      this.flash = { color: c, ok: true, t: 0.2 }; this.events.push('good')
    } else { this.wrong++; this.combo = 0; this.flash = { color: c, ok: false, t: 0.25 }; this.events.push('bad') }
  }

  get perf() { return clamp01(this.correct / Math.max(1, this.spawned) - 0.03 * this.wrong) }
}
