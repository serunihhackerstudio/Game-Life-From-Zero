import { useRef, useState } from 'react'
import { ZONES } from './data'
import { touchIn, useIsTouch, useTouchState } from './input'
import { useSettings } from './settings'
import { useGame } from './store'

const R = 58 // jari-jari joystick (px)

/** Joystick melayang: muncul di titik sentuh pada setengah kiri layar. Dorong sampai tepi = lari. */
function Joystick() {
  const [st, setSt] = useState<{ bx: number; by: number; kx: number; ky: number } | null>(null)
  const id = useRef<number | null>(null)
  const reset = () => { id.current = null; touchIn.x = 0; touchIn.y = 0; setSt(null) }
  return (
    <div
      className="tc-zone"
      onPointerDown={(e) => {
        if (id.current !== null) return
        e.currentTarget.setPointerCapture(e.pointerId); id.current = e.pointerId
        setSt({ bx: e.clientX, by: e.clientY, kx: e.clientX, ky: e.clientY })
      }}
      onPointerMove={(e) => {
        if (id.current !== e.pointerId || !st) return
        let dx = e.clientX - st.bx, dy = e.clientY - st.by
        const len = Math.hypot(dx, dy)
        if (len > R) { dx = (dx / len) * R; dy = (dy / len) * R }
        touchIn.x = dx / R; touchIn.y = -dy / R
        setSt({ ...st, kx: st.bx + dx, ky: st.by + dy })
      }}
      onPointerUp={reset} onPointerCancel={reset} onLostPointerCapture={reset}
    >
      {!st && <div className="tc-ghost"><i /></div>}
      {st && (
        <div className="tc-stick" style={{ left: st.bx, top: st.by }}>
          <div className="tc-base" />
          <div className="tc-knob" style={{ transform: `translate(${st.kx - st.bx}px, ${st.ky - st.by}px)` }} />
        </div>
      )}
    </div>
  )
}

/** Kontrol sentuh untuk dunia 3D: joystick, tombol aksi, lari, tas, jeda, info. */
export function TouchControls() {
  const touch = useIsTouch()
  const screen = useGame((s) => s.screen)
  const free = useGame((s) => !s.scene && !s.ui && !s.mini && !s.paused && !s.gameOver && !s.busy)
  const interactive = useGame((s) => !s.ui && !s.mini && !s.gameOver)
  const nearby = useGame((s) => s.nearby)
  const info = useTouchState((s) => s.info)
  const runLock = useTouchState((s) => s.runLock)
  const hidden = useSettings((s) => s.open)
  if (!touch || screen !== 'playing' || hidden) return null
  const zone = ZONES.find((z) => z.id === nearby)
  const g = useGame.getState
  return (
    <div className="tc">
      {free && <Joystick />}
      {interactive && (
        <div className="tc-top">
          <button className={info ? 'on' : ''} onClick={() => useTouchState.getState().setInfo(!info)} aria-label="Info">i</button>
          <button onClick={() => g().openUi({ kind: 'inv' })} aria-label="Tas">🎒</button>
          <button onClick={() => g().togglePause()} aria-label="Jeda">⏸</button>
        </div>
      )}
      {free && (
        <div className="tc-right">
          <button className={'tc-run' + (runLock ? ' on' : '')} onClick={() => useTouchState.getState().toggleRun()} aria-label="Lari">»</button>
          <button className={'tc-act' + (zone ? ' ready' : '')} disabled={!zone} onPointerDown={(e) => { e.preventDefault(); g().interact() }} aria-label="Aksi">
            <span>E</span>{zone && <small>{zone.label.split(' (')[0]}</small>}
          </button>
        </div>
      )}
    </div>
  )
}
