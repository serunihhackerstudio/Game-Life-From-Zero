import { clamp01, rng, type Opts, type Sim } from './core'

export const INGREDIENTS = ['🍚', '🥚', '🧅', '🌶️', '🍶'] as const
export const ING_NAMES = ['Nasi', 'Telur', 'Bawang', 'Cabai', 'Kecap']
export type Phase = 'add' | 'stir' | 'flip' | 'serve'
const ING_KEYS: Record<string, number> = { Digit1: 0, Numpad1: 0, Digit2: 1, Numpad2: 1, Digit3: 2, Numpad3: 2, Digit4: 3, Numpad4: 3, Digit5: 4, Numpad5: 4 }

/** Wajan Panas: masukkan bahan sesuai urutan, aduk bergantian A/D, lalu balik wajan tepat waktu. */
export class WokSim implements Sim {
  static readonly PLATES = 4
  readonly total: number
  time: number
  plate = 0
  phase: Phase = 'add'
  recipe: number[] = []
  step_ = 0              // indeks bahan berikutnya
  mistakes = 0
  stirCount = 0; stirNeed = 9; stirT = 0; lastStir = ''
  stirLimit: number
  flipT = 0; flipQ = 0; flipFlash = 0
  plateScores: number[] = []
  last: { add: number; stir: number; flip: number } | null = null
  serveT = 0
  shake = 0
  done = false
  events: Sim['events'] = []
  private r: () => number
  constructor(private o: Opts) {
    this.total = Math.round(52 * o.timeMul); this.time = this.total; this.r = rng(o.seed)
    this.stirLimit = 4.2 * o.tol + 0.4
    this.newPlate()
  }
  get timeLeft() { return Math.max(0, this.time) }
  get zone() { return Math.max(0.12, 0.24 * this.o.tol - 0.02 * this.o.tier) }
  get flipFreq() { return 0.55 + 0.1 * this.o.tier }
  /** Posisi penanda 0..1 (bolak-balik). */
  get marker() { return 0.5 + 0.5 * Math.sin(this.flipT * Math.PI * 2 * this.flipFreq) }

  private newPlate() {
    const len = 3 + (this.o.tier >= 2 ? 1 : 0) + (this.o.tier >= 3 ? 1 : 0)
    this.recipe = Array.from({ length: len }, () => Math.floor(this.r() * INGREDIENTS.length))
    this.step_ = 0; this.mistakes = 0; this.phase = 'add'
    this.stirCount = 0; this.stirT = 0; this.lastStir = ''; this.flipT = 0; this.flipQ = 0
  }
  private finishPlate(flipQ: number) {
    const add = clamp01(1 - this.mistakes / this.recipe.length)
    const stir = clamp01(this.stirCount / this.stirNeed)
    this.last = { add, stir, flip: flipQ }
    this.plateScores.push(0.4 * add + 0.3 * stir + 0.3 * flipQ)
    this.phase = 'serve'; this.serveT = 0.9
  }

  step(dt: number) {
    if (this.done) return
    this.time -= dt; this.shake = Math.max(0, this.shake - dt); this.flipFlash = Math.max(0, this.flipFlash - dt)
    if (this.phase === 'stir') { this.stirT += dt; if (this.stirT >= this.stirLimit) { this.phase = 'flip'; this.flipT = 0 } }
    else if (this.phase === 'flip') { this.flipT += dt; if (this.flipT > 4.5) this.finishPlate(0.15) }
    else if (this.phase === 'serve') {
      this.serveT -= dt
      if (this.serveT <= 0) { if (this.plateScores.length >= WokSim.PLATES) this.done = true; else this.newPlate() }
    }
    if (this.time <= 0) { this.done = true }
  }

  key(code: string) {
    if (this.done) return
    if (this.phase === 'add') {
      const i = ING_KEYS[code]
      if (i === undefined) return
      if (i === this.recipe[this.step_]) { this.events.push('click'); this.step_++; if (this.step_ >= this.recipe.length) { this.phase = 'stir'; this.stirT = 0 } }
      else { this.mistakes++; this.shake = 0.25; this.events.push('bad') }
    } else if (this.phase === 'stir') {
      const k = code === 'KeyA' || code === 'ArrowLeft' ? 'A' : code === 'KeyD' || code === 'ArrowRight' ? 'D' : ''
      if (k && k !== this.lastStir) { this.lastStir = k; this.events.push('click'); this.stirCount++; if (this.stirCount >= this.stirNeed) { this.phase = 'flip'; this.flipT = 0 } }
    } else if (this.phase === 'flip' && code === 'Space') {
      const d = Math.abs(this.marker - 0.5)
      this.flipFlash = 0.35
      this.events.push(d <= this.zone / 2 ? 'good' : 'info')
      this.finishPlate(d <= this.zone / 2 ? 1 : clamp01(1 - (d - this.zone / 2) / 0.3) * 0.6)
    }
  }

  get perf() {
    const sum = this.plateScores.reduce((a, b) => a + b, 0)
    return clamp01(sum / WokSim.PLATES)
  }
}
