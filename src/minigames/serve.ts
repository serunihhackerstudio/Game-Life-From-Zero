import { clamp01, rng, type Opts, type Sim } from './core'

export const DISHES = ['🍛', '🧋', '🍢']
export const DISH_NAMES = ['Nasi pecel', 'Es teh', 'Gorengan']
export interface Order { table: number; dish: number; patience: number; left: number; state: 'wait' | 'done' | 'angry'; t: number }

/** Antar Pesanan: ambil lauk yang cocok (1-3), pilih meja (kiri/kanan), antar dengan Spasi sebelum pelanggan kesal. */
export class ServeSim implements Sim {
  readonly total: number
  readonly nTables: number
  time: number
  orders: (Order | null)[]
  cursor = 0
  held: number | null = null
  delivered = 0; angry = 0; wrong = 0; tipSum = 0
  done = false
  events: Sim['events'] = []
  private r: () => number
  private nextOrder = 0.5
  constructor(private o: Opts) {
    this.total = Math.round(45 * o.timeMul); this.time = this.total; this.r = rng(o.seed)
    this.nTables = 3 + (o.tier >= 2 ? 1 : 0) + (o.tier >= 3 ? 1 : 0)
    this.orders = Array.from({ length: this.nTables }, () => null)
  }
  get timeLeft() { return Math.max(0, this.time) }
  get progress() { return 1 - this.time / this.total }
  private interval() { return Math.max(1.6, 2.8 - 0.25 * this.o.tier - 0.5 * this.progress) }
  get patience() { return Math.max(5, 10 - 0.5 * this.o.tier) * this.o.tol }

  step(dt: number) {
    if (this.done) return
    this.time -= dt
    this.nextOrder -= dt
    if (this.nextOrder <= 0 && this.time > 5) {
      const free = this.orders.map((o, i) => (o ? -1 : i)).filter((i) => i >= 0)
      if (free.length) {
        const table = free[Math.floor(this.r() * free.length)]
        this.orders[table] = { table, dish: Math.floor(this.r() * 3), patience: this.patience, left: this.patience, state: 'wait', t: 0 }
        this.events.push('info')
      }
      this.nextOrder = this.interval()
    }
    this.orders.forEach((o, i) => {
      if (!o) return
      o.t += dt
      if (o.state === 'wait') { o.left -= dt; if (o.left <= 0) { o.state = 'angry'; o.t = 0; this.angry++; this.events.push('bad') } }
      else if (o.t > 0.7) this.orders[i] = null
    })
    if (this.time <= 0) this.done = true
  }

  key(code: string) {
    if (this.done) return
    const d = /^(?:Digit|Numpad)([1-3])$/.exec(code)
    if (d) { this.held = Number(d[1]) - 1; this.events.push('click'); return }
    if (code === 'ArrowLeft' || code === 'KeyA') { this.cursor = (this.cursor + this.nTables - 1) % this.nTables; this.events.push('click') }
    else if (code === 'ArrowRight' || code === 'KeyD') { this.cursor = (this.cursor + 1) % this.nTables; this.events.push('click') }
    else if (code === 'Space') {
      const o = this.orders[this.cursor]
      if (!o || o.state !== 'wait' || this.held === null || o.dish !== this.held) { this.wrong++; this.events.push('bad'); return }
      o.state = 'done'; o.t = 0; this.delivered++; this.tipSum += o.left / o.patience; this.held = null; this.events.push('coin')
    }
  }
  get perf() { return clamp01(this.delivered / Math.max(1, this.delivered + this.angry) - 0.04 * this.wrong) }
}
