import { clamp01, rng, type Opts, type Sim } from './core'

export interface Pt { x: number; y: number }
export const GRID = 9
export const ROUNDS = 3
const dist = (a: Pt, b: Pt) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
const lenOf = (depot: Pt, stops: Pt[], order: number[]) => { let d = 0, p = depot; for (const i of order) { d += dist(p, stops[i]); p = stops[i] } return d }
function permutations(n: number): number[][] {
  const res: number[][] = []
  const rec = (a: number[], rest: number[]) => { if (!rest.length) { res.push(a); return } rest.forEach((v, i) => rec([...a, v], rest.filter((_, j) => j !== i))) }
  rec([], Array.from({ length: n }, (_, i) => i)); return res
}

/** Rute Kilat: susun urutan antar tersingkat (tekan nomor alamat), lalu serahkan paket tepat waktu (Spasi). */
export class RouteSim implements Sim {
  readonly total: number
  readonly depot: Pt = { x: 4, y: 4 }
  time: number
  round = 0
  phase: 'plan' | 'drive' | 'between' = 'plan'
  stops: Pt[] = []
  chosen: number[] = []
  optimalOrder: number[] = []
  optimalLen = 0
  planLeft = 0
  pts: Pt[] = []; cum: number[] = []; stopCum: number[] = []
  driveDist = 0
  nextStop = 0
  atStop = false
  stopLeft = 0
  handoverOk = 0; wrong = 0
  routeScore = 0
  roundScores: number[] = []
  betweenT = 0
  lastHandover: boolean | null = null
  done = false
  events: Sim['events'] = []
  readonly speed = 7
  private r: () => number
  constructor(private o: Opts) {
    this.total = Math.round(58 * o.timeMul); this.time = this.total; this.r = rng(o.seed)
    this.newRound()
  }
  get timeLeft() { return Math.max(0, this.time) }
  get n() { return this.stops.length }
  get planLimit() { return 15 * this.o.tol }
  get window() { return 1.3 * this.o.tol }
  get pos(): Pt {
    if (this.cum.length < 2) return this.depot
    const d = Math.min(this.driveDist, this.cum[this.cum.length - 1])
    for (let i = 1; i < this.cum.length; i++) if (d <= this.cum[i]) { const f = (d - this.cum[i - 1]) / Math.max(1e-9, this.cum[i] - this.cum[i - 1]); return { x: this.pts[i - 1].x + (this.pts[i].x - this.pts[i - 1].x) * f, y: this.pts[i - 1].y + (this.pts[i].y - this.pts[i - 1].y) * f } }
    return this.pts[this.pts.length - 1]
  }

  private newRound() {
    const n = 4 + (this.o.tier >= 2 ? 1 : 0) + (this.o.tier >= 3 ? 1 : 0)
    const used = new Set([`${this.depot.x},${this.depot.y}`]); const stops: Pt[] = []
    while (stops.length < n) { const p = { x: Math.floor(this.r() * GRID), y: Math.floor(this.r() * GRID) }; const k = `${p.x},${p.y}`; if (!used.has(k)) { used.add(k); stops.push(p) } }
    this.stops = stops; this.chosen = []; this.phase = 'plan'; this.planLeft = this.planLimit
    let best = Infinity, bo: number[] = []
    for (const p of permutations(n)) { const l = lenOf(this.depot, stops, p); if (l < best) { best = l; bo = p } }
    this.optimalLen = best; this.optimalOrder = bo; this.lastHandover = null
    this.atStop = false; this.nextStop = 0; this.driveDist = 0; this.handoverOk = 0
  }
  private startDrive() {
    const order = this.chosen
    const L = lenOf(this.depot, this.stops, order)
    this.routeScore = clamp01(1 - (L - this.optimalLen) / (0.8 * this.optimalLen))
    const pts: Pt[] = [this.depot]; const stopIdx: number[] = []; let p = this.depot
    for (const i of order) { const s = this.stops[i]; if (s.x !== p.x && s.y !== p.y) pts.push({ x: s.x, y: p.y }); pts.push(s); stopIdx.push(pts.length - 1); p = s }
    const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + dist(pts[i - 1], pts[i]))
    this.pts = pts; this.cum = cum; this.stopCum = stopIdx.map((i) => cum[i])
    this.phase = 'drive'; this.driveDist = 0; this.nextStop = 0; this.atStop = false; this.handoverOk = 0
  }
  private finishRound() {
    const h = this.handoverOk / this.n
    this.roundScores.push(0.7 * this.routeScore + 0.3 * h)
    this.round++; this.phase = 'between'; this.betweenT = 0.9
    if (this.round >= ROUNDS) this.done = true
  }
  private advance() { this.nextStop++; this.atStop = false; if (this.nextStop >= this.n) this.finishRound() }

  step(dt: number) {
    if (this.done) return
    this.time -= dt
    if (this.phase === 'plan') {
      this.planLeft -= dt
      if (this.planLeft <= 0) { for (let i = 0; i < this.n; i++) if (!this.chosen.includes(i)) this.chosen.push(i); this.startDrive(); this.events.push('bad') }
    } else if (this.phase === 'drive') {
      if (!this.atStop) {
        this.driveDist += this.speed * dt
        if (this.driveDist >= this.stopCum[this.nextStop]) { this.driveDist = this.stopCum[this.nextStop]; this.atStop = true; this.stopLeft = this.window; this.events.push('info') }
      } else { this.stopLeft -= dt; if (this.stopLeft <= 0) { this.lastHandover = false; this.events.push('bad'); this.advance() } }
    } else { this.betweenT -= dt; if (this.betweenT <= 0 && !this.done) this.newRound() }
    if (this.time <= 0) this.done = true
  }

  key(code: string) {
    if (this.done) return
    if (this.phase === 'plan') {
      const m = /^(?:Digit|Numpad)([1-9])$/.exec(code)
      if (m) { const i = Number(m[1]) - 1; if (i < this.n && !this.chosen.includes(i)) { this.chosen.push(i); this.events.push('click'); if (this.chosen.length === this.n) this.startDrive() } }
      else if (code === 'Backspace') { this.chosen.pop(); this.events.push('click') }
    } else if (this.phase === 'drive' && code === 'Space') {
      if (this.atStop) { this.handoverOk++; this.lastHandover = true; this.events.push('coin'); this.advance() }
      else { this.wrong++; this.events.push('bad') }
    }
  }

  get perf() {
    const sum = this.roundScores.reduce((a, b) => a + b, 0)
    return clamp01(sum / ROUNDS - 0.02 * this.wrong)
  }
}
