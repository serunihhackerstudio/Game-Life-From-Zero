// Mesin audio prosedural (WebAudio): tanpa file suara. Musik, suasana kota, dan efek dihasilkan di browser.
import { useSettings } from './settings'

export type LoopKind = 'water' | 'sizzle' | 'chew' | 'engine' | 'snore' | 'gulp'
export type SfxName = 'click' | 'good' | 'bad' | 'info' | 'coin' | 'ding'

const mtof = (m: number) => 440 * 2 ** ((m - 69) / 12)

class Engine {
  ctx: AudioContext | null = null
  private master!: GainNode; private music!: GainNode; private sfxG!: GainNode; private amb!: GainNode; private duck!: GainNode
  private analyser!: AnalyserNode
  private noise!: AudioBuffer
  private hum!: GainNode; private wind!: GainNode
  private echo!: DelayNode
  private beat = 0; private nextT = 0
  private night = false; private daylightK = 1
  private loopStop: (() => void) | null = null
  private timers: number[] = []
  private stepAlt = 0

  /** Harus dipanggil dari gestur pengguna (klik/tombol). Aman dipanggil berulang. */
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') void this.ctx.resume(); return }
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    const ctx = (this.ctx = new AC())
    const g = () => ctx.createGain()
    this.master = g(); this.music = g(); this.sfxG = g(); this.amb = g(); this.duck = g()
    this.analyser = ctx.createAnalyser(); this.analyser.fftSize = 512
    this.music.connect(this.duck); this.amb.connect(this.duck); this.duck.connect(this.master)
    this.sfxG.connect(this.master); this.master.connect(this.analyser); this.analyser.connect(ctx.destination)
    // buffer derau putih 2 detik
    this.noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const d = this.noise.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    this.buildAmbient()
    this.buildMusic()
    this.apply()
    this.timers.push(window.setInterval(() => this.scheduleMusic(), 120))
    this.timers.push(window.setInterval(() => this.birds(), 1800))
    this.timers.push(window.setInterval(() => this.crickets(), 1300))
    this.timers.push(window.setInterval(() => this.passby(), 5200))
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return
      if (document.hidden) void this.ctx.suspend(); else void this.ctx.resume()
    })
  }

  /** Terapkan volume dari pengaturan. */
  apply() {
    if (!this.ctx) return
    const s = useSettings.getState(), t = this.ctx.currentTime
    this.master.gain.setTargetAtTime(s.muted ? 0 : s.master, t, 0.05)
    this.music.gain.setTargetAtTime(s.music * 0.35, t, 0.1)
    this.sfxG.gain.setTargetAtTime(s.sfx, t, 0.05)
    this.amb.gain.setTargetAtTime(s.ambient, t, 0.1)
  }
  /** Tingkat suara keluaran (0..1), untuk pengujian. */
  level() {
    if (!this.ctx) return -1
    const a = new Uint8Array(this.analyser.fftSize); this.analyser.getByteTimeDomainData(a)
    let m = 0; for (const v of a) m = Math.max(m, Math.abs(v - 128) / 128)
    return m
  }

  // ---------- util ----------
  private src(loop = true) {
    const n = this.ctx!.createBufferSource(); n.buffer = this.noise; n.loop = loop
    if (loop) n.playbackRate.value = 0.9 + Math.random() * 0.2
    return n
  }
  private filt(type: BiquadFilterType, f: number, q = 0.7) { const b = this.ctx!.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b }
  private tone(freq: number, type: OscillatorType, t0: number, dur: number, vol: number, dest: AudioNode, glide?: number, attack = 0.01) {
    const c = this.ctx!, o = c.createOscillator(), g = c.createGain()
    o.type = type; o.frequency.setValueAtTime(freq, t0)
    if (glide) o.frequency.exponentialRampToValueAtTime(glide, t0 + dur)
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + attack); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    o.connect(g); g.connect(dest); o.start(t0); o.stop(t0 + dur + 0.05)
  }
  private burst(t0: number, dur: number, vol: number, f: number, type: BiquadFilterType = 'lowpass', dest?: AudioNode) {
    const c = this.ctx!, n = this.src(false), fl = this.filt(type, f), g = c.createGain()
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    n.connect(fl); fl.connect(g); g.connect(dest ?? this.sfxG); n.start(t0, Math.random() * 1.5, dur + 0.05)
  }

  // ---------- suasana ----------
  private buildAmbient() {
    const c = this.ctx!
    const mk = (type: BiquadFilterType, f: number, q: number) => { const s = this.src(), fl = this.filt(type, f, q), g = c.createGain(); g.gain.value = 0; s.connect(fl); fl.connect(g); g.connect(this.amb); s.start(); return g }
    this.hum = mk('lowpass', 420, 0.5)
    this.wind = mk('bandpass', 700, 0.4)
    // hembusan angin berayun pelan
    const sl = c.createOscillator(); sl.frequency.value = 0.12; const sg = c.createGain(); sg.gain.value = 0.015
    sl.connect(sg); sg.connect(this.wind.gain); sl.start()
  }
  /** Perbarui campuran suasana menurut waktu: k = tingkat siang (0 malam..1 siang). */
  setEnv(k: number, inMenu: boolean) {
    if (!this.ctx) return
    this.daylightK = k; this.night = k < 0.35
    const t = this.ctx.currentTime, m = inMenu ? 0.3 : 1
    this.hum.gain.setTargetAtTime((0.05 + 0.1 * k) * m, t, 0.8)
    this.wind.gain.setTargetAtTime(0.02 * m + 0.0, t, 0.8)
  }
  /** Redam musik & suasana (dialog/jeda). */
  setDuck(v: number) { if (this.ctx) this.duck.gain.setTargetAtTime(v, this.ctx.currentTime, 0.25) }
  private birds() {
    if (!this.ctx || this.daylightK < 0.55 || Math.random() > 0.55) return
    const c = this.ctx, t = c.currentTime, pan = c.createStereoPanner(); pan.pan.value = Math.random() * 2 - 1; pan.connect(this.amb)
    const base = 2600 + Math.random() * 1200
    for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) this.tone(base, 'sine', t + i * 0.13, 0.1, 0.05, pan, base * (1.15 + Math.random() * 0.3))
  }
  /** Jangkrik malam: cicitan pendek (beberapa denyut) dengan jeda senyap — bukan nada yang menyala terus. */
  private crickets() {
    if (!this.ctx || this.daylightK > 0.3 || Math.random() > 0.7) return
    const c = this.ctx, t = c.currentTime + 0.05, pan = c.createStereoPanner(); pan.pan.value = Math.random() * 1.6 - 0.8; pan.connect(this.amb)
    const base = 3600 + Math.random() * 700, n = 3 + Math.floor(Math.random() * 3), gap = 0.07 + Math.random() * 0.03
    for (let i = 0; i < n; i++) this.tone(base + i * 12, 'sine', t + i * gap, 0.035, 0.012 * (1 - this.daylightK), pan, undefined, 0.006)
  }
  private passby() {
    if (!this.ctx || this.daylightK < 0.12 || Math.random() > 0.55) return
    const c = this.ctx, t = c.currentTime, dir = Math.random() < 0.5 ? -1 : 1
    const o = c.createOscillator(), f = this.filt('lowpass', 360, 1), g = c.createGain(), p = c.createStereoPanner()
    o.type = 'sawtooth'
    o.frequency.setValueAtTime(70, t); o.frequency.linearRampToValueAtTime(95, t + 1.4); o.frequency.linearRampToValueAtTime(62, t + 3)
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + 1.4); g.gain.exponentialRampToValueAtTime(0.0001, t + 3)
    p.pan.setValueAtTime(-0.9 * dir, t); p.pan.linearRampToValueAtTime(0.9 * dir, t + 3)
    o.connect(f); f.connect(g); g.connect(p); p.connect(this.amb); o.start(t); o.stop(t + 3.1)
  }

  // ---------- musik generatif ----------
  private buildMusic() {
    const c = this.ctx!
    this.echo = c.createDelay(1); this.echo.delayTime.value = 0.41
    const fb = c.createGain(); fb.gain.value = 0.35, this.echo.connect(fb); fb.connect(this.echo)
    const lp = this.filt('lowpass', 2400); this.echo.connect(lp); lp.connect(this.music)
    this.nextT = c.currentTime + 0.3
  }
  private scheduleMusic() {
    if (!this.ctx || this.ctx.state !== 'running') return
    const c = this.ctx, step = 60 / 70 / 2
    if (this.nextT < c.currentTime) this.nextT = c.currentTime + 0.1
    while (this.nextT < c.currentTime + 0.4) { this.playStep(this.beat++, this.nextT); this.nextT += step }
  }
  private playStep(b: number, t: number) {
    const day = [[48, 55, 59, 64], [45, 52, 55, 60], [41, 48, 52, 57], [43, 50, 53, 59]]
    const nite = [[45, 52, 55, 60], [41, 48, 52, 57], [48, 55, 59, 64], [40, 47, 52, 55]]
    const chord = (this.night ? nite : day)[Math.floor(b / 8) % 4]
    const c = this.ctx!
    if (b % 8 === 0) {
      const lp = this.filt('lowpass', this.night ? 700 : 1000)
      lp.connect(this.music)
      chord.slice(1).forEach((m, i) => this.tone(mtof(m + 12), 'triangle', t + i * 0.02, 3.8, 0.1, lp, undefined, 0.9))
      this.tone(mtof(chord[0] - 12), 'sine', t, 2.4, 0.22, this.music, undefined, 0.05)
    }
    if (b % 4 === 2) this.tone(mtof(chord[0]), 'sine', t, 0.5, 0.1, this.music) // bas ringan
    if (Math.random() < (this.night ? 0.22 : 0.4) && b % 8 !== 0) {
      const penta = [0, 2, 4, 7, 9, 12, 14, 16]
      const n = (this.night ? 60 : 72) + penta[Math.floor(Math.random() * penta.length)]
      const g = c.createGain(); g.gain.value = 1; g.connect(this.music); g.connect(this.echo)
      this.tone(mtof(n), 'sine', t, 0.9, 0.12, g, undefined, 0.02)
    }
  }

  // ---------- efek ----------
  sfx(name: SfxName) {
    if (!this.ctx) return
    const t = this.ctx.currentTime + 0.02, d = this.sfxG // jeda kecil: envelope tidak jatuh ke masa lalu
    switch (name) {
      case 'click': this.tone(660, 'sine', t, 0.06, 0.12, d, 520); break
      case 'good': this.tone(523, 'sine', t, 0.18, 0.14, d); this.tone(784, 'sine', t + 0.1, 0.28, 0.14, d); break
      case 'bad': this.tone(300, 'triangle', t, 0.22, 0.16, d, 200); this.tone(220, 'triangle', t + 0.12, 0.3, 0.14, d, 150); break
      case 'info': this.tone(600, 'sine', t, 0.12, 0.09, d); break
      case 'coin': this.tone(1318, 'square', t, 0.07, 0.05, d); this.tone(1760, 'square', t + 0.07, 0.22, 0.05, d); break
      case 'ding': this.tone(880, 'sine', t, 0.5, 0.1, d); break
    }
  }
  step(running: boolean) {
    if (!this.ctx) return
    this.stepAlt ^= 1
    this.burst(this.ctx.currentTime + 0.02, running ? 0.05 : 0.07, running ? 0.35 : 0.26, this.stepAlt ? 700 : 560)
  }
  blip(i: number) {
    if (!this.ctx) return
    const f = 170 + i * 45 + Math.random() * 25
    this.tone(f, 'square', this.ctx.currentTime + 0.02, 0.04, 0.07, this.sfxG)
  }

  /** Suara latar adegan aktivitas (satu per waktu). */
  setLoop(kind: LoopKind | null, ms = 0) {
    this.loopStop?.(); this.loopStop = null
    if (!this.ctx || !kind) return
    const c = this.ctx, nodes: AudioScheduledSourceNode[] = [], ti: number[] = []
    const out = c.createGain(); out.gain.value = 0; out.connect(this.sfxG)
    out.gain.setTargetAtTime(1, c.currentTime, 0.3)
    const add = <T extends AudioScheduledSourceNode>(n: T) => { nodes.push(n); return n }
    switch (kind) {
      case 'water': {
        const n = add(this.src()), f1 = this.filt('highpass', 1800), f2 = this.filt('lowpass', 7000), g = c.createGain(); g.gain.value = 0.2
        n.connect(f1); f1.connect(f2); f2.connect(g); g.connect(out); n.start()
        ti.push(window.setInterval(() => { this.tone(900 + Math.random() * 900, 'sine', c.currentTime, 0.08, 0.04, out, 1400) }, 160))
        break
      }
      case 'sizzle': {
        const n = add(this.src()), f = this.filt('highpass', 3500), g = c.createGain(); g.gain.value = 0.1
        n.connect(f); f.connect(g); g.connect(out); n.start()
        ti.push(window.setInterval(() => { if (Math.random() < 0.6) this.burst(c.currentTime, 0.03, 0.15, 5000, 'highpass', out) }, 110))
        break
      }
      case 'chew': ti.push(window.setInterval(() => { this.burst(c.currentTime, 0.09, 0.2, 1400, 'bandpass', out); this.burst(c.currentTime + 0.12, 0.07, 0.12, 1000, 'bandpass', out) }, 760)); break
      case 'gulp': ti.push(window.setInterval(() => this.tone(220, 'sine', c.currentTime, 0.16, 0.2, out, 110), 700)); break
      case 'engine': {
        const o = add(c.createOscillator()), f = this.filt('lowpass', 280, 1), g = c.createGain(); g.gain.value = 0.07
        o.type = 'sawtooth'; o.frequency.value = 62
        const l = add(c.createOscillator()), lg = c.createGain(); l.frequency.value = 9; lg.gain.value = 6; l.connect(lg); lg.connect(o.frequency)
        o.connect(f); f.connect(g); g.connect(out); o.start(); l.start()
        ti.push(window.setInterval(() => { o.frequency.setTargetAtTime(60 + Math.random() * 30, c.currentTime, 0.4) }, 900))
        break
      }
      case 'snore': {
        const n = add(this.src()), f = this.filt('lowpass', 260), g = c.createGain(); g.gain.value = 0.05
        const l = add(c.createOscillator()), lg = c.createGain(); l.frequency.value = 0.3; lg.gain.value = 0.05; l.connect(lg); lg.connect(g.gain)
        n.connect(f); f.connect(g); g.connect(out); n.start(); l.start()
        break
      }
    }
    const stop = () => {
      out.gain.setTargetAtTime(0, c.currentTime, 0.15)
      ti.forEach((i) => clearInterval(i))
      window.setTimeout(() => { nodes.forEach((n) => { try { n.stop() } catch { /* sudah berhenti */ } }); out.disconnect() }, 700)
    }
    this.loopStop = stop
    if (ms > 0) window.setTimeout(() => { if (this.loopStop === stop) { stop(); this.loopStop = null } }, ms)
  }
}

export const audio = new Engine()
