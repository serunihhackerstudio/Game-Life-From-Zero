import { clamp01, rng, type Opts, type Sim } from './core'

export interface Row { id: number; y: number; lanes: number[]; kinds: ('hole' | 'bike' | 'car')[]; hit: boolean }
export const RIDE = { PY: 270, BAND: 26, LOOK: 170 }

/** Antar Penumpang: pindah lajur (← →) menghindari lubang dan motor lain; kenyamanan penumpang menentukan tip. */
export class RideSim implements Sim {
  readonly total: number
  readonly lanes = 3
  time: number
  lane = 1
  rows: Row[] = []
  comfort = 100
  invul = 0
  hits = 0
  dist = 0
  done = false
  events: Sim['events'] = []
  private r: () => number
  private since = 0; private nextGap = 120
  private rid = 0
  constructor(private o: Opts) { this.total = Math.round(45 * o.timeMul); this.time = this.total; this.r = rng(o.seed) }
  get timeLeft() { return Math.max(0, this.time) }
  get progress() { return 1 - this.time / this.total }
  get speed() { return (230 + 25 * this.o.tier + 80 * this.progress) * (1 + (1 - this.o.tol) * 0.5) }
  private gap() { return Math.max(150, 235 - 10 * this.o.tier - 40 * this.progress) + this.r() * 50 }

  step(dt: number) {
    if (this.done) return
    this.time -= dt; this.invul = Math.max(0, this.invul - dt)
    const mv = this.speed * dt
    this.dist += mv; this.since += mv
    if (this.since >= this.nextGap && this.time > 2) {
      const two = this.o.tier > 0 && this.r() < 0.3 + 0.1 * this.o.tier
      const first = Math.floor(this.r() * 3)
      const lanes = two ? [first, (first + 1 + Math.floor(this.r() * 2)) % 3] : [first]
      this.rows.push({ id: this.rid++, y: -40, lanes, kinds: lanes.map(() => { const v = this.r(); return v < 0.42 ? 'hole' : v < 0.74 ? 'bike' : 'car' }), hit: false })
      this.since = 0; this.nextGap = this.gap()
    }
    for (const row of this.rows) {
      row.y += mv
      if (!row.hit && this.invul <= 0 && Math.abs(row.y - RIDE.PY) < RIDE.BAND && row.lanes.includes(this.lane)) {
        row.hit = true; this.hits++; this.comfort = Math.max(0, this.comfort - 20); this.invul = 1.0; this.events.push('bad')
      }
    }
    this.rows = this.rows.filter((r) => r.y < 420)
    if (this.time <= 0) this.done = true
  }
  key(code: string) {
    if (this.done) return
    if (code === 'ArrowLeft' || code === 'KeyA') { if (this.lane > 0) { this.lane--; this.events.push('click') } }
    else if (code === 'ArrowRight' || code === 'KeyD') { if (this.lane < this.lanes - 1) { this.lane++; this.events.push('click') } }
  }
  get perf() { return clamp01(this.comfort / 100) }
}
