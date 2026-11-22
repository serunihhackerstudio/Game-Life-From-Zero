import { describe, expect, it } from 'vitest'
import { AUTO_MULT, starsOf, wageMult, type Opts } from './core'
import { SortSim } from './sort'
import { LightSim } from './light'
import { WokSim } from './wok'

const base: Opts = { tier: 0, tol: 1, timeMul: 1, seed: 7 }
const run = (sim: { done: boolean; step(dt: number): void }, bot?: () => void, dt = 1 / 30) => { let n = 0; while (!sim.done && n++ < 60 * 30) { bot?.(); sim.step(dt) } }

describe('upah', () => {
  it('gagal total tetap 50%, sempurna 140%, auto 70%', () => {
    expect(wageMult(0)).toBeCloseTo(0.5); expect(wageMult(1)).toBeCloseTo(1.4); expect(AUTO_MULT).toBe(0.7)
    expect(wageMult(-3)).toBeCloseTo(0.5); expect(wageMult(9)).toBeCloseTo(1.4)
  })
  it('bintang 1..3', () => { expect(starsOf(0)).toBe(1); expect(starsOf(0.7)).toBe(2); expect(starsOf(0.95)).toBe(3) })
})

describe('Sortir Peti', () => {
  it('berhenti sendiri dan diam = performa rendah', () => { const s = new SortSim(base); run(s); expect(s.done).toBe(true); expect(s.perf).toBeLessThan(0.1) })
  it('pemain sempurna (bot) mendapat >= 0.9 di semua tier', () => {
    for (let tier = 0; tier < 4; tier++) {
      const s = new SortSim({ ...base, tier })
      let t = 0
      run(s, () => { t++; if (t % 6 === 0) { const f = s.boxes.filter((b) => b.state === 'belt').sort((a, b) => b.x - a.x)[0]; if (f) s.key(['Digit1', 'Digit2', 'Digit3'][f.color]) } })
      expect(s.perf, `tier ${tier}`).toBeGreaterThanOrEqual(0.9)
    }
  })
  it('tombol salah menurunkan performa dan memutus kombo', () => {
    const s = new SortSim(base); s.step(0.6); s.step(1)
    const f = s.boxes[0]; s.key(['Digit1', 'Digit2', 'Digit3'][(f.color + 1) % 3])
    expect(s.wrong).toBe(1); expect(s.combo).toBe(0)
  })
  it('peti berat butuh dua tekanan (tier 2+)', () => {
    let found = false
    for (let seed = 1; seed < 40 && !found; seed++) {
      const s = new SortSim({ ...base, tier: 3, seed })
      for (let i = 0; i < 1500 && !found; i++) {
        s.step(1 / 30)
        const front = s.boxes.filter((b) => b.state === 'belt').sort((a, b) => b.x - a.x)[0]
        if (front && front.heavy) {
          const k = ['Digit1', 'Digit2', 'Digit3'][front.color]
          s.key(k); expect(front.state).toBe('belt'); expect(front.hp).toBe(1)
          s.key(k); expect(front.state).toBe('sorted'); found = true
        }
      }
    }
    expect(found).toBe(true)
  })
  it('deterministik untuk seed yang sama', () => { const a = new SortSim(base), b = new SortSim(base); run(a); run(b); expect(a.spawned).toBe(b.spawned) })
  it('energi rendah (tol kecil) membuat ban lebih cepat', () => {
    const a = new SortSim(base), b = new SortSim({ ...base, tol: 0.7 }); a.step(0.6); b.step(0.6); a.step(1); b.step(1)
    expect(b.boxes[0].x).toBeGreaterThan(a.boxes[0].x)
  })
})

describe('Lampu Merah', () => {
  it('diam = performa rendah', () => { const s = new LightSim(base); run(s); expect(s.perf).toBeLessThan(0.1) })
  it('bot yang menjual ke jendela terbuka mendapat >= 0.9', () => {
    const s = new LightSim(base)
    run(s, () => { for (let l = 0; l < s.lanes; l++) { const c = s.carAt(l); if (c && !c.sold && s.isOpen(c)) { while (s.cursor !== l) s.key('ArrowDown'); s.key('Space') } } })
    expect(s.perf).toBeGreaterThanOrEqual(0.9); expect(s.sold).toBeGreaterThan(3)
  })
  it('jual ke jendela tertutup dihitung sia-sia', () => {
    const s = new LightSim({ ...base, seed: 11 }); let tested = false
    for (let i = 0; i < 400 && !tested; i++) {
      s.step(0.05)
      for (let l = 0; l < s.lanes && !tested; l++) {
        const c = s.carAt(l)
        if (c && !s.isOpen(c) && !c.sold) { const w = s.wasted; s.cursor = l; s.key('Space'); expect(s.wasted).toBe(w + 1); expect(c.sold).toBe(false); tested = true }
      }
    }
    expect(tested).toBe(true)
  })
  it('lajur bertambah menurut tier', () => { expect(new LightSim({ ...base, tier: 0 }).lanes).toBe(3); expect(new LightSim({ ...base, tier: 3 }).lanes).toBe(5) })
  it('kursor berputar di antara lajur', () => { const s = new LightSim(base); s.key('ArrowUp'); expect(s.cursor).toBe(s.lanes - 1); s.key('ArrowDown'); expect(s.cursor).toBe(0) })
})

describe('Wajan Panas', () => {
  const bot = (s: WokSim) => () => {
    if (s.phase === 'add') s.key('Digit' + (s.recipe[s.step_] + 1))
    else if (s.phase === 'stir') s.key(s.lastStir === 'A' ? 'KeyD' : 'KeyA')
    else if (s.phase === 'flip' && Math.abs(s.marker - 0.5) < 0.02) s.key('Space')
  }
  it('diam = performa rendah dan permainan tetap selesai', () => { const s = new WokSim(base); run(s); expect(s.done).toBe(true); expect(s.perf).toBeLessThan(0.3) })
  it('bot sempurna mendapat >= 0.9 di semua tier', () => {
    for (let tier = 0; tier < 4; tier++) { const s = new WokSim({ ...base, tier }); run(s, bot(s), 1 / 60); expect(s.perf, `tier ${tier}`).toBeGreaterThanOrEqual(0.9) }
  })
  it('bahan salah mengurangi nilai bahan', () => {
    const s = new WokSim(base); s.key('Digit' + (((s.recipe[0] + 1) % 5) + 1)); expect(s.mistakes).toBe(1); expect(s.step_).toBe(0)
  })
  it('mengaduk harus bergantian A/D', () => {
    const s = new WokSim(base); s.recipe.forEach((i) => s.key('Digit' + (i + 1))); expect(s.phase).toBe('stir')
    s.key('KeyA'); s.key('KeyA'); s.key('KeyA'); expect(s.stirCount).toBe(1); s.key('KeyD'); expect(s.stirCount).toBe(2)
  })
  it('resep memanjang menurut tier', () => { expect(new WokSim({ ...base, tier: 0 }).recipe.length).toBe(3); expect(new WokSim({ ...base, tier: 3 }).recipe.length).toBe(5) })
  it('zona membalik menyempit saat energi rendah', () => { expect(new WokSim({ ...base, tol: 0.7 }).zone).toBeLessThan(new WokSim(base).zone) })
})
