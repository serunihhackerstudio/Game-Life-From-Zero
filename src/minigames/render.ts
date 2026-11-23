// Penggambaran semua mini-game (Canvas 2D). Tiap fungsi menggambar satu frame dari keadaan simulasi.
import { H, W, rr, text, timeBar, type G } from './draw'
import { bikeSide, bikeTop, bill, carTop, CAR_LEN, coin, crateSprite, dishIcon, ingredient, mapPin, mix, palletBin, paper, parcel, personFront, personTop, shade, trafficLight, warehouse, type CarKind } from './sprites'
import type { SortSim } from './sort'
import type { LightSim } from './light'
import type { WokSim } from './wok'
import type { ParkSim } from './park'
import type { ServeSim } from './serve'
import type { RouteSim } from './route'
import type { RideSim } from './ride'
import { GRID, ROUNDS } from './route'
import { DISH_NAMES } from './serve'
import { RIDE } from './ride'
import { WokSim as WokClass } from './wok'
import { SortSim as SortClass } from './sort'

const ell = (g: G, x: number, y: number, rx: number, ry: number, fill: string) => { g.fillStyle = fill; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill() }
const line = (g: G, x1: number, y1: number, x2: number, y2: number, w: number, c: string) => { g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke() }
const hash = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }
const easeOut = (x: number) => 1 - (1 - Math.min(1, Math.max(0, x))) ** 3
const SORT_COL = ['#d64541', '#2f86c9', '#2fb36a']

// ================================================================= SORTIR PETI
export function drawSort(g: G, s: SortSim, t: number) {
  const wall = g.createLinearGradient(0, 0, 0, 236); wall.addColorStop(0, '#3a4550'); wall.addColorStop(1, '#27303a'); g.fillStyle = wall; g.fillRect(0, 0, W, 236)
  g.strokeStyle = 'rgba(255,255,255,.05)'; g.lineWidth = 1; for (let x = 0; x < W; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 236); g.stroke() }
  for (let y = 60; y < 236; y += 44) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke() }
  const fl = g.createLinearGradient(0, 236, 0, H); fl.addColorStop(0, '#6a727b'); fl.addColorStop(1, '#4a5058'); g.fillStyle = fl; g.fillRect(0, 236, W, H - 236)
  g.fillStyle = '#e8c53a'; for (let x = 0; x < W; x += 40) { g.beginPath(); g.moveTo(x, 236); g.lineTo(x + 20, 236); g.lineTo(x + 14, 242); g.lineTo(x - 6, 242); g.fill() }
  timeBar(g, s.timeLeft, s.total)
  text(g, `Benar ${s.correct}`, 16, 42, 15, '#9be59b'); text(g, `Kombo ${s.combo}`, W / 2, 42, 15, s.combo >= 5 ? '#ffd32a' : '#cfd8dc', 'center'); text(g, `Salah ${s.wrong}  ·  Lolos ${s.lost}`, W - 16, 42, 15, '#ff9f9f', 'right')
  // ban berjalan: rangka baja, sabuk karet bergerak, rol
  const by = 98, bh = 66
  g.fillStyle = '#2a2d33'; for (let x = 24; x < W; x += 110) g.fillRect(x, by + bh, 9, 74)
  g.fillStyle = '#9aa2ab'; rr(g, 0, by - 6, W, 8, 2); g.fill(); rr(g, 0, by + bh - 2, W, 10, 2); g.fill()
  g.fillStyle = '#3b3f46'; g.fillRect(0, by + 2, W, bh - 4)
  const off = (s.progress * 900 + t * 40) % 28
  g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 2; for (let x = -28 + off; x < W; x += 28) { g.beginPath(); g.moveTo(x, by + 4); g.lineTo(x + 10, by + bh / 2); g.lineTo(x, by + bh - 4); g.stroke() }
  for (let x = 12 + (off % 28); x < W; x += 28) { ell(g, x, by + bh + 3, 4, 4, '#cfd4da'); ell(g, x, by + bh + 3, 1.6, 1.6, '#555') }
  // lampu peringatan di batas
  const pulse = 0.5 + 0.5 * Math.sin(t * 9)
  g.fillStyle = '#d6d9de'; rr(g, W - 28, by - 22, 18, 10, 3); g.fill(); g.fillStyle = `rgba(255,70,60,${0.6 + 0.4 * pulse})`; g.beginPath(); g.arc(W - 19, by - 24, 8, Math.PI, 0); g.fill(); g.fillStyle = `rgba(255,70,60,${0.18 * pulse})`; g.beginPath(); g.arc(W - 19, by - 24, 20, 0, 7); g.fill()
  text(g, 'BATAS ▶', W - 38, by - 14, 11, '#ff7b6b', 'right')
  // peti
  const bx = (b: { x: number }) => 40 + (b.x * (W - 100)) / SortClass.LENGTH
  const front = s.boxes.filter((b) => b.state === 'belt').sort((a, b) => b.x - a.x)[0]
  const binX = [W * 0.2, W * 0.5, W * 0.8]
  for (const b of s.boxes) {
    let x = bx(b), y = by + bh / 2 - 4, sz = 46, a = 1
    if (b.state === 'sorted') { const k = Math.min(1, b.t / 0.5); const tx = binX[b.color]; x += (tx - x) * k; y += (292 - y) * k * k; sz = 46 - 14 * k; a = 1 - 0.3 * k }
    if (b.state === 'lost') { const k = Math.min(1, b.t / 0.5); y += k * k * 90; a = 1 - k; x += k * 20 }
    g.globalAlpha = a; crateSprite(g, x, y, sz, SORT_COL[b.color], { label: String(b.color + 1), heavy: b.heavy, hp: b.hp, hl: b === front && b.state === 'belt' }); g.globalAlpha = 1
  }
  // palet tujuan
  const lab = ['1 ←', '2 ↓', '3 →']
  for (let i = 0; i < 3; i++) palletBin(g, binX[i], 342, 126, SORT_COL[i], lab[i], s.flash && s.flash.color === i ? (s.flash.ok ? 'ok' : 'bad') : null)
}
void WokClass

// ================================================================= LAMPU MERAH
const vend = { y: -1 }
const CAR_COL = ['#d9622b', '#7d4fb0', '#17a085', '#c0392b', '#2d7fc1', '#e0b020', '#4a5560', '#dfe4e8']
const KINDS: CarKind[] = ['sedan', 'hatch', 'van', 'pickup']
export function drawLight(g: G, s: LightSim, t: number) {
  const top = 52, laneH = (H - top - 28) / s.lanes, now = s.now
  const shake = s.shake > 0 ? Math.sin(t * 90) * 2.5 : 0
  // trotoar kiri + aspal
  g.fillStyle = '#9a9a94'; g.fillRect(0, 0, W, H)
  g.fillStyle = '#b9b6ac'; g.fillRect(0, top, 58, laneH * s.lanes)
  g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = 1; for (let y = top; y < top + laneH * s.lanes; y += 22) { g.beginPath(); g.moveTo(0, y); g.lineTo(58, y); g.stroke() }
  g.fillStyle = '#d6d3c8'; g.fillRect(52, top, 6, laneH * s.lanes)
  const rd = g.createLinearGradient(0, top, 0, top + laneH * s.lanes); rd.addColorStop(0, '#41454c'); rd.addColorStop(1, '#383c42'); g.fillStyle = rd; g.fillRect(58, top, W - 58, laneH * s.lanes)
  for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(255,255,255,${0.02 + hash(i) * 0.04})`; g.fillRect(58 + hash(i + 9) * (W - 58), top + hash(i + 3) * laneH * s.lanes, 2 + hash(i + 5) * 5, 1) }
  g.fillStyle = '#e8e6dc'; for (let l = 1; l < s.lanes; l++) for (let x = 70; x < W; x += 40) g.fillRect(x, top + l * laneH - 1.5, 22, 3)
  g.fillStyle = '#f4f1e6'; g.fillRect(58, top, W - 58, 3); g.fillRect(58, top + laneH * s.lanes - 3, W - 58, 3)
  const stopX = 360, stopLine = stopX - CAR_LEN.sedan / 2 * 0.86 - 8
  g.fillStyle = 'rgba(255,255,255,.85)'; for (let y = top + 4; y < top + laneH * s.lanes - 6; y += 13) g.fillRect(stopLine - 40, y, 40, 8)  // zebra
  g.fillStyle = s.isRed ? '#ff5252' : '#6fe39a'; g.fillRect(stopLine + 2, top, 4, laneH * s.lanes)
  timeBar(g, s.timeLeft, s.total)
  trafficLight(g, 30, 64, s.isRed)
  // mobil
  const sc = Math.min(1, (laneH * 0.78) / 48)
  type Fly = { x: number; y: number; r: number; a: number; w: boolean }
  const flies: Fly[] = []; const pops: { x: number; y: number; k: number }[] = []
  const cars = [...s.cars].filter((c) => c.cycle === s.cycleNo && now >= c.arrive - 1.0)
  for (const c of cars) {
    const cy = top + c.lane * laneH + laneH / 2
    let x = stopX
    if (now < c.arrive) { const k = (now - (c.arrive - 1.0)) / 1.0; x = W + 100 + (stopX - W - 100) * easeOut(k) }
    else if (!s.isRed) x = stopX - Math.min(1, (s.phaseT - s.RED) / 1.4) ** 2 * (stopX + 190)
    const kind = KINDS[(c.lane * 3 + c.cycle) % 4], col = CAR_COL[(c.lane * 2 + c.cycle * 3) % CAR_COL.length]
    const open = s.isOpen(c) && !c.sold
    const sinceSold = c.sold ? now - c.soldAt : -1
    // tangan pengemudi: keluar saat jendela terbuka, masuk setelah lemparan mendarat
    const armT = open ? Math.min(1, (now - c.openAt) / 0.18) : c.sold && sinceSold < 0.7 ? Math.max(0, 1 - Math.max(0, sinceSold - 0.45) / 0.2) : 0
    carTop(g, x, cy, sc, { color: col, kind, rot: -Math.PI / 2, brake: s.isRed || now < c.arrive, arm: armT, glass: open ? '#cdeaf7' : undefined })
    const winX = x + 6 * sc, winY = cy - (24 + 6) * sc
    if (open) { // sorot jendela yang bisa dijual
      g.strokeStyle = `rgba(255,236,80,${0.55 + 0.45 * Math.sin(t * 14)})`; g.lineWidth = 3; g.beginPath(); g.ellipse(winX, cy - 10 * sc, 17 * sc, 22 * sc, 0, 0, 7); g.stroke()
      bill(g, winX + 2, winY - 12 * sc * armT, 0.8, 0.3)
    }
    // lempar koran: busur dari tangan penjual ke jendela
    if (c.sold && sinceSold >= 0 && sinceSold < 0.95) {
      const k = Math.min(1, sinceSold / 0.45), vx = stopLine - 56
      if (k < 1) { const px = vx + 18 + (winX - vx - 18) * k, py = cy - 12 + (winY - cy + 12) * k - Math.sin(k * Math.PI) * 30; flies.push({ x: px, y: py, r: k * 9, a: 1, w: false }) }
      else pops.push({ x: winX, y: winY, k: (sinceSold - 0.45) / 0.5 })
    }
    if (c.wasted && c.wastedAt >= 0 && now - c.wastedAt < 0.7) { // lemparan sia-sia: memantul jatuh
      const k = (now - c.wastedAt) / 0.7, vx = stopLine - 56
      const fx = k < 0.5 ? vx + 18 + (winX - vx - 18) * (k / 0.5) : winX - (k - 0.5) * 70, fy = k < 0.5 ? cy - 12 + (winY - cy + 12) * (k / 0.5) - Math.sin((k / 0.5) * Math.PI) * 22 : winY + (k - 0.5) * 90
      flies.push({ x: fx, y: fy, r: k * 14, a: 1 - Math.max(0, k - 0.6) / 0.4, w: true })
    }
  }
  // penjual koran (animasi mendekat ke lajur terpilih)
  const targetY = top + s.cursor * laneH + laneH / 2
  vend.y = vend.y < 0 ? targetY : vend.y + (targetY - vend.y) * 0.3
  const lastThrow = s.cars.reduce((m, c) => Math.max(m, c.soldAt, c.wastedAt), -9)
  const throwK = Math.max(0, 1 - (now - lastThrow) / 0.35)
  const vxp = stopLine - 56 + shake
  personTop(g, vxp, vend.y, Math.min(1.7, laneH / 42), { shirt: '#e8c23a', skin: '#c68e64', hair: '#1a1410', rot: Math.PI / 2, arm: throwK, item: throwK < 0.1 ? 'paper' : null })
  g.fillStyle = '#efe9d8'; rr(g, vxp - 32, vend.y - 6, 14, 20, 2); g.fill(); g.fillStyle = '#26282c'; g.fillRect(vxp - 31, vend.y - 3, 12, 3); g.fillStyle = '#9a958a'; g.fillRect(vxp - 31, vend.y + 3, 9, 1.4); g.fillRect(vxp - 31, vend.y + 7, 12, 1.4)   // tumpukan koran di bawah lengan
  for (const f of flies) { g.globalAlpha = f.a; paper(g, f.x, f.y, 0.85, f.r); g.globalAlpha = 1 }
  for (const p of pops) { const k = Math.min(1, Math.max(0, p.k)); g.globalAlpha = 1 - k * k; coin(g, p.x, p.y - 8 - k * 26, 8); text(g, '+', p.x + 14, p.y - 12 - k * 26, 13, '#fff7c2', 'left', '800'); g.globalAlpha = 1 }
  // penanda lajur di trotoar
  for (let l = 0; l < s.lanes; l++) { const cy = top + l * laneH + laneH / 2, on = l === s.cursor; g.fillStyle = on ? '#ffd23f' : 'rgba(0,0,0,.2)'; g.beginPath(); g.moveTo(10, cy - 9); g.lineTo(34, cy); g.lineTo(10, cy + 9); g.closePath(); g.fill() }
  g.fillStyle = 'rgba(10,14,20,.8)'; g.fillRect(0, H - 26, W, 26)
  text(g, `Terjual ${s.sold}`, 14, H - 13, 14, '#fff'); text(g, `Sia-sia ${s.wasted}`, W - 14, H - 13, 14, '#ffb4b4', 'right')
  text(g, '↑↓ pilih lajur · Spasi lempar koran saat jendela menyala kuning', W / 2, H - 13, 11.5, 'rgba(255,255,255,.8)', 'center', '500')
}

// ================================================================= WAJAN PANAS
export function drawWok(g: G, s: WokSim, t: number) {
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#2a1c14'); bg.addColorStop(1, '#4b2e1b'); g.fillStyle = bg; g.fillRect(0, 0, W, H)
  g.fillStyle = 'rgba(255,255,255,.04)'; for (let x = 0; x < W; x += 36) g.fillRect(x, 0, 2, 150)
  // lampu gantung
  line(g, 560, 0, 560, 70, 2, '#222'); ell(g, 560, 76, 9, 9, '#ffe9a8'); g.fillStyle = 'rgba(255,225,150,.13)'; g.beginPath(); g.arc(560, 78, 64, 0, 7); g.fill()
  timeBar(g, s.timeLeft, s.total)
  text(g, `Piring ${Math.min(WokClass.PLATES, s.plateScores.length + (s.phase === 'serve' ? 0 : 1))}/${WokClass.PLATES}`, 16, 42, 15, '#ffd9a0')
  // pesanan
  const n = s.recipe.length, x0 = W / 2 - (n * 54) / 2
  text(g, 'PESANAN', W / 2, 38, 11, 'rgba(255,255,255,.6)', 'center')
  for (let i = 0; i < n; i++) {
    const done = i < s.step_ || s.phase !== 'add', cur = s.phase === 'add' && i === s.step_
    g.fillStyle = done ? '#2c9a5a' : cur ? '#f5c518' : 'rgba(255,255,255,.16)'; rr(g, x0 + i * 54, 48, 46, 46, 10); g.fill()
    if (cur) { g.strokeStyle = '#fff3a0'; g.lineWidth = 2; g.globalAlpha = 0.5 + 0.5 * Math.sin(t * 8); rr(g, x0 + i * 54 - 2, 46, 50, 50, 12); g.stroke(); g.globalAlpha = 1 }
    ingredient(g, s.recipe[i], x0 + i * 54 + 23, 71, 16)
  }
  const sh = s.shake > 0 ? Math.sin(t * 90) * 3 : 0, cx = W / 2 + sh, cy = 212
  // kompor + api
  g.fillStyle = '#34363b'; rr(g, cx - 96, cy + 52, 192, 22, 6); g.fill(); g.fillStyle = '#1d1e21'; rr(g, cx - 84, cy + 56, 168, 14, 4); g.fill()
  for (let i = 0; i < 7; i++) { const fx = cx - 66 + i * 22, fh = 14 + 10 * Math.abs(Math.sin(t * 11 + i * 1.7)); g.fillStyle = 'rgba(255,170,40,.9)'; g.beginPath(); g.moveTo(fx - 7, cy + 54); g.quadraticCurveTo(fx, cy + 54 - fh * 1.9, fx + 7, cy + 54); g.fill(); g.fillStyle = 'rgba(70,150,255,.9)'; g.beginPath(); g.moveTo(fx - 4, cy + 54); g.quadraticCurveTo(fx, cy + 54 - fh * 0.8, fx + 4, cy + 54); g.fill() }
  // gagang wajan
  line(g, cx + 108, cy + 14, cx + 176, cy - 4, 10, '#5a3a22'); line(g, cx + 108, cy + 14, cx + 134, cy + 8, 7, '#2a2a2a'); line(g, cx - 108, cy + 14, cx - 124, cy + 10, 7, '#2a2a2a')
  // badan wajan (besi cekung)
  const body = g.createLinearGradient(0, cy, 0, cy + 60); body.addColorStop(0, '#2b2b2e'); body.addColorStop(1, '#101012')
  g.fillStyle = body; g.beginPath(); g.ellipse(cx, cy + 14, 112, 30, 0, 0, Math.PI); g.lineTo(cx + 60, cy + 56); g.lineTo(cx - 60, cy + 56); g.closePath(); g.fill()
  ell(g, cx, cy + 14, 112, 30, '#58595e'); ell(g, cx, cy + 16, 104, 25, '#1a1a1c'); ell(g, cx, cy + 20, 100, 21, '#242426')
  g.fillStyle = 'rgba(255,255,255,.16)'; g.beginPath(); g.ellipse(cx - 40, cy - 8, 40, 3, -0.1, 0, 7); g.fill()
  // isi wajan
  const tossed = s.flipFlash > 0 ? 1 - s.flipFlash / 0.35 : -1
  const food = s.phase === 'add' ? 0 : s.phase === 'stir' ? 0.6 + 0.4 * Math.min(1, s.stirCount / s.stirNeed) : 1
  const fcol = s.phase === 'add' ? '#e8d5a0' : mix('#efe2b0', '#d28b2e', food)
  if (s.step_ > 0 || s.phase !== 'add') {
    const gr = g.createRadialGradient(cx - 20, cy + 10, 5, cx, cy + 18, 90); gr.addColorStop(0, shade(fcol.startsWith('#') ? fcol : '#e9c36b', 1.1)); gr.addColorStop(1, '#a8651d')
    g.fillStyle = s.phase === 'add' ? '#e9d9a8' : gr; g.beginPath(); g.ellipse(cx, cy + 18, 20 + (s.phase === 'add' ? s.step_ * 22 : 74), 6 + (s.phase === 'add' ? s.step_ * 3 : 15), 0, 0, 7); g.fill()
    for (let i = 0; i < (s.phase === 'add' ? s.step_ * 6 : 26); i++) ell(g, cx + (hash(i) - 0.5) * (s.phase === 'add' ? 40 + s.step_ * 36 : 120), cy + 14 + (hash(i + 7) - 0.5) * 18, 2.3, 1.5, i % 4 === 0 ? '#f2b632' : i % 5 === 0 ? '#c4231c' : '#fbf6e4')
    if (s.phase === 'add') for (let i = 0; i < s.step_; i++) ingredient(g, s.recipe[i], cx - 60 + i * 30, cy + 6, 11)
  }
  if (s.phase === 'stir') { // sutil: aduk bergantian A/D
    const dir = s.lastStir === 'A' ? -1 : 1, a = Math.sin(t * 9) * 0.3
    g.save(); g.translate(cx + dir * 30, cy + 6); g.rotate(dir * 0.5 + a); line(g, 0, 0, 40, -64, 6, '#8a5a35'); g.fillStyle = '#a9743f'; rr(g, -10, -8, 24, 12, 3); g.fill(); g.restore()
  }
  if (tossed >= 0) for (let i = 0; i < 14; i++) { const k = tossed, px = cx + (hash(i) - 0.5) * 120, py = cy + 8 - Math.sin(k * Math.PI) * (50 + hash(i + 2) * 60); ell(g, px, py, 3, 2, i % 3 === 0 ? '#f2b632' : '#fbf6e4') }
  if (s.phase !== 'add') for (let i = 0; i < 5; i++) { const u = (t * 0.5 + i * 0.21) % 1; g.fillStyle = `rgba(255,255,255,${0.35 * (1 - u)})`; g.beginPath(); g.arc(cx - 50 + i * 26 + Math.sin(t * 3 + i) * 6, cy - 6 - u * 60, 6 + u * 10, 0, 7); g.fill() }
  const py = 322
  if (s.phase === 'add') {
    text(g, 'Tekan angka sesuai bahan yang menyala kuning', W / 2, 126, 12.5, 'rgba(255,255,255,.85)', 'center', '500')
    for (let i = 0; i < 5; i++) { const need = s.recipe[s.step_] === i; g.fillStyle = need ? 'rgba(255,225,90,.35)' : 'rgba(255,255,255,.12)'; rr(g, W / 2 - 160 + i * 66, py - 28, 58, 56, 10); g.fill(); if (need) { g.strokeStyle = '#ffe36a'; g.lineWidth = 2; rr(g, W / 2 - 160 + i * 66, py - 28, 58, 56, 10); g.stroke() } ingredient(g, i, W / 2 - 131 + i * 66, py - 6, 15); text(g, `${i + 1}`, W / 2 - 131 + i * 66, py + 21, 11, '#ffd9a0', 'center', '800') }
  } else if (s.phase === 'stir') {
    const f = Math.min(1, s.stirCount / s.stirNeed), nextA = s.lastStir !== 'A'
    text(g, 'ADUK! Tekan A dan D bergantian', W / 2, 126, 13.5, '#ffd9a0', 'center', '700')
    g.fillStyle = 'rgba(255,255,255,.15)'; rr(g, W / 2 - 150, py + 6, 300, 16, 8); g.fill(); g.fillStyle = '#4cd137'; rr(g, W / 2 - 150, py + 6, 300 * f, 16, 8); g.fill()
    for (const [k, x] of [['A', W / 2 - 70], ['D', W / 2 + 70]] as const) { const on = (k === 'A') === nextA; g.fillStyle = on ? '#f5c518' : 'rgba(255,255,255,.16)'; rr(g, x - 24, py - 36, 48, 38, 9); g.fill(); text(g, k, x, py - 17, 22, on ? '#222' : '#fff', 'center', '800') }
    g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(W / 2 - 150, py + 28, 300 * (1 - s.stirT / s.stirLimit), 3)
  } else if (s.phase === 'flip') {
    text(g, 'BALIK! Spasi saat penanda di zona hijau', W / 2, 126, 13.5, '#ffd9a0', 'center', '700')
    const bx = W / 2 - 200, bw = 400
    g.fillStyle = 'rgba(255,255,255,.15)'; rr(g, bx, py - 6, bw, 26, 13); g.fill()
    g.fillStyle = '#2ecc71'; rr(g, bx + bw * (0.5 - s.zone / 2), py - 6, bw * s.zone, 26, 13); g.fill()
    g.fillStyle = s.flipFlash > 0 ? '#ffffff' : '#ff6b6b'; rr(g, bx + bw * s.marker - 5, py - 14, 10, 42, 5); g.fill()
  } else {
    // piring saji: nasi goreng, telur ceplok, mentimun-tomat, kerupuk
    const l = s.last, px = W / 2, pyy = 312
    ell(g, px, pyy + 10, 74, 22, 'rgba(0,0,0,.3)'); ell(g, px, pyy, 72, 24, '#f7f7f4'); ell(g, px, pyy, 62, 19, '#ffffff')
    g.fillStyle = '#d99a3a'; g.beginPath(); g.ellipse(px, pyy - 4, 38, 18, 0, Math.PI, 0); g.ellipse(px, pyy - 4, 38, 8, 0, 0, Math.PI); g.fill()
    for (let i = 0; i < 22; i++) ell(g, px - 30 + hash(i) * 60, pyy - 12 + hash(i + 3) * 14, 2.4, 1.6, i % 3 === 0 ? '#f2b632' : i % 4 === 0 ? '#c4231c' : '#efe0aa')
    ell(g, px + 40, pyy + 2, 11, 7, '#fff'); ell(g, px + 40, pyy + 2, 4.5, 3.4, '#f5a623')
    ell(g, px - 46, pyy + 4, 7, 5, '#d63c2a'); ell(g, px - 54, pyy + 8, 6, 4, '#7fc25a'); g.fillStyle = '#efd9a0'; g.beginPath(); g.ellipse(px + 4, pyy + 12, 14, 5, 0.3, 0, 7); g.fill()
    text(g, 'Siap saji!', W / 2, 126, 16, '#f9e79f', 'center', '800')
    if (l) text(g, `Bahan ${Math.round(l.add * 100)}%  ·  Aduk ${Math.round(l.stir * 100)}%  ·  Balik ${Math.round(l.flip * 100)}%`, W / 2, 148, 13, '#fff', 'center')
  }
}

// ================================================================= ATUR PARKIR
const HUES = ['#d64541', '#2f86c9', '#2fb36a', '#e0b020', '#8a55b8', '#e07a2b']
const att = { x: -1 }
export function drawPark(g: G, s: ParkSim, t: number) {
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#4d555d'); bg.addColorStop(1, '#353b42'); g.fillStyle = bg; g.fillRect(0, 0, W, H)
  for (let i = 0; i < 120; i++) { g.fillStyle = `rgba(255,255,255,${0.02 + hash(i) * 0.04})`; g.fillRect(hash(i + 1) * W, hash(i + 2) * H, 2 + hash(i + 3) * 4, 1) }
  timeBar(g, s.timeLeft, s.total)
  text(g, `Uang parkir ${s.collected}`, 16, 42, 15, '#9be59b'); text(g, `Salah ${s.wrong}`, W / 2, 42, 14, '#ffb4b4', 'center'); text(g, `Marah ${s.angry + s.lostFull}  ·  Terlewat ${s.missed}`, W - 16, 42, 14, '#ff9f9f', 'right')
  const n = s.nSlots, sw = (W - 40) / n, sy = 84, sh = 142
  // kantong parkir: garis cat putih + pembatas roda
  for (let i = 0; i <= n; i++) { g.fillStyle = '#f2f0e6'; g.fillRect(20 + i * sw - 1.5, sy, 3, sh) }
  g.fillRect(20, sy, n * sw, 3)
  for (let i = 0; i < n; i++) {
    const x = 20 + i * sw, cx = x + sw / 2, m = s.slots[i], on = i === s.cursor
    g.fillStyle = on ? 'rgba(255,230,120,.2)' : 'rgba(0,0,0,0)'; if (on) { rr(g, x + 4, sy + 4, sw - 8, sh - 4, 6); g.fill() }
    g.fillStyle = '#c9ccd1'; rr(g, cx - 16, sy + sh - 16, 32, 7, 3); g.fill(); g.fillStyle = '#8a8f96'; rr(g, cx - 16, sy + sh - 11, 32, 3, 1.5); g.fill()
    text(g, `${i + 1}`, cx, sy + sh + 14, 12, 'rgba(255,255,255,.6)', 'center', '700')
    if (m) {
      bikeTop(g, cx, sy + sh / 2 + 6, 1.45, { color: HUES[m.hue % 6], rot: 0 })
      if (m.state === 'parked') { g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(cx - 18, sy + 6, 36 * (m.t / m.stay), 3.5) }
      else {
        const f = Math.max(0, m.readyLeft / s.readyWindow), wob = Math.sin(t * 12) * 1.5
        personTop(g, cx + sw * 0.34, sy + sh / 2 + 8, 1.15, { shirt: HUES[(m.hue + 2) % 6], rot: -Math.PI / 2 + 0.2, arm: 1, item: 'bill' })
        g.strokeStyle = f > 0.4 ? '#2ecc71' : '#e74c3c'; g.lineWidth = 4; g.beginPath(); g.arc(cx, sy + sh / 2 + 6, 62, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * f); g.stroke()
        g.globalAlpha = 0.65 + 0.35 * Math.sin(t * 14); bill(g, cx + wob, sy - 12, 1.15, 0.1); g.globalAlpha = 1
      }
    }
  }
  // petugas parkir (rompi oranye) berpindah ke slot terpilih
  const tx = 20 + s.cursor * sw + sw / 2
  att.x = att.x < 0 ? tx : att.x + (tx - att.x) * 0.3
  personTop(g, att.x, sy + sh + 36, 1.25, { shirt: '#f08a24', rot: 0, arm: 0.4, item: null }); g.fillStyle = '#d9d94a'; g.fillRect(att.x - 11, sy + sh + 33, 22, 2.5)
  // jalan masuk & antrean
  g.fillStyle = '#2d3238'; g.fillRect(0, 262, W, 74); g.fillStyle = '#e0cf5a'; for (let x = 8; x < W; x += 44) g.fillRect(x, 298, 24, 3)
  text(g, 'ANTREAN', 14, 252, 11, 'rgba(255,255,255,.55)')
  s.queue.forEach((w, i) => {
    const x = 60 + i * 84, y = 298, f = w.left / w.patience, shake = f < 0.35 ? Math.sin(t * 28 + i) * 1.6 : 0
    bikeTop(g, x + shake, y, 1.05, { color: HUES[w.hue % 6], rider: HUES[(w.hue + 3) % 6], helmet: HUES[(w.hue + 1) % 6], rot: 0 })
    g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(x - 20, 332, 40, 5); g.fillStyle = f > 0.4 ? '#2ecc71' : f > 0.2 ? '#f1c40f' : '#e74c3c'; g.fillRect(x - 20, 332, 40 * f, 5)
    if (f < 0.35) text(g, '!', x + 22, 276, 18, '#ff6b6b', 'center', '800')
  })
  if (!s.queue.length) text(g, 'Tidak ada yang mengantre', 80, 282, 12.5, 'rgba(255,255,255,.5)')
  text(g, '← → pilih slot · Spasi: parkirkan motor terdepan / ambil uang', W / 2, H - 9, 11.5, 'rgba(255,255,255,.75)', 'center', '500')
}

// ================================================================= ANTAR PESANAN
const CUST = [
  { shirt: '#c0392b', skin: '#c68e64', hair: '#1a1410' }, { shirt: '#2e86c1', skin: '#d9a47a', hair: '#2b1a12', female: true }, { shirt: '#27ae60', skin: '#b98660', hair: '#111' },
  { shirt: '#8e44ad', skin: '#d0a07a', hair: '#3a2416', female: true }, { shirt: '#e67e22', skin: '#c68e64', hair: '#1c1410' },
]
export function drawServe(g: G, s: ServeSim, t: number) {
  // dinding kayu + jendela + papan menu + lampu
  const wall = g.createLinearGradient(0, 0, 0, 250); wall.addColorStop(0, '#6a4630'); wall.addColorStop(1, '#4e3322'); g.fillStyle = wall; g.fillRect(0, 0, W, 250)
  g.strokeStyle = 'rgba(0,0,0,.2)'; g.lineWidth = 1; for (let x = 0; x < W; x += 30) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 250); g.stroke() }
  g.fillStyle = '#2b1d14'; rr(g, 160, 56, 92, 50, 4); g.fill(); g.fillStyle = '#9ec9e8'; rr(g, 164, 60, 84, 42, 2); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(166, 62, 14, 38); g.fillStyle = '#e0a82e'; g.fillRect(204, 60, 3, 42)
  g.fillStyle = '#20262b'; rr(g, 372, 54, 96, 56, 4); g.fill(); text(g, 'MENU', 420, 68, 11, '#ffe9a8', 'center', '800'); text(g, 'Pecel 12rb', 420, 84, 10, '#fff', 'center', '500'); text(g, 'Es Teh 4rb', 420, 97, 10, '#fff', 'center', '500')
  for (const lx of [W * 0.3, W * 0.7]) { line(g, lx, 0, lx, 30, 2, '#1a1a1a'); ell(g, lx, 34, 9, 6, '#ffe39a'); g.fillStyle = 'rgba(255,225,150,.13)'; g.beginPath(); g.arc(lx, 36, 56, 0, 7); g.fill() }
  g.fillStyle = '#3b2a1e'; g.fillRect(0, 250, W, 110); g.fillStyle = 'rgba(255,255,255,.05)'; for (let y = 262; y < 360; y += 22) g.fillRect(0, y, W, 2)
  timeBar(g, s.timeLeft, s.total)
  text(g, `Terantar ${s.delivered}`, 16, 42, 15, '#9be59b'); text(g, `Salah ${s.wrong}`, W / 2, 42, 14, '#ffb4b4', 'center'); text(g, `Kesal ${s.angry}`, W - 16, 42, 14, '#ff9f9f', 'right')
  const n = s.nTables, tw = (W - 40) / n
  for (let i = 0; i < n; i++) {
    const cx = 20 + tw * i + tw / 2, on = i === s.cursor, o = s.orders[i], c = CUST[i % CUST.length]
    const f = o && o.state === 'wait' ? o.left / o.patience : 1
    const mood = o?.state === 'done' ? 'happy' : o?.state === 'angry' || f < 0.3 ? 'angry' : o ? 'wait' : 'ok'
    personFront(g, cx, 154, 1.02, { ...c, mood })
    // meja bertaplak kotak-kotak
    const mw = Math.min(58, tw / 2 - 6)
    g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(cx, 238, mw + 4, 8, 0, 0, 7); g.fill()
    g.fillStyle = '#8c5a34'; rr(g, cx - 4, 214, 8, 24, 2); g.fill(); g.fillRect(cx - 18, 236, 36, 4)
    g.fillStyle = on ? '#f0d29a' : '#dcb878'; g.beginPath(); g.ellipse(cx, 202, mw, 20, 0, 0, 7); g.fill()
    g.save(); g.beginPath(); g.ellipse(cx, 202, mw, 20, 0, 0, 7); g.clip(); g.fillStyle = 'rgba(200,60,50,.28)'; for (let k = -mw; k < mw; k += 12) { g.fillRect(cx + k, 180, 6, 44) } for (let k = 184; k < 224; k += 10) g.fillRect(cx - mw, k, mw * 2, 5); g.restore()
    g.fillStyle = '#e9edf0'; rr(g, cx + mw * 0.45, 196, 9, 6, 1); g.fill(); g.fillStyle = '#b3262a'; rr(g, cx - mw * 0.55, 190, 5, 13, 2); g.fill(); g.fillStyle = '#e0e4e8'; rr(g, cx - mw * 0.55 + 0.8, 187, 3.4, 4, 1); g.fill()
    if (on) { g.strokeStyle = '#ffeaa7'; g.lineWidth = 3; g.beginPath(); g.ellipse(cx, 202, mw + 5, 24, 0, 0, 7); g.stroke() }
    text(g, `${i + 1}`, cx, 252, 12, 'rgba(255,255,255,.6)', 'center', '700')
    if (o) {
      const col = o.state === 'done' ? '#d8f5df' : o.state === 'angry' ? '#fbdcd8' : '#ffffff'
      g.fillStyle = col; rr(g, cx - 30, 56, 60, 58, 14); g.fill(); g.beginPath(); g.moveTo(cx - 7, 113); g.lineTo(cx, 124); g.lineTo(cx + 7, 113); g.fill()
      if (o.state === 'wait') dishIcon(g, o.dish, cx, 86, 19)
      else text(g, o.state === 'done' ? '✔' : '✖', cx, 86, 32, o.state === 'done' ? '#27ae60' : '#e74c3c', 'center', '800')
      if (o.state === 'wait') { g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(cx - 30, 50, 60, 5); g.fillStyle = f > 0.5 ? '#2ecc71' : f > 0.25 ? '#f1c40f' : '#e74c3c'; g.fillRect(cx - 30, 50, 60 * f, 5) }
    }
  }
  // etalase kaca + pelayan
  g.fillStyle = '#6e4423'; rr(g, 24, 270, W - 48, 74, 12); g.fill(); g.fillStyle = 'rgba(190,225,240,.18)'; rr(g, 30, 276, W - 60, 40, 8); g.fill()
  for (let i = 0; i < 3; i++) {
    const x = W / 2 - 170 + i * 170, on = s.held === i
    g.fillStyle = on ? 'rgba(255,234,167,.9)' : 'rgba(255,255,255,.14)'; rr(g, x - 56, 280, 112, 56, 10); g.fill()
    dishIcon(g, i, x - 26, 308, 20); text(g, `${i + 1}`, x + 12, 296, 17, on ? '#222' : '#ffd9a0', 'left', '800'); text(g, DISH_NAMES[i], x + 12, 318, 11, on ? '#222' : '#fff', 'left', '500')
  }
  if (s.held !== null) { ell(g, W / 2 - 40, 266, 22, 6, 'rgba(0,0,0,.3)'); g.fillStyle = '#c9ccd1'; rr(g, W / 2 - 70, 262, 60, 6, 3); g.fill(); dishIcon(g, s.held, W / 2 - 40, 253, 15) }
  text(g, s.held === null ? 'Tangan kosong' : `Membawa ${DISH_NAMES[s.held]}`, W / 2 + 4, 267, 11.5, s.held === null ? 'rgba(255,255,255,.5)' : '#ffeaa7', 'left')
  text(g, '1–3 ambil lauk · ← → pilih meja · Spasi antar', W / 2, H - 9, 11.5, 'rgba(255,255,255,.75)', 'center', '500')
  void t
}

// ================================================================= RUTE KILAT
const mp = { px: 0, py: 0, rot: 0, key: '' }
export function drawRoute(g: G, s: RouteSim, t: number) {
  g.fillStyle = '#26323d'; g.fillRect(0, 0, W, H)
  timeBar(g, s.timeLeft, s.total)
  const X0 = 20, Y0 = 40, C = (H - Y0 - 12) / GRID
  const px = (x: number) => X0 + x * C + C / 2, py = (y: number) => Y0 + y * C + C / 2
  // peta kota: rumput/blok bangunan + jalan di sepanjang tengah sel
  g.fillStyle = '#3c5a3d'; rr(g, X0 - 3, Y0 - 3, C * GRID + 6, C * GRID + 6, 8); g.fill()
  const BLK = ['#c9b79c', '#b8a0a0', '#9aa5b1', '#d7c3a1', '#a7b8a0', '#8f9fb8']
  for (let i = 0; i < GRID - 1; i++) for (let j = 0; j < GRID - 1; j++) {
    const bx = px(i) + 6, by = py(j) + 6, bw = C - 12, h = hash(i * 9 + j + s.round * 31)
    if (h < 0.18) { g.fillStyle = '#4f7d47'; rr(g, bx, by, bw, bw, 4); g.fill(); ell(g, bx + bw * 0.3, by + bw * 0.4, 5, 5, '#2f6a35'); ell(g, bx + bw * 0.65, by + bw * 0.6, 6, 6, '#2f6a35') }
    else { const c = BLK[Math.floor(h * 6) % 6]; g.fillStyle = 'rgba(0,0,0,.25)'; rr(g, bx + 2, by + 2, bw, bw, 3); g.fill(); g.fillStyle = c; rr(g, bx, by, bw, bw, 3); g.fill(); g.fillStyle = shade(c, 0.8); g.fillRect(bx, by, bw, 4); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(bx + 4, by + 8, bw * 0.3, bw * 0.25); g.fillRect(bx + bw * 0.55, by + 8, bw * 0.3, bw * 0.25) }
  }
  g.strokeStyle = '#5b6068'; g.lineWidth = Math.max(8, C * 0.3); g.lineCap = 'square'
  for (let i = 0; i < GRID; i++) { line(g, px(i), py(0), px(i), py(GRID - 1), g.lineWidth, '#5b6068'); line(g, px(0), py(i), px(GRID - 1), py(i), g.lineWidth, '#5b6068') }
  g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1; g.setLineDash([5, 6]); for (let i = 0; i < GRID; i++) { g.beginPath(); g.moveTo(px(i), py(0)); g.lineTo(px(i), py(GRID - 1)); g.stroke(); g.beginPath(); g.moveTo(px(0), py(i)); g.lineTo(px(GRID - 1), py(i)); g.stroke() } g.setLineDash([])
  // rute terpilih menyusuri jalan
  let prev = s.depot
  for (const i of s.chosen) { const p = s.stops[i]; g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 8; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(px(prev.x), py(prev.y)); g.lineTo(px(p.x), py(prev.y)); g.lineTo(px(p.x), py(p.y)); g.stroke(); g.strokeStyle = '#ffcf33'; g.lineWidth = 5; g.stroke(); prev = p }
  warehouse(g, px(s.depot.x), py(s.depot.y) - 2, 1)
  s.stops.forEach((p, i) => { const k = s.chosen.indexOf(i), done = s.phase === 'drive' && k >= 0 && k < s.nextStop; mapPin(g, px(p.x), py(p.y) + 2, String(i + 1), done ? 'done' : k >= 0 ? 'chosen' : 'idle', k >= 0 ? k : undefined) })
  if (s.phase !== 'plan') {
    const q = s.pos, key = s.round + ':' + s.phase
    if (mp.key !== key) { mp.key = key; mp.px = q.x; mp.py = q.y }
    const dx = q.x - mp.px, dy = q.y - mp.py; if (Math.hypot(dx, dy) > 0.01) { const r = Math.atan2(dx, -dy); let d = r - mp.rot; d = Math.atan2(Math.sin(d), Math.cos(d)); mp.rot += d * 0.4 } mp.px = q.x; mp.py = q.y
    bikeTop(g, px(q.x), py(q.y), 0.62, { color: '#e07a2b', rider: '#3a6ea5', helmet: '#e07a2b', rot: mp.rot })
    g.save(); g.translate(px(q.x), py(q.y)); g.rotate(mp.rot); parcel(g, 0, 14, 0.5); g.restore()
  }
  const RX = X0 + C * GRID + 24
  text(g, `Ronde ${Math.min(ROUNDS, s.round + (s.phase === 'between' ? 0 : 1))}/${ROUNDS}`, RX, 52, 16, '#ffd9a0')
  if (s.phase === 'plan') {
    text(g, 'SUSUN URUTAN ANTAR', RX, 80, 13, '#fff'); text(g, 'Tekan nomor alamat dari yang', RX, 102, 12, 'rgba(255,255,255,.7)', 'left', '500'); text(g, 'pertama dikunjungi. Pilih rute tersingkat!', RX, 118, 12, 'rgba(255,255,255,.7)', 'left', '500')
    const f = Math.max(0, s.planLeft / s.planLimit); g.fillStyle = 'rgba(255,255,255,.15)'; rr(g, RX, 138, 200, 8, 4); g.fill(); g.fillStyle = f > 0.3 ? '#4cd137' : '#e84118'; rr(g, RX, 138, 200 * f, 8, 4); g.fill()
    s.chosen.forEach((i, k) => { g.fillStyle = '#f5c518'; rr(g, RX + k * 34, 166, 30, 30, 8); g.fill(); text(g, String(i + 1), RX + k * 34 + 15, 181, 15, '#222', 'center', '800') })
    for (let k = s.chosen.length; k < s.n; k++) { g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 2; rr(g, RX + k * 34, 166, 30, 30, 8); g.stroke() }
    text(g, 'Backspace: batalkan', RX, 220, 12, 'rgba(255,255,255,.55)', 'left', '500')
  } else if (s.phase === 'drive') {
    text(g, s.atStop ? 'SERAHKAN PAKET! (Spasi)' : 'Mengantar…', RX, 84, 16, s.atStop ? '#ffeaa7' : '#fff', 'left', '800')
    if (s.atStop) { const f = Math.max(0, s.stopLeft / s.window); g.fillStyle = 'rgba(255,255,255,.15)'; rr(g, RX, 104, 200, 10, 5); g.fill(); g.fillStyle = f > 0.35 ? '#2ecc71' : '#e74c3c'; rr(g, RX, 104, 200 * f, 10, 5); g.fill(); g.save(); g.translate(RX + 100, 156); g.scale(1 + 0.08 * Math.sin(t * 14), 1 + 0.08 * Math.sin(t * 14)); parcel(g, 0, 0, 1.6); g.restore() }
    text(g, `Paket ${s.handoverOk}/${s.n}`, RX, 214, 14, '#9be59b'); text(g, `Rute ${Math.round(s.routeScore * 100)}% dari terbaik`, RX, 238, 13, 'rgba(255,255,255,.75)', 'left', '500')
  } else { text(g, 'Ronde selesai', RX, 84, 16, '#9be59b', 'left', '800'); text(g, `Skor ronde ${Math.round((s.roundScores[s.roundScores.length - 1] ?? 0) * 100)}%`, RX, 110, 14, '#fff') }
  text(g, 'Tekan nomor alamat · Spasi saat tiba di alamat', W - 14, H - 10, 11, 'rgba(255,255,255,.6)', 'right', '500')
}

// ================================================================= ANTAR PENUMPANG
const rp = { x: 0 }
const laneX = (l: number) => 200 + l * 80 + 40
export function drawRide(g: G, s: RideSim, t: number) {
  g.fillStyle = '#356b3b'; g.fillRect(0, 0, W, H)
  for (let y = -70 + ((s.dist * 0.55) % 70); y < H + 70; y += 70) for (const [x, k] of [[60, 1], [128, 2], [520, 3], [588, 4]] as const) { const yy = y + k * 17, r = 18 + (k % 3) * 4; g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.arc(x + 5, yy + 6, r, 0, 7); g.fill(); const gr = g.createRadialGradient(x - 5, yy - 5, 3, x, yy, r); gr.addColorStop(0, '#4fa04f'); gr.addColorStop(1, '#245c2c'); g.fillStyle = gr; g.beginPath(); g.arc(x, yy, r, 0, 7); g.fill() }
  g.fillStyle = '#c9c7bd'; g.fillRect(180, 0, 10, H); g.fillRect(450, 0, 10, H)
  const asp = g.createLinearGradient(190, 0, 450, 0); asp.addColorStop(0, '#3a3e44'); asp.addColorStop(0.5, '#43474e'); asp.addColorStop(1, '#3a3e44'); g.fillStyle = asp; g.fillRect(190, 0, 260, H)
  for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(255,255,255,${0.03 + hash(i) * 0.04})`; g.fillRect(190 + hash(i + 2) * 260, ((hash(i + 5) * H + s.dist) % H), 2 + hash(i) * 4, 1) }
  const off = s.dist % 64
  g.fillStyle = '#efece0'; for (let l = 1; l < 3; l++) for (let y = -64 + off; y < H; y += 64) g.fillRect(190 + l * 80 + 78, y, 3, 34)
  g.fillStyle = '#e8d247'; g.fillRect(186, 0, 3, H); g.fillRect(451, 0, 3, H)
  // rintangan
  for (const row of s.rows) row.lanes.forEach((l, k) => {
    const x = laneX(l), y = row.y, kind = row.kinds[k], h = hash(row.id * 3 + k)
    if (kind === 'hole') {
      g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); for (let a = 0; a < 12; a++) { const r = 31 + hash(row.id + a) * 9, ang = (a / 12) * Math.PI * 2; g.lineTo(x + Math.cos(ang) * r, y + Math.sin(ang) * r * 0.62) } g.closePath(); g.fill()
      g.fillStyle = '#1a1c20'; g.beginPath(); for (let a = 0; a < 12; a++) { const r = 24 + hash(row.id * 2 + a) * 8, ang = (a / 12) * Math.PI * 2; g.lineTo(x + Math.cos(ang) * r, y + Math.sin(ang) * r * 0.6) } g.closePath(); g.fill()
      g.strokeStyle = '#2a2d33'; g.lineWidth = 1.5; for (let a = 0; a < 5; a++) { const ang = hash(row.id + a * 3) * 6.28; line(g, x + Math.cos(ang) * 30, y + Math.sin(ang) * 19, x + Math.cos(ang) * 44, y + Math.sin(ang) * 28, 1.4, '#2a2d33') }
      g.fillStyle = 'rgba(255,255,255,.1)'; g.beginPath(); g.ellipse(x - 6, y - 7, 10, 3, 0, 0, 7); g.fill()
    } else if (kind === 'bike') bikeTop(g, x, y, 1.1, { color: HUES[Math.floor(h * 6)], rider: HUES[(Math.floor(h * 6) + 2) % 6], helmet: HUES[(Math.floor(h * 6) + 4) % 6], passenger: h > 0.6 ? '#e8e4da' : null })
    else carTop(g, x, y, 0.88, { color: CAR_COL[Math.floor(h * 8)], kind: KINDS[Math.floor(h * 4) % 4], rot: 0 })
  })
  // motor pemain: miring saat pindah lajur, lampu rem saat tabrakan
  const tx = laneX(s.lane); rp.x = rp.x === 0 ? tx : rp.x + (tx - rp.x) * 0.3
  const lean = Math.max(-0.35, Math.min(0.35, (tx - rp.x) * 0.012))
  const blink = s.invul > 0 && Math.floor(t * 14) % 2 === 0
  if (!blink) bikeTop(g, rp.x, RIDE.PY, 1.28, { color: '#1f9d55', rider: '#e8e4da', helmet: '#27ae60', passenger: '#d64541', passHelmet: '#f1c40f', rot: lean, brake: s.invul > 0 })
  // garis kecepatan
  g.strokeStyle = 'rgba(255,255,255,.1)'; g.lineWidth = 2; for (let i = 0; i < 8; i++) { const lx = 196 + hash(i) * 250, ly = (hash(i + 4) * H + s.dist * 2.2) % H; g.beginPath(); g.moveTo(lx, ly); g.lineTo(lx, ly + 22); g.stroke() }
  timeBar(g, s.timeLeft, s.total)
  text(g, `Guncangan ${s.hits}`, 16, 42, 14, '#ffb4b4')
  text(g, 'KENYAMANAN PENUMPANG', 464, 54, 10.5, 'rgba(255,255,255,.75)'); g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, 464, 64, 160, 14, 7); g.fill()
  g.fillStyle = s.comfort > 60 ? '#2ecc71' : s.comfort > 30 ? '#f1c40f' : '#e74c3c'; rr(g, 464, 64, 160 * (s.comfort / 100), 14, 7); g.fill()
  // wajah penumpang (vektor)
  const fx = 544, fy = 112, c = s.comfort; ell(g, fx, fy, 22, 22, c > 60 ? '#ffd93d' : c > 30 ? '#f7c44a' : '#f2994a'); ell(g, fx - 8, fy - 5, 2.8, 3.4, '#3a2a14'); ell(g, fx + 8, fy - 5, 2.8, 3.4, '#3a2a14')
  g.strokeStyle = '#3a2a14'; g.lineWidth = 2.2; g.lineCap = 'round'; g.beginPath(); if (c > 60) { g.moveTo(fx - 9, fy + 6); g.quadraticCurveTo(fx, fy + 15, fx + 9, fy + 6) } else if (c > 30) { g.moveTo(fx - 8, fy + 9); g.lineTo(fx + 8, fy + 9) } else { g.moveTo(fx - 9, fy + 13); g.quadraticCurveTo(fx, fy + 4, fx + 9, fy + 13) } g.stroke()
  g.fillStyle = 'rgba(10,14,20,.8)'; g.fillRect(0, H - 26, W, 26)
  text(g, '← → pindah lajur menghindari lubang, motor, dan mobil', W / 2, H - 13, 12, 'rgba(255,255,255,.9)', 'center', '500')
}
void bikeSide
