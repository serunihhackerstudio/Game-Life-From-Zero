// Pustaka sprite 2D bergaya vektor untuk mini-game: motor, mobil, orang, peti, makanan, dll.
// Semua digambar lewat Canvas 2D (tanpa file gambar).
import { rr, type G } from './draw'

const hex = (c: string) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255] }
const cl = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
export const shade = (c: string, f: number) => { const [r, g, b] = hex(c); return `rgb(${cl(r * f)},${cl(g * f)},${cl(b * f)})` }
export const mix = (a: string, b: string, t: number) => { const x = hex(a), y = hex(b); return `rgb(${cl(x[0] + (y[0] - x[0]) * t)},${cl(x[1] + (y[1] - x[1]) * t)},${cl(x[2] + (y[2] - x[2]) * t)})` }
const T = (g: G, x: number, y: number, s: number, rot = 0, fn: () => void) => { g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); fn(); g.restore() }
const ell = (g: G, x: number, y: number, rx: number, ry: number, fill: string) => { g.fillStyle = fill; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill() }
const line = (g: G, x1: number, y1: number, x2: number, y2: number, w: number, c: string, cap: CanvasLineCap = 'round') => { g.strokeStyle = c; g.lineWidth = w; g.lineCap = cap; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke() }

// ------------------------------------------------------------------ MOTOR (tampak atas; hadap ke atas = -y)
export interface BikeOpts { color: string; rot?: number; rider?: string | null; helmet?: string; passenger?: string | null; passHelmet?: string; brake?: boolean; shadow?: boolean }
/** Motor roda dua tampak atas: roda depan-belakang, fork, tangki, jok, knalpot, stang, spion, lampu; opsional pengendara & penumpang. */
export function bikeTop(g: G, x: number, y: number, s: number, o: BikeOpts) {
  const col = o.color
  T(g, x, y, s, o.rot ?? 0, () => {
    if (o.shadow !== false) { g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(5, 5, 16, 44, 0, 0, 7); g.fill() }
    const wheel = (cy: number) => { g.fillStyle = '#121212'; rr(g, -4.5, cy - 12, 9, 24, 4.5); g.fill(); g.fillStyle = '#3a3a3a'; for (let i = -9; i <= 9; i += 4.5) g.fillRect(-4.5, cy + i, 9, 1); g.fillStyle = '#8d9299'; rr(g, -1.6, cy - 6, 3.2, 12, 1.6); g.fill() }
    wheel(-31); wheel(30)
    g.fillStyle = shade(col, 0.82); rr(g, -6.5, -40, 13, 19, 6.5); g.fill()           // spakbor depan
    g.fillStyle = 'rgba(255,255,255,.25)'; rr(g, -3, -38, 2.5, 12, 1.2); g.fill()
    line(g, -3.4, -26, -3.4, -8, 2.6, '#9ba1a8'); line(g, 3.4, -26, 3.4, -8, 2.6, '#9ba1a8') // fork
    g.fillStyle = shade(col, 0.78); rr(g, -11, -4, 22, 30, 9); g.fill()                // body samping
    g.fillStyle = shade(col, 0.95); rr(g, -8.5, -26, 17, 13, 6); g.fill()              // cowl lampu
    ell(g, 0, -29, 4.4, 2.6, '#fff6bd'); ell(g, 0, -29, 2.2, 1.3, '#ffffff')
    const gr = g.createLinearGradient(-10, 0, 10, 0); gr.addColorStop(0, shade(col, 0.82)); gr.addColorStop(0.45, shade(col, 1.25)); gr.addColorStop(1, shade(col, 0.85))
    g.fillStyle = gr; g.beginPath(); g.ellipse(0, -8, 11, 16, 0, 0, 7); g.fill()      // tangki
    ell(g, -3.5, -12, 2.4, 8, 'rgba(255,255,255,.38)')
    g.fillStyle = '#1b1b1d'; rr(g, -7.5, 4, 15, 26, 7.5); g.fill(); g.fillStyle = 'rgba(255,255,255,.1)'; rr(g, -5.5, 7, 4, 19, 2); g.fill() // jok
    g.fillStyle = col; rr(g, -9, 26, 18, 11, 5.5); g.fill()                          // ekor
    g.fillStyle = o.brake ? '#ff5252' : '#a8242a'; rr(g, -5.5, 36, 11, 3.4, 1.7); g.fill()
    if (o.brake) { g.fillStyle = 'rgba(255,60,60,.35)'; g.beginPath(); g.ellipse(0, 40, 12, 6, 0, 0, 7); g.fill() }
    g.fillStyle = '#c4c8ce'; rr(g, 9, 17, 4.5, 24, 2.2); g.fill(); g.fillStyle = '#6a6e75'; rr(g, 9, 37, 4.5, 4, 2); g.fill() // knalpot
    line(g, -15, -15, 15, -15, 3.2, '#24252a')                                         // stang
    ell(g, -15.5, -15, 2.7, 2.7, '#111'); ell(g, 15.5, -15, 2.7, 2.7, '#111')
    for (const sd of [-1, 1]) { line(g, sd * 13, -16, sd * 16, -25, 1.3, '#2a2b30'); ell(g, sd * 17, -27, 3.4, 2.3, '#9aa0a6'); ell(g, sd * 17, -27, 2, 1.3, '#cfe3f2') } // spion
    if (o.passenger) {
      const pc = o.passenger
      g.fillStyle = shade('#2c3e50', 1); rr(g, -12, 16, 6, 14, 3); g.fill(); rr(g, 6, 16, 6, 14, 3); g.fill()
      ell(g, 0, 21, 12.5, 8, pc); ell(g, 0, 19, 8, 5, shade(pc, 1.15))
      line(g, -10, 18, -8, 7, 4.2, pc); line(g, 10, 18, 8, 7, 4.2, pc)
      helmet(g, 0, 20, 6.5, o.passHelmet ?? '#f5f5f5')
    }
    if (o.rider) {
      const rc = o.rider
      g.fillStyle = '#2c3e50'; rr(g, -12, 3, 6.4, 18, 3.2); g.fill(); rr(g, 5.6, 3, 6.4, 18, 3.2); g.fill()
      ell(g, 0, 7, 12.5, 8.5, rc); ell(g, 0, 5, 8, 5, shade(rc, 1.18))
      line(g, -10, 4, -14.5, -13, 4.4, rc); line(g, 10, 4, 14.5, -13, 4.4, rc)
      ell(g, -15, -14.5, 2.4, 2.4, '#d9a47a'); ell(g, 15, -14.5, 2.4, 2.4, '#d9a47a')
      helmet(g, 0, 3, 7.4, o.helmet ?? '#f1c40f')
    }
  })
}
function helmet(g: G, x: number, y: number, r: number, c: string) {
  const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r); gr.addColorStop(0, shade(c, 1.35)); gr.addColorStop(1, shade(c, 0.78))
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill()
  g.fillStyle = '#22303c'; g.beginPath(); g.ellipse(x, y - r * 0.55, r * 0.72, r * 0.3, 0, 0, 7); g.fill()      // visor
  g.fillStyle = 'rgba(255,255,255,.28)'; g.beginPath(); g.ellipse(x - r * 0.3, y - r * 0.58, r * 0.22, r * 0.1, 0, 0, 7); g.fill()
  g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 1; g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke()
}

// ------------------------------------------------------------------ MOTOR (tampak samping, hadap kanan)
export function bikeSide(g: G, x: number, y: number, s: number, o: { color: string; flip?: boolean; rider?: string | null; helmet?: string }) {
  T(g, x, y, s, 0, () => {
    if (o.flip) g.scale(-1, 1)
    ell(g, 0, 22, 44, 4, 'rgba(0,0,0,.28)')
    const wheel = (cx: number) => {
      g.fillStyle = '#141414'; g.beginPath(); g.arc(cx, 10, 13, 0, 7); g.fill()
      g.strokeStyle = '#2b2b2b'; g.lineWidth = 2; g.beginPath(); g.arc(cx, 10, 10.5, 0, 7); g.stroke()
      g.fillStyle = '#c6cad0'; g.beginPath(); g.arc(cx, 10, 7, 0, 7); g.fill()
      g.strokeStyle = '#7d828a'; g.lineWidth = 1; for (let a = 0; a < 6; a++) { g.beginPath(); g.moveTo(cx, 10); g.lineTo(cx + Math.cos(a * 1.047) * 7, 10 + Math.sin(a * 1.047) * 7); g.stroke() }
      ell(g, cx, 10, 2, 2, '#444')
    }
    wheel(-27); wheel(27)
    g.fillStyle = shade(o.color, 0.85); g.beginPath(); g.moveTo(21, -4); g.quadraticCurveTo(34, -2, 34, 10); g.lineTo(24, 4); g.closePath(); g.fill() // spakbor depan
    line(g, 26, 0, 31, 10, 3, '#9ba1a8')                                                    // fork
    line(g, 26, 0, 30, -9, 2.6, '#26272b'); line(g, 27, -9, 34, -10, 3, '#26272b')         // stang
    g.fillStyle = '#fff6bd'; g.beginPath(); g.ellipse(33, -3, 3.4, 4.4, 0, 0, 7); g.fill()  // lampu
    g.fillStyle = o.color; g.beginPath(); g.moveTo(-26, 2); g.quadraticCurveTo(-24, -9, -10, -10); g.lineTo(10, -10); g.quadraticCurveTo(18, -8, 22, 2); g.lineTo(8, 12); g.lineTo(-18, 12); g.closePath(); g.fill() // body
    g.fillStyle = 'rgba(255,255,255,.28)'; g.beginPath(); g.ellipse(2, -6, 10, 2.4, 0, 0, 7); g.fill()
    g.fillStyle = shade(o.color, 0.72); g.beginPath(); g.moveTo(-6, 4); g.lineTo(14, 4); g.lineTo(8, 14); g.lineTo(-6, 14); g.closePath(); g.fill()  // mesin
    g.fillStyle = '#1d1d1f'; rr(g, -22, -14, 28, 7, 3.5); g.fill()                           // jok
    g.fillStyle = '#c4c8ce'; rr(g, -36, 6, 26, 5, 2.5); g.fill()                              // knalpot
    g.fillStyle = '#b3262a'; rr(g, -33, -8, 5, 4, 2); g.fill()
    if (o.rider) {
      const rc = o.rider
      g.fillStyle = '#2c3e50'; g.beginPath(); g.moveTo(-14, -12); g.lineTo(2, -12); g.lineTo(14, 6); g.lineTo(10, 10); g.lineTo(-2, 0); g.lineTo(-14, -2); g.closePath(); g.fill()
      g.fillStyle = '#e8e8e8'; rr(g, 8, 4, 12, 7, 3); g.fill()
      g.fillStyle = rc; g.beginPath(); g.moveTo(-17, -12); g.lineTo(-6, -35); g.lineTo(6, -33); g.lineTo(4, -12); g.closePath(); g.fill()
      line(g, 0, -28, 27, -10, 5, rc); ell(g, 28, -10, 3, 3, '#d9a47a')
      ell(g, -2, -42, 8, 8.4, '#d9a47a'); helmetSide(g, -2, -43, 9.4, o.helmet ?? '#f1c40f')
    }
  })
}
function helmetSide(g: G, x: number, y: number, r: number, c: string) {
  g.fillStyle = c; g.beginPath(); g.arc(x, y, r, Math.PI, 0); g.lineTo(x + r, y + 3); g.lineTo(x - r, y + 3); g.closePath(); g.fill()
  g.fillStyle = '#22303c'; rr(g, x + 1, y - 3, r - 1, 5, 2); g.fill()
  g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.ellipse(x - 3, y - 5, 4, 1.8, 0, 0, 7); g.fill()
}

// ------------------------------------------------------------------ MOBIL (tampak atas; hadap ke atas = -y)
export type CarKind = 'sedan' | 'hatch' | 'van' | 'pickup'
export interface CarOpts { color: string; kind?: CarKind; rot?: number; brake?: boolean; arm?: number; armSkin?: string; glass?: string }
export const CAR_LEN: Record<CarKind, number> = { sedan: 104, hatch: 90, van: 114, pickup: 112 }
export const CAR_WID = 48
/** Mobil tampak atas: bodi bergradasi, kap mesin, kaca depan/belakang, atap, spion, roda, lampu, grill, pelat. `arm` 0..1 = tangan pengemudi keluar jendela. */
export function carTop(g: G, x: number, y: number, s: number, o: CarOpts) {
  const kind = o.kind ?? 'sedan', L = CAR_LEN[kind], W = CAR_WID, col = o.color
  T(g, x, y, s, o.rot ?? 0, () => {
    g.fillStyle = 'rgba(0,0,0,.32)'; rr(g, -W / 2 + 4, -L / 2 + 6, W, L, 14); g.fill()
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) { g.fillStyle = '#101010'; rr(g, sx * (W / 2 - 1) - (sx > 0 ? 3 : 7), sy * (L / 2 - 20) - 9, 10, 19, 3); g.fill() } // roda menonjol
    const gr = g.createLinearGradient(-W / 2, 0, W / 2, 0); gr.addColorStop(0, shade(col, 0.78)); gr.addColorStop(0.3, shade(col, 1.12)); gr.addColorStop(0.7, shade(col, 1.0)); gr.addColorStop(1, shade(col, 0.72))
    g.fillStyle = gr; rr(g, -W / 2, -L / 2, W, L, 15); g.fill()
    g.strokeStyle = shade(col, 0.55); g.lineWidth = 1.5; rr(g, -W / 2, -L / 2, W, L, 15); g.stroke()
    // kap mesin
    const hoodEnd = kind === 'van' ? -L * 0.3 : -L * 0.12
    g.strokeStyle = 'rgba(0,0,0,.22)'; g.lineWidth = 1.2; rr(g, -W / 2 + 6, -L / 2 + 8, W - 12, hoodEnd + L / 2 - 14, 8); g.stroke()
    g.fillStyle = 'rgba(255,255,255,.14)'; rr(g, -W / 2 + 9, -L / 2 + 10, 8, hoodEnd + L / 2 - 20, 4); g.fill()
    // kaca depan
    const gl = o.glass ?? '#7fb0d4'
    const wsT = hoodEnd, wsB = wsT + L * 0.12
    const gg = g.createLinearGradient(0, wsT, 0, wsB); gg.addColorStop(0, shade(gl, 1.25)); gg.addColorStop(1, shade(gl, 0.65))
    g.fillStyle = gg; g.beginPath(); g.moveTo(-W / 2 + 4, wsB); g.lineTo(-W / 2 + 9, wsT); g.lineTo(W / 2 - 9, wsT); g.lineTo(W / 2 - 4, wsB); g.closePath(); g.fill()
    g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.moveTo(-W / 2 + 9, wsB - 2); g.lineTo(-W / 2 + 12, wsT + 1); g.lineTo(-W / 2 + 18, wsT + 1); g.lineTo(-W / 2 + 14, wsB - 2); g.closePath(); g.fill()
    // atap + kaca belakang
    const roofT = wsB, roofB = kind === 'van' ? L / 2 - 6 : kind === 'pickup' ? wsB + L * 0.12 : roofT + L * (kind === 'hatch' ? 0.34 : 0.26)
    g.fillStyle = shade(col, 1.08); rr(g, -W / 2 + 4, roofT, W - 8, roofB - roofT, 6); g.fill()
    g.fillStyle = 'rgba(255,255,255,.18)'; rr(g, -W / 2 + 10, roofT + 4, 9, roofB - roofT - 8, 4); g.fill()
    if (kind === 'van') { g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 1; for (let yy = roofT + 12; yy < roofB - 4; yy += 11) { g.beginPath(); g.moveTo(-W / 2 + 7, yy); g.lineTo(W / 2 - 7, yy); g.stroke() } }
    else if (kind === 'pickup') {
      g.fillStyle = gg; g.beginPath(); g.moveTo(-W / 2 + 6, roofB); g.lineTo(-W / 2 + 9, roofB + 7); g.lineTo(W / 2 - 9, roofB + 7); g.lineTo(W / 2 - 6, roofB); g.closePath(); g.fill()
      g.fillStyle = '#2a2d31'; rr(g, -W / 2 + 4, roofB + 10, W - 8, L / 2 - roofB - 14, 4); g.fill()
      g.strokeStyle = '#43474d'; g.lineWidth = 1.5; for (let yy = roofB + 16; yy < L / 2 - 8; yy += 7) { g.beginPath(); g.moveTo(-W / 2 + 6, yy); g.lineTo(W / 2 - 6, yy); g.stroke() }
    } else {
      const rwT = roofB, rwB = rwT + L * 0.1
      g.fillStyle = gg; g.beginPath(); g.moveTo(-W / 2 + 6, rwT); g.lineTo(W / 2 - 6, rwT); g.lineTo(W / 2 - 4, rwB); g.lineTo(-W / 2 + 4, rwB); g.closePath(); g.fill()
      g.strokeStyle = 'rgba(0,0,0,.2)'; g.lineWidth = 1.2; rr(g, -W / 2 + 6, rwB + 3, W - 12, L / 2 - rwB - 9, 7); g.stroke()
    }
    // pintu
    g.strokeStyle = 'rgba(0,0,0,.28)'; g.lineWidth = 1; for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * (W / 2 - 2), roofT + 2); g.lineTo(sx * (W / 2 - 2), roofB - 3); g.stroke() }
    // spion
    for (const sx of [-1, 1]) { g.fillStyle = shade(col, 0.9); g.beginPath(); g.ellipse(sx * (W / 2 + 3.5), wsT + 6, 4.5, 3, sx * 0.4, 0, 7); g.fill(); g.strokeStyle = shade(col, 0.5); g.lineWidth = 0.8; g.stroke() }
    // lampu depan + grill
    for (const sx of [-1, 1]) { g.fillStyle = 'rgba(255,248,200,.3)'; g.beginPath(); g.ellipse(sx * 15, -L / 2 - 1, 9, 5, 0, 0, 7); g.fill(); ell(g, sx * 15, -L / 2 + 4, 6.5, 3.4, '#fff7c9'); ell(g, sx * 15, -L / 2 + 4, 3.4, 1.8, '#ffffff') }
    g.fillStyle = '#1c1d20'; rr(g, -9, -L / 2 + 2, 18, 5, 2); g.fill(); g.fillStyle = '#8f949b'; g.fillRect(-7, -L / 2 + 4, 14, 1)
    // lampu belakang + pelat
    for (const sx of [-1, 1]) { g.fillStyle = o.brake ? '#ff4d4d' : '#b3262a'; rr(g, sx * 15 - 6, L / 2 - 6, 12, 4.5, 2); g.fill(); if (o.brake) { g.fillStyle = 'rgba(255,60,60,.35)'; g.beginPath(); g.ellipse(sx * 15, L / 2 + 1, 11, 6, 0, 0, 7); g.fill() } }
    g.fillStyle = '#f3f3f3'; rr(g, -8, L / 2 - 6, 16, 5, 1.5); g.fill(); g.fillStyle = '#3a3a3a'; g.fillRect(-6, L / 2 - 4.5, 12, 1.2)
    // tangan pengemudi keluar jendela (sisi kanan bodi)
    if (o.arm && o.arm > 0) {
      const a = o.arm, sy = roofT + 6, len = 6 + 16 * a
      line(g, W / 2 - 3, sy, W / 2 + len, sy - 3 * a, 6, o.armSkin ?? '#c68e64'); ell(g, W / 2 + len + 2, sy - 3 * a, 3.6, 3.2, o.armSkin ?? '#c68e64')
    }
  })
}

// ------------------------------------------------------------------ ORANG
export interface PersonTopOpts { shirt: string; skin?: string; hair?: string; rot?: number; arm?: number; item?: 'paper' | 'bill' | null; female?: boolean }
/** Orang tampak atas: bahu, kepala berambut, dua lengan. `arm` 0..1 = lengan kanan terulur ke depan (-y). */
export function personTop(g: G, x: number, y: number, s: number, o: PersonTopOpts) {
  const skin = o.skin ?? '#c68e64', hair = o.hair ?? '#1a1410', a = o.arm ?? 0
  T(g, x, y, s, o.rot ?? 0, () => {
    ell(g, 2, 3, 13, 9, 'rgba(0,0,0,.28)')
    line(g, -10, 0, -12, -9, 5, o.shirt); ell(g, -12.5, -10.5, 2.8, 2.8, skin)
    line(g, 10, 0, 11 + a * 4, -8 - a * 18, 5, o.shirt); ell(g, 11.5 + a * 4, -10 - a * 18, 2.9, 2.9, skin)
    g.fillStyle = o.shirt; rr(g, -12, -6, 24, 13, 6); g.fill(); g.fillStyle = 'rgba(255,255,255,.18)'; rr(g, -9, -4, 7, 8, 3); g.fill()
    ell(g, 0, 0, 6.8, 7, skin); g.fillStyle = hair; g.beginPath(); g.arc(0, 1.4, 7, 0.1 * Math.PI, 0.9 * Math.PI, false); g.arc(0, 0, 7, 0, Math.PI * 2); g.fill()
    ell(g, 0, -0.4, 6.4, 6.2, hair); ell(g, 0, -3.2, 4.4, 2.2, skin)
    if (o.female) { ell(g, 0, 5, 3.6, 2.6, hair) }
    if (o.item === 'paper') paper(g, 11.5 + a * 4, -14 - a * 18, 0.9, 0.5 * a)
    if (o.item === 'bill') bill(g, 11.5 + a * 4, -15 - a * 18, 0.9, 0.2)
  })
}

export interface FaceOpts { shirt: string; skin?: string; hair?: string; mood?: 'ok' | 'wait' | 'angry' | 'happy'; female?: boolean; scarf?: boolean; apron?: boolean }
/** Orang tampak depan (setengah badan) dengan wajah beremosi. (x,y) = titik tengah dada; ukuran s=1 ≈ 60 px tinggi. */
export function personFront(g: G, x: number, y: number, s: number, o: FaceOpts) {
  const skin = o.skin ?? '#d09a6e', hair = o.hair ?? '#1c1410'
  T(g, x, y, s, 0, () => {
    g.fillStyle = shade(o.shirt, 0.95); g.beginPath(); g.moveTo(-26, 30); g.quadraticCurveTo(-26, 0, -12, -2); g.lineTo(12, -2); g.quadraticCurveTo(26, 0, 26, 30); g.closePath(); g.fill()
    g.fillStyle = 'rgba(255,255,255,.14)'; g.beginPath(); g.ellipse(-10, 8, 6, 12, 0.3, 0, 7); g.fill()
    if (o.apron) { g.fillStyle = '#f4f0e6'; rr(g, -13, 6, 26, 24, 5); g.fill() }
    g.fillStyle = shade(skin, 0.92); rr(g, -5, -6, 10, 9, 3); g.fill()                          // leher
    ell(g, 0, -17, 14, 15.5, skin)                                                              // kepala
    ell(g, -14, -16, 3, 4.5, shade(skin, 0.9)); ell(g, 14, -16, 3, 4.5, shade(skin, 0.9))      // telinga
    g.fillStyle = hair; g.beginPath(); g.ellipse(0, -26, 15, 9, 0, Math.PI, 0); g.fill()        // rambut atas
    if (o.female) { g.beginPath(); g.ellipse(-14, -14, 4, 12, 0.12, 0, 7); g.fill(); g.beginPath(); g.ellipse(14, -14, 4, 12, -0.12, 0, 7); g.fill() }
    else { g.beginPath(); g.ellipse(-13.5, -22, 3.4, 6, 0.2, 0, 7); g.fill(); g.beginPath(); g.ellipse(13.5, -22, 3.4, 6, -0.2, 0, 7); g.fill() }
    const m = o.mood ?? 'ok'
    for (const sx of [-1, 1]) {                                                                 // mata & alis
      ell(g, sx * 5.4, -17, 2.6, 3, '#ffffff'); ell(g, sx * 5.4, -16.6, 1.5, 1.8, '#1a1410')
      line(g, sx * 8.6, m === 'angry' ? -23 : m === 'wait' ? -22.5 : -22, sx * 2.6, m === 'angry' ? -20.4 : m === 'wait' ? -22.8 : -22.6, 1.6, hair)
    }
    ell(g, 0, -12, 1.6, 1.2, shade(skin, 0.82))                                                // hidung
    g.strokeStyle = '#7a2d2d'; g.lineWidth = 1.8; g.lineCap = 'round'; g.beginPath()
    if (m === 'happy') { g.moveTo(-5, -8); g.quadraticCurveTo(0, -3, 5, -8) } else if (m === 'angry') { g.moveTo(-4.5, -6); g.quadraticCurveTo(0, -9.5, 4.5, -6) } else if (m === 'wait') { g.moveTo(-4, -7); g.lineTo(4, -7.4) } else { g.moveTo(-4, -7.4); g.quadraticCurveTo(0, -5.8, 4, -7.4) }
    g.stroke()
    if (m === 'angry') { g.fillStyle = 'rgba(231,76,60,.35)'; ell(g, -9, -10, 3.4, 2.2, 'rgba(231,76,60,.35)'); ell(g, 9, -10, 3.4, 2.2, 'rgba(231,76,60,.35)') }
    if (o.scarf) { g.fillStyle = '#c0392b'; rr(g, -9, -3, 18, 6, 3); g.fill() }
  })
}

// ------------------------------------------------------------------ BENDA
export function paper(g: G, x: number, y: number, s: number, rot = 0) {
  T(g, x, y, s, rot, () => {
    g.fillStyle = 'rgba(0,0,0,.25)'; rr(g, -7, -9, 16, 20, 1.5); g.fill()
    g.fillStyle = '#f2efe6'; rr(g, -8, -10, 16, 20, 1.5); g.fill(); g.strokeStyle = '#b9b4a6'; g.lineWidth = 0.8; rr(g, -8, -10, 16, 20, 1.5); g.stroke()
    g.fillStyle = '#26282c'; g.fillRect(-6, -8, 12, 3.6)
    g.fillStyle = '#8c887c'; for (let i = 0; i < 4; i++) g.fillRect(-6, -2 + i * 3, i < 2 ? 5 : 12, 1.2)
    g.fillStyle = '#6b6a66'; g.fillRect(1, -2, 5, 5)
  })
}
export function coin(g: G, x: number, y: number, r: number) {
  const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r); gr.addColorStop(0, '#fff3a8'); gr.addColorStop(1, '#d99a14')
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.strokeStyle = '#a8740a'; g.lineWidth = 1.2; g.beginPath(); g.arc(x, y, r * 0.72, 0, 7); g.stroke()
  g.fillStyle = '#a8740a'; g.font = `800 ${r * 1.1}px system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Rp', x, y + 0.5)
}
export function bill(g: G, x: number, y: number, s: number, rot = 0) {
  T(g, x, y, s, rot, () => {
    g.fillStyle = '#4fae6a'; rr(g, -13, -7, 26, 14, 2); g.fill(); g.strokeStyle = '#2e7d4a'; g.lineWidth = 1; rr(g, -13, -7, 26, 14, 2); g.stroke()
    ell(g, 0, 0, 4.6, 4.6, '#8fd4a1'); g.fillStyle = '#2e7d4a'; g.font = '800 7px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Rp', 0, 0.5)
    g.fillRect(-11, -5, 3, 2); g.fillRect(8, 3, 3, 2)
  })
}
export function parcel(g: G, x: number, y: number, s: number, rot = 0) {
  T(g, x, y, s, rot, () => {
    g.fillStyle = 'rgba(0,0,0,.28)'; rr(g, -13, -9, 28, 24, 2); g.fill()
    g.fillStyle = '#c99055'; rr(g, -14, -12, 28, 24, 2); g.fill()
    g.fillStyle = '#e0b277'; g.beginPath(); g.moveTo(-14, -12); g.lineTo(14, -12); g.lineTo(10, -17); g.lineTo(-10, -17); g.closePath(); g.fill()
    g.fillStyle = '#ead9a8'; g.fillRect(-3, -17, 6, 29); g.fillStyle = '#b9803f'; for (let i = 0; i < 3; i++) g.fillRect(-14, -4 + i * 5, 28, 0.8)
    g.fillStyle = '#fff'; rr(g, 4, 1, 8, 7, 1); g.fill(); g.fillStyle = '#555'; g.fillRect(5, 3, 6, 1); g.fillRect(5, 5, 4, 1)
  })
}

// ------------------------------------------------------------------ PETI & PALET (Sortir Peti)
export function crateSprite(g: G, cx: number, cy: number, sz: number, color: string, o: { label?: string; heavy?: boolean; hp?: number; hl?: boolean } = {}) {
  const w = sz, h = sz * 0.8, t = sz * 0.2, x = cx - w / 2, y = cy - h / 2 + t / 2
  g.fillStyle = 'rgba(0,0,0,.3)'; rr(g, x + 3, y + 4, w, h, 3); g.fill()
  g.fillStyle = shade(color, 1.28); g.beginPath(); g.moveTo(x + 3, y); g.lineTo(x + w - 3, y); g.lineTo(x + w - 7, y - t); g.lineTo(x + 7, y - t); g.closePath(); g.fill()
  g.strokeStyle = shade(color, 0.7); g.lineWidth = 1; g.stroke()
  const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, shade(color, 1.05)); gr.addColorStop(1, shade(color, 0.78))
  g.fillStyle = gr; rr(g, x, y, w, h, 3); g.fill(); g.strokeStyle = shade(color, 0.55); g.lineWidth = 1.5; rr(g, x, y, w, h, 3); g.stroke()
  g.strokeStyle = shade(color, 0.62); g.lineWidth = 1; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(x + 2, y + (h * i) / 4); g.lineTo(x + w - 2, y + (h * i) / 4); g.stroke() }
  g.fillStyle = shade(color, 0.7); g.fillRect(x, y, 5, h); g.fillRect(x + w - 5, y, 5, h)
  g.fillStyle = '#ecdcb4'; g.fillRect(cx - 4, y - t + 1, 8, t - 1); g.fillRect(cx - 4, y, 8, h)                  // lakban
  g.fillStyle = '#d6c496'; for (let i = 0; i < 5; i++) g.fillRect(cx - 4, y + 3 + i * (h / 5), 8, 1)
  if (o.label) { g.fillStyle = '#fff'; rr(g, x + 7, y + h * 0.28, 15, 15, 2); g.fill(); g.fillStyle = '#222'; g.font = '800 12px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(o.label, x + 14.5, y + h * 0.28 + 8) }
  if (o.heavy) { g.fillStyle = '#6f757c'; g.fillRect(x, y + h * 0.18, w, 4); g.fillRect(x, y + h * 0.7, w, 4); g.fillStyle = '#b4b9bf'; for (const sx of [x + 4, x + w - 4]) for (const yy of [y + h * 0.18 + 2, y + h * 0.7 + 2]) { g.beginPath(); g.arc(sx, yy, 1.2, 0, 7); g.fill() }
    g.fillStyle = '#f1c40f'; rr(g, x + w - 26, y + h * 0.3, 22, 11, 2); g.fill(); g.fillStyle = '#222'; g.font = '800 9px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText((o.hp ?? 2) > 1 ? 'BERAT×2' : 'BERAT×1', x + w - 15, y + h * 0.3 + 6) }
  if (o.hl) { g.strokeStyle = '#ffffff'; g.lineWidth = 3.5; rr(g, x - 2, y - t - 1, w + 4, h + t + 3, 5); g.stroke() }
}
export function palletBin(g: G, cx: number, baseY: number, w: number, color: string, n: string, on: 'ok' | 'bad' | null) {
  const x = cx - w / 2
  g.fillStyle = on === 'ok' ? '#ffffff' : on === 'bad' ? '#ff3838' : 'rgba(0,0,0,0)'; if (on) { g.globalAlpha = 0.35; rr(g, x - 4, baseY - 76, w + 8, 82, 10); g.fill(); g.globalAlpha = 1 }
  // palet kayu
  g.fillStyle = '#6a4a2a'; for (const dx of [0.04, 0.46, 0.88]) g.fillRect(x + w * dx, baseY - 8, w * 0.08, 8)
  g.fillStyle = '#a77a49'; rr(g, x, baseY - 14, w, 6, 1.5); g.fill(); g.fillStyle = '#8a6137'; for (let i = 1; i < 6; i++) g.fillRect(x + (w * i) / 6 - 1, baseY - 14, 1.5, 6)
  // tumpukan peti
  crateSprite(g, cx - w * 0.2, baseY - 28, w * 0.36, color); crateSprite(g, cx + w * 0.2, baseY - 28, w * 0.36, color); crateSprite(g, cx, baseY - 50, w * 0.36, color)
  // papan penanda
  g.fillStyle = '#3a3f47'; rr(g, cx - 3, baseY - 80, 6, 14, 2); g.fill()
  g.fillStyle = color; rr(g, cx - 27, baseY - 98, 54, 24, 5); g.fill(); g.strokeStyle = shade(color, 0.6); g.lineWidth = 2; rr(g, cx - 27, baseY - 98, 54, 24, 5); g.stroke()
  g.fillStyle = '#fff'; g.font = '800 17px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(n, cx, baseY - 86)
}

// ------------------------------------------------------------------ MAKANAN
export function dishPecel(g: G, x: number, y: number, r: number) {
  ell(g, x, y + r * 0.12, r * 1.02, r * 0.62, 'rgba(0,0,0,.22)')
  ell(g, x, y, r, r * 0.64, '#f7f7f4'); ell(g, x, y, r * 0.82, r * 0.5, '#e8e8e2'); ell(g, x, y, r * 0.74, r * 0.44, '#ffffff')
  ell(g, x - r * 0.28, y - r * 0.02, r * 0.34, r * 0.24, '#fbf7ea'); ell(g, x - r * 0.3, y - r * 0.08, r * 0.2, r * 0.1, '#ffffff')                // nasi
  for (const [dx, dy, c] of [[0.18, -0.2, '#4c9a3d'], [0.38, 0.0, '#5fb04a'], [0.1, 0.04, '#3d8a35'], [0.3, -0.12, '#7bc35e']] as const) ell(g, x + r * dx, y + r * dy, r * 0.16, r * 0.1, c) // sayur
  ell(g, x + r * 0.16, y + r * 0.12, r * 0.36, r * 0.18, '#8a5a2e'); ell(g, x + r * 0.12, y + r * 0.08, r * 0.2, r * 0.07, '#b07a42')                         // bumbu kacang
  ell(g, x - r * 0.05, y + r * 0.2, r * 0.18, r * 0.11, '#fff'); ell(g, x - r * 0.05, y + r * 0.2, r * 0.08, r * 0.05, '#f2b632')                              // telur
  ell(g, x + r * 0.5, y + r * 0.14, r * 0.1, r * 0.07, '#d65a2e')
}
export function dishTea(g: G, x: number, y: number, r: number) {
  ell(g, x, y + r * 0.78, r * 0.56, r * 0.14, 'rgba(0,0,0,.25)')
  g.fillStyle = 'rgba(220,240,250,.75)'; g.beginPath(); g.moveTo(x - r * 0.5, y - r * 0.7); g.lineTo(x + r * 0.5, y - r * 0.7); g.lineTo(x + r * 0.38, y + r * 0.74); g.lineTo(x - r * 0.38, y + r * 0.74); g.closePath(); g.fill()
  const tg = g.createLinearGradient(0, y - r * 0.5, 0, y + r * 0.74); tg.addColorStop(0, '#e0953a'); tg.addColorStop(1, '#9a5418')
  g.fillStyle = tg; g.beginPath(); g.moveTo(x - r * 0.46, y - r * 0.42); g.lineTo(x + r * 0.46, y - r * 0.42); g.lineTo(x + r * 0.37, y + r * 0.7); g.lineTo(x - r * 0.37, y + r * 0.7); g.closePath(); g.fill()
  for (const [dx, dy] of [[-0.2, -0.2], [0.14, -0.28], [0, 0.08], [-0.16, 0.3], [0.18, 0.18]] as const) { g.fillStyle = 'rgba(255,255,255,.55)'; rr(g, x + r * dx - r * 0.12, y + r * dy - r * 0.12, r * 0.24, r * 0.24, r * 0.05); g.fill() }
  g.fillStyle = 'rgba(255,255,255,.55)'; rr(g, x - r * 0.4, y - r * 0.6, r * 0.1, r * 1.2, r * 0.05); g.fill()
  line(g, x + r * 0.08, y - r * 0.98, x + r * 0.22, y + r * 0.1, r * 0.1, '#e74c3c'); line(g, x + r * 0.11, y - r * 0.72, x + r * 0.17, y - r * 0.4, r * 0.1, '#ffffff')
  g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1.2; g.beginPath(); g.ellipse(x, y - r * 0.7, r * 0.5, r * 0.1, 0, 0, 7); g.stroke()
}
export function dishFried(g: G, x: number, y: number, r: number) {
  ell(g, x, y + r * 0.14, r * 1.02, r * 0.6, 'rgba(0,0,0,.22)'); ell(g, x, y, r, r * 0.62, '#f7f7f4'); ell(g, x, y, r * 0.78, r * 0.44, '#ffffff')
  const tahu = (px: number, py: number) => { g.fillStyle = '#d99a3a'; rr(g, px - r * 0.2, py - r * 0.13, r * 0.4, r * 0.26, 3); g.fill(); g.fillStyle = '#f1c66a'; rr(g, px - r * 0.15, py - r * 0.09, r * 0.3, r * 0.15, 2); g.fill() }
  tahu(x - r * 0.38, y - r * 0.02); tahu(x - r * 0.05, y + r * 0.16)
  g.fillStyle = '#c98a2c'; g.beginPath(); g.moveTo(x + r * 0.08, y - r * 0.22); g.lineTo(x + r * 0.4, y - r * 0.02); g.lineTo(x + r * 0.1, y + r * 0.04); g.closePath(); g.fill()
  ell(g, x + r * 0.42, y + r * 0.14, r * 0.22, r * 0.15, '#b9741f'); for (let i = 0; i < 6; i++) ell(g, x + r * (0.32 + (i % 3) * 0.1), y + r * (0.08 + Math.floor(i / 3) * 0.08), r * 0.05, r * 0.04, '#e9b158')
  ell(g, x + r * 0.55, y - r * 0.12, r * 0.07, r * 0.04, '#d33'); ell(g, x - r * 0.52, y + r * 0.2, r * 0.07, r * 0.04, '#6ab04c')
}
export function dishIcon(g: G, i: number, x: number, y: number, r: number) { (i === 0 ? dishPecel : i === 1 ? dishTea : dishFried)(g, x, y, r) }

/** Bahan masakan (Wajan Panas): 0 nasi, 1 telur, 2 bawang, 3 cabai, 4 kecap. */
export function ingredient(g: G, i: number, x: number, y: number, r: number) {
  if (i === 0) { // mangkuk nasi
    g.fillStyle = '#2f6fa8'; g.beginPath(); g.ellipse(x, y + r * 0.1, r * 0.9, r * 0.3, 0, 0, Math.PI); g.lineTo(x + r * 0.55, y + r * 0.7); g.lineTo(x - r * 0.55, y + r * 0.7); g.closePath(); g.fill()
    ell(g, x, y + r * 0.08, r * 0.9, r * 0.3, '#dcecf8'); g.fillStyle = '#fbf8ee'; g.beginPath(); g.ellipse(x, y - r * 0.1, r * 0.72, r * 0.62, 0, Math.PI, 0); g.fill(); ell(g, x, y - r * 0.02, r * 0.72, r * 0.2, '#fbf8ee')
    for (const [dx, dy] of [[-0.3, -0.35], [0.1, -0.5], [0.32, -0.25], [-0.05, -0.2]] as const) ell(g, x + r * dx, y + r * dy, r * 0.08, r * 0.045, '#e6e0cd')
  } else if (i === 1) { // telur
    for (const [dx, dy, rt] of [[-0.3, 0.1, -0.3], [0.3, 0.12, 0.25]] as const) { g.save(); g.translate(x + r * dx, y + r * dy); g.rotate(rt); const gr = g.createRadialGradient(-r * 0.12, -r * 0.2, r * 0.05, 0, 0, r * 0.62); gr.addColorStop(0, '#fff3dc'); gr.addColorStop(1, '#d9a867'); g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, r * 0.4, r * 0.54, 0, 0, 7); g.fill(); g.restore() }
  } else if (i === 2) { // bawang merah
    const gr = g.createRadialGradient(x - r * 0.2, y - r * 0.15, r * 0.05, x, y, r * 0.75); gr.addColorStop(0, '#e9a6c4'); gr.addColorStop(1, '#a83e72')
    g.fillStyle = gr; g.beginPath(); g.ellipse(x, y + r * 0.15, r * 0.6, r * 0.55, 0, 0, 7); g.fill(); g.fillStyle = gr; g.beginPath(); g.moveTo(x - r * 0.2, y - r * 0.25); g.quadraticCurveTo(x, y - r * 0.8, x + r * 0.2, y - r * 0.25); g.fill()
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1.2; for (const k of [-0.3, 0, 0.3]) { g.beginPath(); g.moveTo(x + r * k * 0.4, y - r * 0.3); g.quadraticCurveTo(x + r * k, y + r * 0.15, x + r * k * 0.5, y + r * 0.62); g.stroke() }
    line(g, x, y + r * 0.7, x, y + r * 0.82, 1.5, '#7a5a3a')
  } else if (i === 3) { // cabai
    g.strokeStyle = '#c4231c'; g.lineWidth = r * 0.34; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - r * 0.5, y - r * 0.3); g.quadraticCurveTo(x + r * 0.5, y - r * 0.2, x + r * 0.35, y + r * 0.55); g.stroke()
    g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = r * 0.08; g.beginPath(); g.moveTo(x - r * 0.4, y - r * 0.38); g.quadraticCurveTo(x + r * 0.3, y - r * 0.34, x + r * 0.24, y + r * 0.2); g.stroke()
    line(g, x - r * 0.54, y - r * 0.3, x - r * 0.72, y - r * 0.46, r * 0.16, '#3d8a35')
  } else { // botol kecap
    g.fillStyle = '#2a1a12'; rr(g, x - r * 0.3, y - r * 0.2, r * 0.6, r * 0.9, r * 0.12); g.fill(); g.fillStyle = '#2a1a12'; rr(g, x - r * 0.14, y - r * 0.55, r * 0.28, r * 0.4, r * 0.06); g.fill()
    g.fillStyle = '#e74c3c'; rr(g, x - r * 0.16, y - r * 0.72, r * 0.32, r * 0.2, r * 0.05); g.fill()
    g.fillStyle = '#f2e3b3'; rr(g, x - r * 0.26, y + r * 0.05, r * 0.52, r * 0.36, r * 0.05); g.fill(); g.fillStyle = '#9a1f1f'; g.fillRect(x - r * 0.2, y + r * 0.15, r * 0.4, r * 0.06); g.fillRect(x - r * 0.2, y + r * 0.27, r * 0.28, r * 0.05)
    g.fillStyle = 'rgba(255,255,255,.22)'; rr(g, x - r * 0.24, y - r * 0.12, r * 0.08, r * 0.7, 3); g.fill()
  }
}

// ------------------------------------------------------------------ LAINNYA
export function trafficLight(g: G, x: number, y: number, red: boolean) {
  g.fillStyle = '#3d4249'; rr(g, x - 3, y, 6, 52, 2); g.fill()
  g.fillStyle = '#1b1d21'; rr(g, x - 11, y - 38, 22, 52, 6); g.fill(); g.strokeStyle = '#4a4f57'; g.lineWidth = 1.5; rr(g, x - 11, y - 38, 22, 52, 6); g.stroke()
  const lamp = (cy: number, on: boolean, c: string, dim: string) => { if (on) { g.fillStyle = c + '55'; g.beginPath(); g.arc(x, cy, 14, 0, 7); g.fill() } ell(g, x, cy, 6.4, 6.4, on ? c : dim); if (on) ell(g, x - 1.8, cy - 2, 2, 2, 'rgba(255,255,255,.6)') }
  lamp(y - 27, red, '#ff4a3d', '#4a1d1a'); lamp(y - 12, false, '#ffd23f', '#4a3d14'); lamp(y + 3, !red, '#3dff7a', '#134a26')
}
export function mapPin(g: G, x: number, y: number, n: string, state: 'idle' | 'chosen' | 'done', order?: number) {
  const c = state === 'done' ? '#2ecc71' : state === 'chosen' ? '#f1c40f' : '#e8573d'
  ell(g, x, y + 4, 8, 3, 'rgba(0,0,0,.35)')
  g.fillStyle = c; g.beginPath(); g.moveTo(x, y + 3); g.bezierCurveTo(x - 17, y - 12, x - 12, y - 28, x, y - 28); g.bezierCurveTo(x + 12, y - 28, x + 17, y - 12, x, y + 3); g.fill()
  g.strokeStyle = shade(c, 0.6); g.lineWidth = 1.5; g.stroke()
  ell(g, x, y - 15, 8.2, 8.2, '#ffffff'); g.fillStyle = '#222'; g.font = '800 11px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(state === 'done' ? '✓' : n, x, y - 14.5)
  if (order !== undefined) { ell(g, x + 12, y - 27, 7, 7, '#222'); g.fillStyle = '#ffeaa7'; g.font = '800 9px system-ui'; g.fillText('#' + (order + 1), x + 12, y - 27) }
}
export function warehouse(g: G, x: number, y: number, s: number) {
  T(g, x, y, s, 0, () => {
    g.fillStyle = 'rgba(0,0,0,.3)'; rr(g, -17, -11, 38, 28, 3); g.fill()
    g.fillStyle = '#e8e4da'; rr(g, -18, -12, 36, 26, 2); g.fill(); g.fillStyle = '#c0392b'; g.beginPath(); g.moveTo(-20, -11); g.lineTo(0, -22); g.lineTo(20, -11); g.closePath(); g.fill()
    g.fillStyle = '#5d6d7e'; rr(g, -9, -2, 18, 16, 1); g.fill(); g.strokeStyle = '#3a4650'; g.lineWidth = 1; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-9, 1 + i * 4); g.lineTo(9, 1 + i * 4); g.stroke() }
    g.fillStyle = '#fff'; g.font = '800 6px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('KILAT', 0, -7)
  })
}
