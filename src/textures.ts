import { CanvasTexture, RepeatWrapping, SRGBColorSpace, Texture } from 'three'

// Tekstur prosedural (canvas) — tanpa file gambar, jadi tidak menambah ukuran unduhan.
function rng(seed: number) {
  let a = seed
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
type Draw = (g: CanvasRenderingContext2D, s: number, r: () => number) => void

function make(w: number, h: number, seed: number, draw: Draw, repeat = true): CanvasTexture {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const g = c.getContext('2d')!
  draw(g, w, rng(seed))
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = 8
  if (repeat) t.wrapS = t.wrapT = RepeatWrapping
  return t
}
const cache = new Map<string, CanvasTexture>()
const memo = (k: string, f: () => CanvasTexture) => { let t = cache.get(k); if (!t) { t = f(); cache.set(k, t) } return t }

const speckle = (g: CanvasRenderingContext2D, s: number, r: () => number, n: number, a: number) => {
  for (let i = 0; i < n; i++) {
    const l = r() > 0.5
    g.fillStyle = l ? `rgba(255,255,255,${a * r()})` : `rgba(0,0,0,${a * r()})`
    g.fillRect(r() * s, r() * s, 1 + r() * 2, 1 + r() * 2)
  }
}

export const plaster = (base: string) => memo('plaster' + base, () => make(512, 512, 11, (g, s, r) => {
  g.fillStyle = base; g.fillRect(0, 0, s, s)
  speckle(g, s, r, 5000, 0.09)
  for (let i = 0; i < 16; i++) { // noda air memanjang dari atas
    const x = r() * s, len = 60 + r() * 220, w = 6 + r() * 26
    const gr = g.createLinearGradient(0, 0, 0, len)
    gr.addColorStop(0, 'rgba(70,50,30,0.2)'); gr.addColorStop(1, 'rgba(70,50,30,0)')
    g.fillStyle = gr; g.fillRect(x, 0, w, len)
  }
  for (let i = 0; i < 6; i++) { // bercak lembap di bawah
    const x = r() * s, y = s - r() * 90, rad = 30 + r() * 70
    const gr = g.createRadialGradient(x, y, 0, x, y, rad)
    gr.addColorStop(0, 'rgba(40,40,30,0.22)'); gr.addColorStop(1, 'rgba(40,40,30,0)')
    g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2)
  }
}))

export const asphalt = () => memo('asphalt', () => make(512, 512, 21, (g, s, r) => {
  g.fillStyle = '#3b3e43'; g.fillRect(0, 0, s, s)
  for (let i = 0; i < 40; i++) {
    g.fillStyle = `rgba(${r() > 0.5 ? '255,255,255' : '0,0,0'},${0.03 + r() * 0.05})`
    g.beginPath(); g.ellipse(r() * s, r() * s, 20 + r() * 60, 10 + r() * 40, r() * 3, 0, 7); g.fill()
  }
  speckle(g, s, r, 9000, 0.28)
  g.strokeStyle = 'rgba(15,15,15,0.55)'; g.lineWidth = 1.5
  for (let i = 0; i < 6; i++) { // retakan
    let x = r() * s, y = r() * s
    g.beginPath(); g.moveTo(x, y)
    for (let j = 0; j < 8; j++) { x += (r() - 0.5) * 50; y += (r() - 0.3) * 40; g.lineTo(x, y) }
    g.stroke()
  }
}))

export const pavement = () => memo('pavement', () => make(512, 512, 31, (g, s, r) => {
  const n = 4, t = s / n
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const v = 190 + r() * 28
    g.fillStyle = `rgb(${v},${v - 2},${v - 8})`; g.fillRect(i * t, j * t, t, t)
  }
  g.strokeStyle = 'rgba(70,68,60,0.7)'; g.lineWidth = 3
  for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * t, 0); g.lineTo(i * t, s); g.stroke(); g.beginPath(); g.moveTo(0, i * t); g.lineTo(s, i * t); g.stroke() }
  speckle(g, s, r, 4000, 0.14)
}))

export const grass = () => memo('grass', () => make(512, 512, 41, (g, s, r) => {
  g.fillStyle = '#6a9a4c'; g.fillRect(0, 0, s, s)
  for (let i = 0; i < 30; i++) {
    g.fillStyle = `rgba(${r() > 0.5 ? '40,90,30' : '120,160,70'},0.18)`
    g.beginPath(); g.ellipse(r() * s, r() * s, 30 + r() * 70, 20 + r() * 50, r() * 3, 0, 7); g.fill()
  }
  for (let i = 0; i < 7000; i++) {
    g.strokeStyle = `hsl(${85 + r() * 35},${40 + r() * 20}%,${25 + r() * 25}%)`
    const x = r() * s, y = r() * s
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 4, y - 3 - r() * 5); g.stroke()
  }
}))

export const metal = (base = '#8d99a6') => memo('metal' + base, () => make(512, 256, 51, (g, s, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 512, 256)
  const per = 16
  for (let x = 0; x < 512; x += per) { // gelombang seng
    const gr = g.createLinearGradient(x, 0, x + per, 0)
    gr.addColorStop(0, 'rgba(255,255,255,0.28)'); gr.addColorStop(0.5, 'rgba(0,0,0,0.18)'); gr.addColorStop(1, 'rgba(255,255,255,0.28)')
    g.fillStyle = gr; g.fillRect(x, 0, per, 256)
  }
  for (let i = 0; i < 14; i++) { // karat
    const x = r() * 512, len = 30 + r() * 150
    const gr = g.createLinearGradient(0, 0, 0, len)
    gr.addColorStop(0, 'rgba(130,70,30,0.35)'); gr.addColorStop(1, 'rgba(130,70,30,0)')
    g.fillStyle = gr; g.fillRect(x, 0, 4 + r() * 12, len)
  }
  speckle(g, 512, r, 1500, 0.1)
}))

export const roofTile = () => memo('roofTile', () => make(512, 512, 61, (g, s, r) => {
  g.fillStyle = '#9a4a2a'; g.fillRect(0, 0, s, s)
  const tw = 32, th = 26
  for (let y = 0, row = 0; y < s + th; y += th, row++) for (let x = -(row % 2) * tw / 2; x < s; x += tw) {
    const l = 38 + r() * 14
    g.fillStyle = `hsl(${12 + r() * 6},55%,${l}%)`
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + tw, y); g.lineTo(x + tw, y + th * 0.7); g.quadraticCurveTo(x + tw / 2, y + th * 1.1, x, y + th * 0.7); g.closePath(); g.fill()
    g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 1.5; g.stroke()
  }
}))

export const wood = (base = '#9a6b43', vertical = false) => memo('wood' + base + vertical, () => make(512, 512, 71, (g, s, r) => {
  const n = 8, p = s / n
  for (let i = 0; i < n; i++) {
    const v = 0.85 + r() * 0.3
    g.fillStyle = base; g.fillRect(vertical ? i * p : 0, vertical ? 0 : i * p, vertical ? p : s, vertical ? s : p)
    g.fillStyle = `rgba(${v > 1 ? '255,255,255' : '0,0,0'},${Math.abs(v - 1) * 0.5})`
    g.fillRect(vertical ? i * p : 0, vertical ? 0 : i * p, vertical ? p : s, vertical ? s : p)
    g.strokeStyle = 'rgba(60,35,15,0.35)'; g.lineWidth = 1
    for (let k = 0; k < 14; k++) {
      const o = i * p + r() * p
      g.beginPath()
      if (vertical) { g.moveTo(o, 0); g.lineTo(o + (r() - 0.5) * 6, s) } else { g.moveTo(0, o); g.lineTo(s, o + (r() - 0.5) * 6) }
      g.stroke()
    }
    g.strokeStyle = 'rgba(30,15,5,0.6)'; g.lineWidth = 2
    g.beginPath(); if (vertical) { g.moveTo(i * p, 0); g.lineTo(i * p, s) } else { g.moveTo(0, i * p); g.lineTo(s, i * p) } g.stroke()
  }
}))

export const stripes = (a = '#c0392b', b = '#f4efe6') => memo('stripes' + a + b, () => make(256, 64, 81, (g) => {
  const n = 8, w = 256 / n
  for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect(i * w, 0, w, 64) }
}))

export const rollerDoor = () => memo('roller', () => make(256, 256, 91, (g, s, r) => {
  const n = 16, h = s / n
  for (let i = 0; i < n; i++) {
    const gr = g.createLinearGradient(0, i * h, 0, (i + 1) * h)
    gr.addColorStop(0, '#9aa3ad'); gr.addColorStop(0.5, '#6f7882'); gr.addColorStop(1, '#4e565f')
    g.fillStyle = gr; g.fillRect(0, i * h, s, h)
  }
  speckle(g, s, r, 800, 0.12)
}))

export const hazard = () => memo('hazard', () => make(128, 128, 95, (g) => {
  g.fillStyle = '#f1c40f'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#1a1a1a'
  for (let i = -4; i < 8; i++) { g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32 + 16, 0); g.lineTo(i * 32 + 16 + 128, 128); g.lineTo(i * 32 + 128, 128); g.fill() }
}))

/** Fasad gedung latar: jendela berlapis; emissive = jendela menyala (malam). */
export const facade = (base: string, seed: number) => memo('facade' + base + seed, () => {
  const lit = document.createElement('canvas'); lit.width = lit.height = 256
  const lg = lit.getContext('2d')!; lg.fillStyle = '#000'; lg.fillRect(0, 0, 256, 256)
  const t = make(256, 256, seed, (g, s, r) => {
    g.fillStyle = base; g.fillRect(0, 0, s, s); speckle(g, s, r, 2500, 0.08)
    const cols = 4, rows = 4, cw = s / cols, rh = s / rows
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const x = i * cw + cw * 0.2, y = j * rh + rh * 0.18, w = cw * 0.6, h = rh * 0.6
      g.fillStyle = '#2b3b4b'; g.fillRect(x, y, w, h)
      g.fillStyle = 'rgba(180,210,235,0.35)'; g.fillRect(x, y, w, h * 0.4)
      g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 2; g.strokeRect(x, y, w, h)
      if (r() > 0.55) { lg.fillStyle = '#ffd98a'; lg.fillRect(x, y, w, h) }
    }
  })
  ;(t as CanvasTexture & { emissiveMap?: CanvasTexture }).emissiveMap = (() => { const e = new CanvasTexture(lit); e.colorSpace = SRGBColorSpace; e.wrapS = e.wrapT = RepeatWrapping; return e })()
  return t
})
export const facadeEmissive = (t: CanvasTexture) => (t as CanvasTexture & { emissiveMap?: CanvasTexture }).emissiveMap!

export function signTex(text: string, bg: string, fg: string, aspect: number, sub?: string) {
  return memo(`sign${text}${bg}${fg}${aspect}${sub}`, () => {
    const W = 1024, H = Math.round(W / aspect)
    return make(W, H, 1, (g) => {
      g.fillStyle = bg; g.fillRect(0, 0, W, H)
      g.strokeStyle = fg; g.globalAlpha = 0.55; g.lineWidth = Math.max(6, H * 0.04)
      g.strokeRect(g.lineWidth, g.lineWidth, W - g.lineWidth * 2, H - g.lineWidth * 2); g.globalAlpha = 1
      g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'
      let fs = H * (sub ? 0.5 : 0.6)
      const lines = aspect < 1.6 ? text.split(' ') : [text]
      if (lines.length > 1) fs = Math.min(H / (lines.length + 0.6), W * 0.3)
      g.font = `800 ${fs}px "Segoe UI", Arial, sans-serif`
      while (g.measureText(lines.reduce((a, b) => (a.length > b.length ? a : b))).width > W * 0.86 && fs > 12) { fs -= 4; g.font = `800 ${fs}px "Segoe UI", Arial, sans-serif` }
      const y0 = sub ? H * 0.4 : H / 2
      lines.forEach((l, i) => g.fillText(l, W / 2, y0 + (i - (lines.length - 1) / 2) * fs * 1.05))
      if (sub) { g.font = `600 ${H * 0.2}px "Segoe UI", Arial, sans-serif`; g.fillText(sub, W / 2, H * 0.78) }
    }, false)
  })
}

export function cloudTex() {
  return memo('cloud', () => make(256, 128, 5, (g, _s, r) => {
    for (let i = 0; i < 26; i++) {
      const x = 40 + r() * 176, y = 50 + r() * 40, rad = 18 + r() * 26
      const gr = g.createRadialGradient(x, y, 0, x, y, rad)
      gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)')
      g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2)
    }
  }, false))
}

const cloneCache = new Map<string, Texture>()
export function tiled(t: Texture, rx: number, ry: number): Texture {
  const key = `${t.uuid}:${rx.toFixed(2)}:${ry.toFixed(2)}`
  let c = cloneCache.get(key)
  if (!c) { c = t.clone(); c.repeat.set(rx, ry); c.needsUpdate = true; cloneCache.set(key, c) }
  return c
}
