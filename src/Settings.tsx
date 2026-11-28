import { useEffect } from 'react'
import { useGame, hourOf, visMinute } from './store'
import { audio, type LoopKind } from './audio'
import { daylight } from './glow'
import { useSettings, type Look, type Quality } from './settings'

const QNAME: Record<Quality, string> = { low: 'Rendah', medium: 'Sedang', high: 'Tinggi' }
const QDESC: Record<Quality, string> = {
  low: 'Tanpa bayangan, tanpa lalu-lintas dan awan. Untuk laptop sederhana.',
  medium: 'Bayangan standar, resolusi sedang. Seimbang.',
  high: 'Bayangan tajam dan resolusi penuh. Butuh GPU yang baik.',
}

function Slider({ label, k }: { label: string; k: 'master' | 'music' | 'sfx' | 'ambient' }) {
  const v = useSettings((s) => s[k])
  const patch = useSettings((s) => s.patch)
  return (
    <label className="slide">
      <span>{label}</span>
      <input type="range" min={0} max={1} step={0.05} value={v}
        onChange={(e) => patch({ [k]: Number(e.target.value) })}
        onPointerUp={() => audio.sfx('click')} />
      <b>{Math.round(v * 100)}%</b>
    </label>
  )
}

export function Settings() {
  const open = useSettings((s) => s.open)
  const s = useSettings()
  if (!open) return null
  return (
    <div className="overlay light front" onMouseDown={(e) => { if (e.target === e.currentTarget) s.setOpen(false) }}>
      <div className="sheet">
        <div className="sheet-h"><div><h2>Pengaturan</h2><small>Tersimpan otomatis di browser ini</small></div><button className="x" onClick={() => s.setOpen(false)} aria-label="Tutup">✕</button></div>

        <h3 className="sec">Suara</h3>
        <label className="chk"><input type="checkbox" checked={s.muted} onChange={(e) => s.patch({ muted: e.target.checked })} /> Matikan semua suara</label>
        <Slider label="Volume utama" k="master" />
        <Slider label="Musik" k="music" />
        <Slider label="Efek suara" k="sfx" />
        <Slider label="Suasana kota" k="ambient" />

        <h3 className="sec">Gaya tampilan</h3>
        <div className="seg">
          {(['warm', 'classic'] as Look[]).map((l) => (
            <button key={l} className={s.look === l ? 'sel' : ''} onClick={() => s.patch({ look: l })}>{l === 'warm' ? 'Hangat' : 'Klasik'}</button>
          ))}
        </div>
        <p className="hint">{s.look === 'warm' ? 'Cahaya senja keemasan, warna sinematik (bloom, vinyet), dan HUD berbingkai emas. Efek layar nonaktif di kualitas Rendah.' : 'Tampilan awal: cahaya netral dan HUD gelap sederhana.'}</p>

        <h3 className="sec">Grafis</h3>
        <div className="seg">
          {(['low', 'medium', 'high'] as Quality[]).map((q) => (
            <button key={q} className={s.quality === q ? 'sel' : ''} onClick={() => s.patch({ quality: q })}>{QNAME[q]}</button>
          ))}
        </div>
        <p className="hint">{QDESC[s.quality]}</p>

        <h3 className="sec">Tampilan</h3>
        <label className="chk"><input type="checkbox" checked={s.showHelp} onChange={(e) => s.patch({ showHelp: e.target.checked })} /> Tampilkan petunjuk kontrol di bawah layar</label>

        <h3 className="sec">Kontrol</h3>
        <p className="hint keys">WASD / panah: jalan · Shift: lari · Drag mouse atau Q R: putar kamera · Scroll: zoom · E: interaksi · I: tas · Esc: jeda</p>
        <div className="sheet-f"><button className="primary-s" onClick={() => s.setOpen(false)}>Selesai</button></div>
      </div>
    </div>
  )
}

export function Credits() {
  const open = useSettings((s) => s.credits)
  const setCredits = useSettings((s) => s.setCredits)
  if (!open) return null
  return (
    <div className="overlay light front" onMouseDown={(e) => { if (e.target === e.currentTarget) setCredits(false) }}>
      <div className="sheet">
        <div className="sheet-h"><div><h2>Kredit</h2><small>LIFE FROM ZERO</small></div><button className="x" onClick={() => setCredits(false)} aria-label="Tutup">✕</button></div>
        <p>Game simulasi kehidupan 3D di browser.<br /><i>Start with Nothing. Build Everything.</i></p>
        <h3 className="sec">Teknologi</h3>
        <p className="hint">React · TypeScript · Three.js · React Three Fiber · Drei · Zustand · Vite</p>
        <h3 className="sec">Aset</h3>
        <p className="hint">Seluruh model 3D, tekstur, dan musik dibuat langsung oleh kode: bentuk dasar, tekstur canvas, dan sintesis suara WebAudio. Tidak ada aset pihak ketiga.</p>
        <div className="sheet-f"><button className="primary-s" onClick={() => setCredits(false)}>Tutup</button></div>
      </div>
    </div>
  )
}

const LOOP: Partial<Record<string, [LoopKind, number?]>> = {
  mandi: ['water'], cook: ['sizzle'], nasgor: ['sizzle'], eat: ['chew'], drink: ['gulp'], sleep: ['snore'], kurir: ['engine', 5200], ojek: ['engine', 5600],
}

/** Menyalakan audio saat gestur pertama, menyelaraskan suasana dengan waktu & adegan. */
export function AudioDirector() {
  const screen = useGame((s) => s.screen)
  const kind = useGame((s) => s.scene?.kind)
  const ui = useGame((s) => s.ui)
  const paused = useGame((s) => s.paused)
  const set = useSettings()

  useEffect(() => {
    const go = () => audio.init()
    window.addEventListener('pointerdown', go); window.addEventListener('keydown', go)
    const click = (e: PointerEvent) => { if ((e.target as HTMLElement | null)?.closest?.('button')) audio.sfx('click') }
    document.addEventListener('pointerdown', click)
    return () => { window.removeEventListener('pointerdown', go); window.removeEventListener('keydown', go); document.removeEventListener('pointerdown', click) }
  }, [])
  useEffect(() => { audio.apply() }, [set.master, set.music, set.sfx, set.ambient, set.muted])
  useEffect(() => {
    const l = screen === 'playing' && kind ? LOOP[kind] : undefined
    audio.setLoop(l ? l[0] : null, l?.[1] ?? 0)
  }, [kind, screen])
  useEffect(() => { audio.setDuck(paused || set.open ? 0.35 : ui?.kind === 'talk' ? 0.6 : 1) }, [paused, ui, set.open])
  useEffect(() => {
    const id = window.setInterval(() => {
      const h = screen === 'playing' ? (visMinute() % 1440) / 60 : 10
      audio.setEnv(daylight(h).k, screen !== 'playing')
    }, 500)
    return () => clearInterval(id)
  }, [screen])
  useEffect(() => { // kait pengujian
    if (new URLSearchParams(location.search).has('debug')) { (window as unknown as Record<string, unknown>).__audio = audio; (window as unknown as Record<string, unknown>).__settings = useSettings }
  }, [])
  void hourOf
  return null
}
