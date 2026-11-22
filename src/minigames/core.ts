// Inti bersama mini-game pekerjaan: logika murni (tanpa DOM) supaya bisa diuji otomatis.

export interface Sim {
  step(dt: number): void
  key(code: string): void
  readonly done: boolean
  /** Performa 0..1 (akurasi/hasil kerja). */
  readonly perf: number
  readonly timeLeft: number
  readonly total: number
  /** Antrean bunyi untuk dimainkan tampilan (dikosongkan oleh Runner). */
  events: ('click' | 'good' | 'bad' | 'coin' | 'info')[]
}

/** Pengaruh level & kondisi tubuh pada kesulitan. */
export interface Opts {
  tier: number      // 0 Beginner .. 3 Expert
  tol: number       // toleransi waktu/ketepatan 0.7..1 (energi/haus rendah menyempitkan)
  timeMul: number   // 0.8..1 (lapar memperpendek sisa waktu)
  seed: number
}

export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/** Performa (0..1) -> pengali upah. Gagal total tetap 50% (tidak menghukum). */
export const wageMult = (perf: number) => 0.5 + 0.9 * clamp01(perf)
export const starsOf = (perf: number) => (perf >= 0.85 ? 3 : perf >= 0.6 ? 2 : 1)
export const AUTO_MULT = 0.7
