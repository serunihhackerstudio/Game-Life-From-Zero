import { useEffect, useState } from 'react'
import { clock, dayOf, hourOf, jobLevel, MEAL_PRICE, periodOf, RENT, rupiah, useGame, visMinute } from './store'
import { ZONES } from './data'
import { Panels } from './Panels'
import { useIsTouch, useTouchState } from './input'
import { MiniHost } from './minigames/MiniHost'
import { useSettings } from './settings'
import { affLabel, NPCS } from './npcs'
import { INV_CAP, invCount } from './items'

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={'bar' + (value < 25 ? ' crit' : '')}>
      <span>{label}</span>
      <div className="track"><div style={{ width: `${value}%`, background: color }} /></div>
      <b>{Math.round(value)}</b>
    </div>
  )
}

export function HUD() {
  const s = useGame()
  const showHelp = useSettings((st) => st.showHelp)
  const touch = useIsTouch()
  const infoOpen = useTouchState((st) => st.info)
  const [, force] = useState(0)
  const scening = !!s.scene && isFinite(s.scene.dur)
  useEffect(() => { // jam berjalan cepat selama adegan
    if (!scening) return
    let id = 0
    const loop = () => { force((x) => x + 1); id = requestAnimationFrame(loop) }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [scening])
  const vm = visMinute()
  const day = dayOf(vm)
  const lvl = jobLevel(s.shifts)
  const zone = ZONES.find((z) => z.id === s.nearby)
  const dueIn = s.rentDueDay - day
  const g = s.goals
  const status = [
    s.hunger < 25 && { k: 'h', t: s.hunger <= 0 ? '🥴 Kelaparan!' : '🍽️ Lapar', tip: 'Gerak melambat, produktivitas kerja turun. Makan segera.' },
    s.energy < 25 && { k: 'e', t: '😴 Mengantuk', tip: 'Gerak melambat, mata sayu. Tidur atau minum kopi.' },
    s.health < 50 && { k: 's', t: '🤒 Kurang sehat', tip: 'Wajah pucat dan batuk. Makan teratur dan istirahat.' },
    s.thirst < 25 && { k: 't', t: s.thirst <= 0 ? '🥵 Dehidrasi!' : '💧 Haus', tip: 'Kesehatan menurun jika tidak minum. Minum air atau teh.' },
    s.hygiene < 25 && { k: 'y', t: '🤢 Bau badan', tip: 'Orang menjauh dan upah kerja turun. Mandi di kamar mandi bersama.' },
    s.mood < 30 && { k: 'm', t: '😞 Murung', tip: 'Mood rendah. Istirahat di taman atau makan enak.' },
  ].filter(Boolean) as { k: string; t: string; tip: string }[]
  const lvl2 = (v: number, th: number) => Math.min(1, Math.max(0, (th - v) / th))
  const vig = Math.max(lvl2(s.hunger, 20) * 0.45, lvl2(s.energy, 20) * 0.4, lvl2(s.health, 50) * 0.6)
  const vigRed = lvl2(s.health, 50) >= lvl2(s.hunger, 20) && lvl2(s.health, 50) >= lvl2(s.energy, 20)
  const goal = (ok: boolean, t: string) => <li className={ok ? 'ok' : ''}>{ok ? '✓' : '○'} {t}</li>

  return (
    <div className="hud">
      {vig > 0.02 && <div className={'vig' + (vigRed && vig > 0.3 ? ' beat' : '')} style={{ '--a': vig, '--c': vigRed ? '130,10,10' : '10,8,6' } as React.CSSProperties} />}
      <div className="panel tl">
        <div className="who">{s.name} <small>· Hari {day} · {clock(vm)} {periodOf(hourOf(vm))}</small></div>
        <div className="money">{rupiah(s.money)}</div>
        <Bar label="Kesehatan" value={s.health} color="#e74c3c" />
        <Bar label="Energi" value={s.energy} color="#f1c40f" />
        <Bar label="Lapar" value={s.hunger} color="#e67e22" />
        <Bar label="Haus" value={s.thirst} color="#38bdf8" />
        <Bar label="Bersih" value={s.hygiene} color="#a3e635" />
        <Bar label="Mood" value={s.mood} color="#3498db" />
        {status.length > 0 && (
          <div className="chips">
            {status.map((c) => <span key={c.k} className="chip" title={c.tip}>{c.t}</span>)}
          </div>
        )}
      </div>

      <div className={'panel tr' + (touch && !infoOpen ? ' collapsed' : '')}>
        <h4>Target Harian</h4>
        <ul>
          {goal(g.worked, 'Bekerja (satu shift)')}
          {goal(g.ate, 'Makan (' + rupiah(MEAL_PRICE) + ')')}
          {goal(g.slept, 'Tidur')}
          {goal(!!g.bathed, 'Mandi')}
        </ul>
        <h4>Kos & Listrik</h4>
        <p className={dueIn <= 1 ? 'warn' : ''}>
          {rupiah(RENT)} · {dueIn > 0 ? `jatuh tempo ${dueIn} hari lagi` : dueIn === 0 ? 'jatuh tempo HARI INI' : `MENUNGGAK ${-dueIn} hari`}
        </p>
        <h4>Tas</h4>
        <p>🎒 {invCount(s.inv)}/{INV_CAP} barang · tekan <b>I</b></p>
        {Object.keys(s.affinity).length > 0 && (
          <>
            <h4>Hubungan</h4>
            <p>{Object.entries(s.affinity).map(([id, v]) => `${NPCS[id as keyof typeof NPCS].name.replace(/^(Pak|Bu) /, '')}: ${affLabel(v)}`).join(' · ')}</p>
          </>
        )}
        <h4>Karier</h4>
        <p>{s.shifts} shift · {lvl.name} · {s.hired.length} pekerjaan{s.hired.length === 0 ? ' — lamar di Job Center' : ''}</p>
      </div>

      {zone && !s.busy && !s.paused && !s.ui && <div className="prompt" onPointerDown={() => { if (touch) s.interact() }}>{!touch && <kbd>E</kbd>} {zone.label}</div>}

      <div className="toasts">
        {s.toasts.map((t) => <div key={t.id} className={'toast ' + t.kind}>{t.text}</div>)}
      </div>

      {showHelp && !touch && <div className="help">WASD/panah: jalan · Shift: lari · Drag mouse / Q R: kamera · Scroll: zoom · E: interaksi · I: tas · Esc: jeda</div>}

      <Panels />
      {touch && s.screen === 'playing' && !s.scene && <div className="rotate-hint">📱 Putar ke mode landscape untuk pengalaman terbaik</div>}
      <MiniHost />

      {s.scene && (
        <>
          {!s.mini && <div className="bars"><div /><div /></div>}
          {scening && <div className="caption">{s.scene.label}</div>}
        </>
      )}
      {s.cutKey > 0 && <div key={s.cutKey} className="cut" />}

      {s.paused && (
        <div className="overlay">
          <div className="modal">
            <h2>Jeda</h2>
            <button onClick={s.togglePause}>Lanjut</button>
            <button onClick={() => useSettings.getState().setOpen(true)}>Pengaturan</button>
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
