import { useEffect, useRef, useState } from 'react'
import { audio } from '../audio'
import type { Opts } from './core'
import { H, W, type GameDef } from './games'
import { padFor, type Pad } from './pads'

/** Menjalankan satu mini-game di kanvas: hitung mundur, input keyboard, jeda (Esc). */
export function Runner({ def, opts, onDone }: { def: GameDef; opts: Opts; onDone: (perf: number, quit: boolean) => void }) {
  const cv = useRef<HTMLCanvasElement>(null)
  const [paused, setPaused] = useState(false)
  const [count, setCount] = useState(3)
  const state = useRef({ paused: false, count: 3, quit: false })
  state.current.paused = paused
  const simRef = useRef<{ key(c: string): void } | null>(null)
  const [pad, setPad] = useState<Pad | null>(null)
  const padSig = useRef('')

  useEffect(() => {
    const canvas = cv.current!, g = canvas.getContext('2d')!
    const sim = def.create(opts)
    simRef.current = sim
    let raf = 0, last = performance.now(), t = 0, fin = false, cd = 3
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now
      if (!state.current.paused) {
        t += dt
        if (cd > 0) { cd -= dt; const n = Math.max(1, Math.ceil(cd)); if (n !== state.current.count) { state.current.count = n; setCount(n); audio.sfx('click') } if (cd <= 0) { state.current.count = 0; setCount(0); audio.sfx('ding') } }
        else { sim.step(dt); for (const e of sim.events.splice(0)) audio.sfx(e) }
      }
      def.draw(g, sim as never, t)
      const np = padFor(def.id, sim as never)
      if (np.sig !== padSig.current) { padSig.current = np.sig; setPad(np) }
      if (sim.done && !fin) { fin = true; window.setTimeout(() => onDone(sim.perf, false), 800) }
      if (state.current.quit && !fin) { fin = true; onDone(0, true) }
      raf = requestAnimationFrame(loop)
    }
    const key = (e: KeyboardEvent) => {
      if (e.code === 'Escape') { setPaused((p) => !p); e.preventDefault(); return }
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault()
      if (state.current.paused || cd > 0 || e.repeat) return
      sim.key(e.code)
    }
    // tombol layar sentuh memakai jalur yang sama dengan keyboard
    void 0
    window.addEventListener('keydown', key)
    raf = requestAnimationFrame(loop)
    // kait pengujian: akses simulasi dari luar
    if (new URLSearchParams(location.search).has('debug')) (window as unknown as Record<string, unknown>).__sim = sim
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', key) }
  }, [def, opts, onDone])

  const press = (code: string) => { if (code === 'None' || state.current.paused || state.current.count > 0) return; simRef.current?.key(code) }
  return (
    <div className="mg-layout">
      <div className="mg-wrap">
        <canvas ref={cv} width={W} height={H} className="mg-canvas" />
        <button className="mg-pausebtn" onClick={() => setPaused(true)} aria-label="Jeda">⏸</button>
        {count > 0 && <div className="mg-count">{count}</div>}
        {paused && (
          <div className="mg-pause">
            <b>Jeda</b>
            <button onClick={() => setPaused(false)}>Lanjut</button>
            <button className="warn" onClick={() => { state.current.quit = true; setPaused(false) }}>Menyerah (upah 50%)</button>
          </div>
        )}
      </div>
      {pad && (
        <div className="mg-pad">
          {pad.rows.map((row, i) => (
            <div key={i} className="mg-padrow">
              {row.map((b) => (
                <button key={b.code + b.label} className={'mg-btn' + (b.wide ? ' wide' : '') + (b.code === 'None' ? ' idle' : '')} style={b.color ? { background: b.color } : undefined}
                  onPointerDown={(e) => { e.preventDefault(); press(b.code) }} onContextMenu={(e) => e.preventDefault()}>
                  <span>{b.label}</span>{b.sub && <small>{b.sub}</small>}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
