import { useEffect, useRef } from 'react'
import type { Opts, Sim } from './core'
import { GAMES, H, W } from './games'
import type { GameId } from './games'

// Halaman uji visual (hanya dengan ?preview): menggambar tiap mini-game pada keadaan yang sudah dipentaskan.
const OPT: Opts = { tier: 0, tol: 1, timeMul: 1, seed: 11 }
type AnySim = Sim & Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

function stage(id: GameId, variant: string): AnySim {
  const sim = GAMES[id].create({ ...OPT, tier: variant === 'hard' ? 3 : 0 }) as AnySim
  const run = (n: number, bot?: (s: AnySim) => void, dt = 0.05) => { for (let i = 0; i < n && !sim.done; i++) { bot?.(sim); sim.step(dt) } }
  if (id === 'gudang') run(75, (s) => { if (s.time > 40 && Math.floor(s.time * 20) % 9 === 0) { const f = s.boxes.filter((b: { state: string }) => b.state === 'belt').sort((a: { x: number }, b: { x: number }) => b.x - a.x)[0]; if (f && s.time < 44.5) s.key(['Digit1', 'Digit2', 'Digit3'][f.color]) } })
  if (id === 'koran') {
    const bot = (s: AnySim) => { for (let l = 0; l < s.lanes; l++) { const c = s.carAt(l); if (c && !c.sold && s.isOpen(c)) { while (s.cursor !== l) s.key('ArrowDown'); s.key('Space') } } }
    if (variant === 'open') { for (let i = 0; i < 400; i++) { sim.step(0.05); let any = false; for (let l = 0; l < sim.lanes; l++) { const c = sim.carAt(l); if (c && !c.sold && sim.isOpen(c)) { any = true; while (sim.cursor !== l) sim.key('ArrowDown') } } if (any) break } }
    else { for (let i = 0; i < 600; i++) { bot(sim); sim.step(0.05); if (sim.sold >= 1) break } const k = variant === 'throw1' ? 0.08 : variant === 'throw2' ? 0.25 : variant === 'throw3' ? 0.38 : 0.7; for (let t = 0; t < k; t += 0.01) sim.step(0.01) }
  }
  if (id === 'nasgor') {
    sim.step(0.1)
    if (variant !== 'add') { sim.recipe.forEach((i: number) => sim.key('Digit' + (i + 1))); if (variant === 'stir') for (let k = 0; k < 4; k++) sim.key(k % 2 ? 'KeyD' : 'KeyA') }
    if (variant === 'flip') { sim.recipe.forEach(() => 0); for (let k = 0; k < 12; k++) sim.key(k % 2 ? 'KeyD' : 'KeyA'); sim.step(0.3) }
    if (variant === 'serve') { for (let k = 0; k < 12; k++) sim.key(k % 2 ? 'KeyD' : 'KeyA'); while (Math.abs(sim.marker - 0.5) > 0.02) sim.step(0.01); sim.key('Space') }
    if (variant === 'add') { sim.key('Digit' + (sim.recipe[0] + 1)); sim.key('Digit' + (sim.recipe[1] + 1)) }
  }
  if (id === 'parkir') { run(80, (s) => { if (Math.floor(s.time * 20) % 7 === 0) { const e = s.slots.findIndex((m: unknown) => !m); if (e >= 0 && s.queue.length) { while (s.cursor !== e) s.key('ArrowRight'); s.key('Space') } } }); if (variant === 'ready') { while (!sim.slots.some((m: { state: string } | null) => m && m.state === 'ready')) { sim.step(0.05); if (sim.done) break } } }
  if (id === 'pelayan') { run(110); sim.key('Digit2'); const o = sim.orders.find(Boolean); if (o) while (sim.cursor !== o.table) sim.key('ArrowRight') }
  if (id === 'kurir') {
    sim.step(0.1)
    if (variant === 'plan') { sim.key('Digit' + (sim.optimalOrder[0] + 1)); sim.key('Digit' + (sim.optimalOrder[1] + 1)) }
    else { sim.optimalOrder.forEach((i: number) => sim.key('Digit' + (i + 1))); if (variant === 'stop') { while (!sim.atStop) sim.step(0.05) } else run(30) }
  }
  if (id === 'ojek') run(150, (s) => { const row = s.rows.filter((r: { y: number }) => r.y < 296).sort((a: { y: number }, b: { y: number }) => b.y - a.y)[0]; if (row && row.y > 100 && row.lanes.includes(s.lane)) { const free = [0, 1, 2].filter((l) => !row.lanes.includes(l))[0]; while (s.lane < free) s.key('ArrowRight'); while (s.lane > free) s.key('ArrowLeft') } })
  return sim
}

const SHOTS: [GameId, string, string][] = [
  ['gudang', '', 'Sortir Peti'], ['koran', 'open', 'Lampu Merah · jendela terbuka'], ['koran', 'throw1', 'Lampu Merah · koran dilempar (1)'], ['koran', 'throw2', 'Lampu Merah · koran melayang (2)'],
  ['koran', 'throw3', 'Lampu Merah · koran masuk jendela (3)'], ['koran', 'done', 'Lampu Merah · koin muncul'],
  ['nasgor', 'add', 'Wajan Panas · bahan'], ['nasgor', 'stir', 'Wajan Panas · aduk'], ['nasgor', 'flip', 'Wajan Panas · balik'], ['nasgor', 'serve', 'Wajan Panas · saji'],
  ['parkir', '', 'Atur Parkir'], ['parkir', 'ready', 'Atur Parkir · siap bayar'], ['pelayan', '', 'Antar Pesanan'],
  ['kurir', 'plan', 'Rute Kilat · susun'], ['kurir', 'drive', 'Rute Kilat · jalan'], ['kurir', 'stop', 'Rute Kilat · serah paket'], ['ojek', '', 'Antar Penumpang'], ['ojek', 'hard', 'Antar Penumpang · level lanjut'],
]

export function Preview() {
  const only = new URLSearchParams(location.search).get('preview') || ''
  const refs = useRef<(HTMLCanvasElement | null)[]>([])
  const sims = useRef<AnySim[]>([])
  const list = SHOTS.filter(([id]) => !only || only === '1' || only === id)
  useEffect(() => {
    sims.current = list.map(([id, v]) => stage(id, v))
    let raf = 0
    const loop = () => { list.forEach(([id], i) => { const c = refs.current[i]; if (!c) return; const g = c.getContext('2d')!; GAMES[id].draw(g, sims.current[i] as never, 1.37) }); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div style={{ padding: 16, background: '#0b1020', minHeight: '100vh', color: '#fff', font: '14px system-ui', overflow: 'auto', height: '100vh' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${list.length === 1 ? 1 : 2}, ${W}px)`, gap: 14, justifyContent: 'start' }}>
        {list.map(([id, v, label], i) => (
          <div key={id + v}><div style={{ marginBottom: 4, opacity: 0.8 }}>{label}</div><canvas id={`pv-${id}-${v || 'x'}`} ref={(el) => { refs.current[i] = el }} width={W} height={H} style={{ width: W, height: H, borderRadius: 8, display: 'block' }} /></div>
        ))}
      </div>
    </div>
  )
}
