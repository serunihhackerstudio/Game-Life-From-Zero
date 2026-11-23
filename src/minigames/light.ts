import { clamp01, rng, type Opts, type Sim } from './core'

export interface Car { lane: number; cycle: number; arrive: number; openAt: number; openDur: number; opens: boolean; sold: boolean; wasted: boolean; soldAt: number; wastedAt: number }

/** Lampu Merah: saat lampu merah mobil berhenti; jual koran ke jendela yang terbuka sebelum lampu hijau. */
export class LightSim implements Sim {
  readonly total: number
  readonly lanes: number
  readonly RED = 5.2
  readonly GREEN = 2.2
  time: number
  cursor = 0
  cars: Car[] = []
  sold = 0; wasted = 0; missed = 0
  shake = 0
  done = false
  events: Sim['events'] = []
  private clock = 0
  private cycle = -1
  private r: () => number
  constructor(private o: Opts) {
    this.total = Math.round(45 * o.timeMul); this.time = this.total; this.r = rng(o.seed)
    this.lanes = 3 + (o.tier >= 2 ? 1 : 0) + (o.tier >= 3 ? 1 : 0)
    this.newCycle()
  }
  get timeLeft() { return Math.max(0, this.time) }
  get now() { return this.clock }
  get cycleNo() { return this.cycle }
  get cycleLen() { return this.RED + this.GREEN }
  get isRed() { return this.clock % this.cycleLen < this.RED }
  get phaseT() { return this.clock % this.cycleLen }

  private newCycle() {
    this.cycle++
    const base = this.cycle * this.cycleLen
    for (let lane = 0; lane < this.lanes; lane++) {
      const arrive = base + 1.0 + this.r() * 0.9
      const opens = this.r() > 0.2
      const openDur = Math.max(0.9, (1.8 - 0.2 * this.o.tier) * this.o.tol)
      const openAt = arrive + 0.5 + this.r() * Math.max(0.1, base + this.RED - openDur - arrive - 0.5)
      this.cars.push({ lane, cycle: this.cycle, arrive, openAt, openDur, opens, sold: false, wasted: false, soldAt: -1, wastedAt: -1 })
    }
  }
  isOpen(c: Car) { return c.opens && this.clock >= c.openAt && this.clock < c.openAt + c.openDur }
  /** Mobil yang sedang ada di lajur (berhenti) pada lampu merah ini. */
  carAt(lane: number): Car | undefined {
    if (!this.isRed) return undefined
    return this.cars.find((c) => c.lane === lane && c.cycle === this.cycle && this.clock >= c.arrive)
  }

  step(dt: number) {
    if (this.done) return
    this.time -= dt; this.clock += dt; this.shake = Math.max(0, this.shake - dt)
    if (Math.floor(this.clock / this.cycleLen) > this.cycle) {
      for (const c of this.cars) if (c.cycle === this.cycle && c.opens && !c.sold) this.missed++
      this.newCycle()
    }
    if (this.time <= 0) {
      for (const c of this.cars) if (c.cycle === this.cycle && c.opens && !c.sold && this.clock >= c.openAt + c.openDur) this.missed++
      this.done = true
    }
  }

  key(code: string) {
    if (this.done) return
    if (code === 'ArrowUp' || code === 'KeyW') this.cursor = (this.cursor + this.lanes - 1) % this.lanes
    else if (code === 'ArrowDown' || code === 'KeyS') this.cursor = (this.cursor + 1) % this.lanes
    if (code === 'ArrowUp' || code === 'KeyW' || code === 'ArrowDown' || code === 'KeyS') this.events.push('click')
    else if (code === 'Space') {
      const c = this.carAt(this.cursor)
      if (!c || c.sold) { this.wasted++; this.shake = 0.25; this.events.push('bad'); return }
      if (this.isOpen(c)) { c.sold = true; c.soldAt = this.clock; this.sold++; this.events.push('coin') } else { c.wasted = true; c.wastedAt = this.clock; this.wasted++; this.shake = 0.25; this.events.push('bad') }
    }
  }

  /** Jumlah peluang (jendela yang memang terbuka) yang sudah lewat atau sedang berlangsung. */
  get opportunities() { return this.sold + this.missed + this.cars.filter((c) => c.cycle === this.cycle && c.opens && !c.sold && this.clock >= c.openAt).length }
  get perf() { return clamp01(this.sold / Math.max(1, this.opportunities) - 0.04 * this.wasted) }
}
