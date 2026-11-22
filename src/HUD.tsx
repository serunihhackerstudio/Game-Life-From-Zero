import { clock, dayOf, hourOf, jobLevel, MEAL_PRICE, periodOf, RENT, rupiah, useGame } from './store'
import { ZONES } from './data'
import { Panels } from './Panels'
import { INV_CAP, invCount } from './items'

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bar">
      <span>{label}</span>
      <div className="track"><div style={{ width: `${value}%`, background: color }} /></div>
      <b>{Math.round(value)}</b>
    </div>
  )
}

export function HUD() {
  const s = useGame()
  const day = dayOf(s.minute)
  const lvl = jobLevel(s.shifts)
  const zone = ZONES.find((z) => z.id === s.nearby)
  const dueIn = s.rentDueDay - day
  const g = s.goals
  const goal = (ok: boolean, t: string) => <li className={ok ? 'ok' : ''}>{ok ? '✓' : '○'} {t}</li>

  return (
    <div className="hud">
      <div className="panel tl">
        <div className="who">{s.name} <small>· Hari {day} · {clock(s.minute)} {periodOf(hourOf(s.minute))}</small></div>
        <div className="money">{rupiah(s.money)}</div>
        <Bar label="Kesehatan" value={s.health} color="#e74c3c" />
        <Bar label="Energi" value={s.energy} color="#f1c40f" />
        <Bar label="Lapar" value={s.hunger} color="#e67e22" />
        <Bar label="Mood" value={s.mood} color="#3498db" />
      </div>

      <div className="panel tr">
        <h4>Target Harian</h4>
        <ul>
          {goal(g.worked, 'Bekerja di gudang')}
          {goal(g.ate, 'Makan (' + rupiah(MEAL_PRICE) + ')')}
          {goal(g.slept, 'Tidur')}
        </ul>
        <h4>Kos & Listrik</h4>
        <p className={dueIn <= 1 ? 'warn' : ''}>
          {rupiah(RENT)} · {dueIn > 0 ? `jatuh tempo ${dueIn} hari lagi` : dueIn === 0 ? 'jatuh tempo HARI INI' : `MENUNGGAK ${-dueIn} hari`}
        </p>
        <h4>Tas</h4>
        <p>🎒 {invCount(s.inv)}/{INV_CAP} barang · tekan <b>I</b></p>
        <h4>Pekerja Gudang</h4>
        <p>{lvl.name} · {s.shifts} shift{lvl.next ? ` (naik di ${lvl.next})` : ''}</p>
      </div>

      {zone && !s.busy && !s.paused && !s.ui && <div className="prompt"><kbd>E</kbd> {zone.label}</div>}

      <div className="toasts">
        {s.toasts.map((t) => <div key={t.id} className={'toast ' + t.kind}>{t.text}</div>)}
      </div>

      <div className="help">WASD/panah: jalan · Shift: lari · Drag mouse / Q R: kamera · Scroll: zoom · E: interaksi · I: tas · Esc: jeda</div>

      <Panels />

      {s.busy && <div className="overlay"><div>{s.busy}</div></div>}

      {s.paused && (
        <div className="overlay">
          <div className="modal">
            <h2>Jeda</h2>
            <button onClick={s.togglePause}>Lanjut</button>
            <button onClick={() => { s.saveNow(); }}>Simpan</button>
            <button onClick={s.toMenu}>Simpan & Menu Utama</button>
          </div>
        </div>
      )}

      {s.gameOver && (
        <div className="overlay">
          <div className="modal">
            <h2>Game Over</h2>
            <p>{s.gameOver}</p>
            <p>Bertahan {day} hari · {s.shifts} shift kerja.</p>
            <button onClick={s.toMenu}>Menu Utama</button>
          </div>
        </div>
      )}
    </div>
  )
}
