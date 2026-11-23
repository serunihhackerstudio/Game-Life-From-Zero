import { describe, expect, it } from 'vitest'
import type { Opts } from './core'
import { ParkSim } from './park'
import { ServeSim } from './serve'
import { RouteSim, ROUNDS } from './route'
import { RideSim } from './ride'

const base: Opts = { tier: 0, tol: 1, timeMul: 1, seed: 5 }
const TIERS = [0, 1, 2, 3]
const run = (sim: { done: boolean; step(dt: number): void }, bot?: () => void, dt = 1 / 30) => { let n = 0; while (!sim.done && n++ < 90 * 30) { bot?.(); sim.step(dt) } }

describe('Atur Parkir', () => {
  const goto = (s: ParkSim, i: number) => { let n = 0; while (s.cursor !== i && n++ < 9) s.key('ArrowRight') }
  const bot = (s: ParkSim) => () => {
    const ready = s.slots.findIndex((m) => m && m.state === 'ready')
    if (ready >= 0) { goto(s, ready); s.key('Space'); return }
    const empty = s.slots.findIndex((m) => !m)
    if (empty >= 0 && s.queue.length) { goto(s, empty); s.key('Space') }
  }
  it('diam = performa rendah', () => { const s = new ParkSim(base); run(s); expect(s.done).toBe(true); expect(s.perf).toBeLessThan(0.1) })
  it('bot sempurna >= 0.9 di semua tier, dengan mobil yang cukup banyak', () => {
    for (const tier of TIERS) for (const seed of [1, 2, 3]) { const s = new ParkSim({ ...base, tier, seed }); run(s, bot(s)); expect(s.perf, `tier ${tier} seed ${seed}`).toBeGreaterThanOrEqual(0.9); expect(s.collected).toBeGreaterThan(8) }
  })
  it('parkir ke slot terisi atau tanpa antrean dihitung salah', () => {
    const s = new ParkSim(base); s.key('Space'); expect(s.wrong).toBe(1)
    s.step(0.5); s.step(0.5); expect(s.queue.length).toBe(1); s.key('Space'); expect(s.slots[0]).not.toBeNull()
    s.step(0.1); s.key('Space'); expect(s.wrong).toBe(2) // slot terisi belum siap
  })
  it('motor yang tidak diambil uangnya pergi (terlewat)', () => {
    const s = new ParkSim(base); s.step(0.5); s.step(0.5); s.key('Space')
    for (let i = 0; i < 30 * 12; i++) s.step(1 / 30)
    expect(s.missed).toBeGreaterThanOrEqual(1)
  })
  it('slot bertambah menurut tier dan antrean marah saat sabar habis', () => {
    expect(new ParkSim({ ...base, tier: 2 }).nSlots).toBe(5)
    const s = new ParkSim(base); s.step(0.5); s.step(0.5); for (let i = 0; i < 30 * 10; i++) s.step(1 / 30); expect(s.angry).toBeGreaterThanOrEqual(1)
  })
})

describe('Antar Pesanan', () => {
  const bot = (s: ServeSim) => () => {
    const w = s.orders.filter((o) => o && o.state === 'wait').sort((a, b) => a!.left - b!.left)[0]
    if (!w) return
    s.key('Digit' + (w.dish + 1)); let n = 0; while (s.cursor !== w.table && n++ < 9) s.key('ArrowRight'); s.key('Space')
  }
  it('diam = performa rendah', () => { const s = new ServeSim(base); run(s); expect(s.perf).toBeLessThan(0.1) })
  it('bot sempurna >= 0.9 di semua tier', () => {
    for (const tier of TIERS) for (const seed of [1, 2, 3]) { const s = new ServeSim({ ...base, tier, seed }); run(s, bot(s)); expect(s.perf, `tier ${tier}`).toBeGreaterThanOrEqual(0.9); expect(s.delivered).toBeGreaterThan(8) }
  })
  it('lauk salah atau meja kosong dihitung salah dan tidak mengantar', () => {
    const s = new ServeSim(base); s.step(0.6); const o = s.orders.find(Boolean)!
    s.key('Space'); expect(s.wrong).toBe(1)
    while (s.cursor !== o.table) s.key('ArrowRight')
    s.key('Digit' + (((o.dish + 1) % 3) + 1)); s.key('Space'); expect(s.wrong).toBe(2); expect(o.state).toBe('wait')
    s.key('Digit' + (o.dish + 1)); s.key('Space'); expect(o.state).toBe('done'); expect(s.delivered).toBe(1); expect(s.held).toBeNull()
  })
  it('pelanggan kesal saat sabar habis', () => { const s = new ServeSim(base); s.step(0.6); for (let i = 0; i < 30 * 11; i++) s.step(1 / 30); expect(s.angry).toBeGreaterThanOrEqual(1) })
  it('meja bertambah menurut tier; energi rendah memperpendek sabar', () => {
    expect(new ServeSim({ ...base, tier: 3 }).nTables).toBe(5)
    expect(new ServeSim({ ...base, tol: 0.7 }).patience).toBeLessThan(new ServeSim(base).patience)
  })
})

describe('Rute Kilat', () => {
  const bot = (s: RouteSim) => () => {
    if (s.phase === 'plan') for (const i of s.optimalOrder) s.key('Digit' + (i + 1))
    else if (s.phase === 'drive' && s.atStop) s.key('Space')
  }
  it('diam = performa rendah dan permainan selesai', () => { const s = new RouteSim(base); run(s); expect(s.done).toBe(true); expect(s.perf).toBeLessThan(0.5) })
  it('bot dengan rute optimal >= 0.9 di semua tier dan menyelesaikan semua ronde', () => {
    for (const tier of TIERS) for (const seed of [1, 2, 3]) { const s = new RouteSim({ ...base, tier, seed }); run(s, bot(s)); expect(s.roundScores.length, `tier ${tier}`).toBe(ROUNDS); expect(s.perf, `tier ${tier} seed ${seed}`).toBeGreaterThanOrEqual(0.9) }
  })
  it('rute terburuk memberi skor rute jauh lebih rendah daripada optimal', () => {
    const a = new RouteSim(base); a.optimalOrder.forEach((i) => a.key('Digit' + (i + 1))); const good = a.routeScore
    const b = new RouteSim(base)
    const perms: number[][] = []; const rec = (p: number[], r: number[]) => { if (!r.length) perms.push(p); else r.forEach((v, i) => rec([...p, v], r.filter((_, j) => j !== i))) }; rec([], [...Array(b.n).keys()])
    const L = (o: number[]) => { let d = 0, p = b.depot; for (const i of o) { d += Math.abs(p.x - b.stops[i].x) + Math.abs(p.y - b.stops[i].y); p = b.stops[i] } return d }
    const w = perms.sort((x, y) => L(y) - L(x))[0]; w.forEach((i) => b.key('Digit' + (i + 1)))
    expect(good).toBeCloseTo(1); expect(b.routeScore).toBeLessThan(0.6)
  })
  it('Backspace membatalkan pilihan terakhir dan alamat tak bisa dipilih dua kali', () => {
    const s = new RouteSim(base); s.key('Digit1'); s.key('Digit1'); expect(s.chosen).toEqual([0]); s.key('Backspace'); expect(s.chosen).toEqual([])
  })
  it('Spasi terlalu awal dihitung salah; handover terlewat tidak menghentikan permainan', () => {
    const s = new RouteSim(base); s.optimalOrder.forEach((i) => s.key('Digit' + (i + 1))); expect(s.phase).toBe('drive')
    s.key('Space'); expect(s.wrong).toBe(1)
    for (let i = 0; i < 30 * 12 && s.round === 0; i++) s.step(1 / 30)
    expect(s.round).toBe(1); expect(s.handoverOk).toBe(0)
  })
  it('stop bertambah menurut tier', () => { expect(new RouteSim({ ...base, tier: 0 }).n).toBe(4); expect(new RouteSim({ ...base, tier: 3 }).n).toBe(6) })
})

describe('Antar Penumpang', () => {
  const bot = (s: RideSim) => () => {
    const row = s.rows.filter((r) => r.y < 270 + 26).sort((a, b) => b.y - a.y)[0]
    if (!row || row.y < 270 - 170) return
    if (!row.lanes.includes(s.lane)) return
    const free = [0, 1, 2].filter((l) => !row.lanes.includes(l)).sort((a, b) => Math.abs(a - s.lane) - Math.abs(b - s.lane))[0]
    while (s.lane < free) s.key('ArrowRight'); while (s.lane > free) s.key('ArrowLeft')
  }
  it('diam di satu lajur = performa rendah', () => { const s = new RideSim(base); run(s); expect(s.perf).toBeLessThan(0.5) })
  it('bot pengendara handal >= 0.9 di semua tier dan banyak seed', () => {
    for (const tier of TIERS) for (const seed of [1, 2, 3, 4, 5]) { const s = new RideSim({ ...base, tier, seed }); run(s, bot(s)); expect(s.perf, `tier ${tier} seed ${seed}`).toBeGreaterThanOrEqual(0.9) }
  })
  it('tidak pernah ada baris yang menutup ketiga lajur', () => {
    for (const tier of TIERS) { const s = new RideSim({ ...base, tier, seed: 9 }); run(s, undefined, 1 / 20); expect(s.rows.every((r) => r.lanes.length <= 2 && new Set(r.lanes).size === r.lanes.length)).toBe(true) }
  })
  it('tabrakan mengurangi kenyamanan dan ada jeda kebal 1 detik', () => {
    // paksa tabrakan: letakkan baris tepat di atas pemain
    const t = new RideSim(base); t.rows.push({ y: 270, lanes: [t.lane], kinds: ['hole'], hit: false }); t.step(0.01)
    expect(t.hits).toBe(1); expect(t.comfort).toBe(80)
    t.rows.push({ y: 270, lanes: [t.lane], kinds: ['bike'], hit: false }); t.step(0.01); expect(t.hits).toBe(1)
  })
  it('lajur dibatasi 0..2 dan kecepatan naik dengan tier', () => {
    const s = new RideSim(base); for (let i = 0; i < 5; i++) s.key('ArrowLeft'); expect(s.lane).toBe(0); for (let i = 0; i < 5; i++) s.key('ArrowRight'); expect(s.lane).toBe(2)
    expect(new RideSim({ ...base, tier: 3 }).speed).toBeGreaterThan(new RideSim(base).speed)
  })
})
