import { useEffect, useMemo, useRef } from 'react'
import { JOBS } from '../jobs'
import { jobLevel, rupiah, useGame, type MiniState } from '../store'
import type { Opts } from './core'
import { GAMES } from './games'
import { Runner } from './Runner'

const lv = (v: number, th: number) => Math.min(1, Math.max(0, (th - v) / th))
const TIER = ['Beginner', 'Intermediate', 'Advanced', 'Expert']

function Inner({ m }: { m: MiniState }) {
  const s = useGame()
  const job = JOBS[m.job], def = GAMES[m.job as keyof typeof GAMES]
  const shifts = s.jobShifts[job.id] ?? 0
  const tier = Math.max(0, TIER.indexOf(jobLevel(shifts).name))
  const plays = s.jobPlays[job.id] ?? 0
  const canAuto = plays >= 3

  // kondisi tubuh -> kesulitan
  const tol = Math.max(0.65, 1 - 0.25 * lv(s.energy, 35) - 0.1 * lv(s.thirst, 35))
  const timeMul = 1 - 0.2 * lv(s.hunger, 35)
  const notes = [
    s.energy < 35 && 'Energi rendah: jendela waktu menyempit.',
    s.thirst < 35 && 'Haus: reaksi sedikit melambat.',
    s.hunger < 35 && 'Lapar: waktu bermain lebih pendek.',
    s.hygiene < 25 && 'Bau badan: tidak ada tip dari pelanggan.',
  ].filter(Boolean) as string[]

  const seed = useRef(0)
  const opts: Opts = useMemo(() => { seed.current = Math.floor(Math.random() * 1e9); return { tier, tol, timeMul, seed: seed.current } }, [m.phase === 'play']) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      const g = useGame.getState()
      if (m.phase === 'brief') {
        if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); g.beginMini() }
        else if (e.code === 'Escape') g.cancelMini()
        else if (e.code === 'KeyA' && canAuto) g.autoMini()
      } else if (m.phase === 'result' && (e.code === 'Space' || e.code === 'Enter')) { e.preventDefault(); g.claimMini() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [m.phase, canAuto])

  if (m.phase === 'intro') return <div className="caption">{job.name} · shift dimulai…</div>

  return (
    <div className="mini-ov">
      {m.phase === 'brief' && (
        <div className="mini-card">
          <div className="mini-h"><span className="mini-ic">{def.icon}</span><div><h2>{def.title}</h2><small>{job.name} · {jobLevel(shifts).name} · {rupiah(job.wage)} dasar</small></div></div>
          <p className="mini-bl">{def.blurb}</p>
          <ul className="mini-ul">{def.howto.map((h) => <li key={h}>{h}</li>)}</ul>
          <div className="mini-keys"><kbd>{def.keys}</kbd><span>Esc: jeda</span></div>
          {notes.length > 0 && <div className="mini-warn">{notes.map((n) => <div key={n}>⚠ {n}</div>)}</div>}
          <div className="mini-btns">
            <button className="go" onClick={() => s.beginMini()}>Mulai <kbd>Spasi</kbd></button>
            {canAuto
              ? <button onClick={() => s.autoMini()}>Otomatis (upah 70%) <kbd>A</kbd></button>
              : <button disabled title="Terbuka setelah 3 kali main">Otomatis · {plays}/3</button>}
            <button onClick={() => s.cancelMini()}>Batal <kbd>Esc</kbd></button>
          </div>
        </div>
      )}
      {m.phase === 'play' && (
        <div className="mini-card play">
          <div className="mini-h slim"><span className="mini-ic">{def.icon}</span><h3>{def.title}</h3></div>
          <Runner def={def} opts={opts} onDone={s.endMini} />
        </div>
      )}
      {m.phase === 'result' && (
        <div className="mini-card res">
          <h2>{m.auto ? 'Shift otomatis' : m.quit ? 'Berhenti di tengah jalan' : m.stars === 3 ? 'Luar biasa!' : m.stars === 2 ? 'Kerja bagus' : 'Lumayan'}</h2>
          {!m.auto && <div className="stars">{[1, 2, 3].map((i) => <span key={i} className={i <= m.stars ? 'on' : ''}>★</span>)}</div>}
          {!m.auto && <p className="perf">Performa {Math.round(m.perf * 100)}%</p>}
          <table className="wage">
            <tbody>
              <tr><td>Upah dasar (level {jobLevel(shifts).name})</td><td>{rupiah(m.base)}</td></tr>
              <tr><td>{m.auto ? 'Pengali otomatis' : 'Pengali performa'}</td><td>× {m.mult.toFixed(2)}</td></tr>
              <tr><td>Upah</td><td>{rupiah(m.wage)}</td></tr>
              {!m.auto && <tr><td>Tip{s.hygiene < 25 ? ' (bau badan, tidak ada)' : ''}</td><td>{rupiah(m.tip)}</td></tr>}
              <tr className="tot"><td>Total</td><td>{rupiah(m.wage + m.tip)}</td></tr>
            </tbody>
          </table>
          <div className="mini-btns"><button className="go" onClick={() => s.claimMini()}>Terima &amp; lanjut <kbd>Spasi</kbd></button></div>
        </div>
      )}
    </div>
  )
}

export function MiniHost() {
  const m = useGame((s) => s.mini)
  if (!m) return null
  return <Inner m={m} />
}
