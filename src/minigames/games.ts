import type { Opts, Sim } from './core'
import { SortSim, type Box } from './sort'
import { LightSim } from './light'
import { INGREDIENTS, ING_NAMES, WokSim } from './wok'

import { H, W, rr, text, timeBar, type G } from './draw'
import { drawPark, drawRide, drawRoute, drawServe } from './games2'
import { ParkSim } from './park'
import { RideSim } from './ride'
import { RouteSim } from './route'
import { ServeSim } from './serve'
export { H, W }
export type GameId = 'gudang' | 'koran' | 'nasgor' | 'parkir' | 'pelayan' | 'kurir' | 'ojek'
export interface GameDef {
  id: GameId; title: string; icon: string; blurb: string
  howto: string[]; keys: string
  create: (o: Opts) => Sim
  draw: (g: CanvasRenderingContext2D, sim: never, t: number) => void
}

// ---------------------------------------------------------------- Sortir Peti
const SORT_COL = ['#e74c3c', '#3498db', '#2ecc71']
const SORT_KEY = ['1  ←', '2  ↓', '3  →']
function drawSort(g: G, s: SortSim, t: number) {
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#2f3640'); bg.addColorStop(1, '#1b1f27'); g.fillStyle = bg; g.fillRect(0, 0, W, H)
  timeBar(g, s.timeLeft, s.total)
  text(g, `Benar ${s.correct}`, 16, 42, 15, '#9be59b'); text(g, `Kombo ${s.combo}`, W / 2, 42, 15, s.combo >= 5 ? '#ffd32a' : '#cfd8dc', 'center'); text(g, `Salah ${s.wrong}  ·  Lolos ${s.lost}`, W - 16, 42, 15, '#ff9f9f', 'right')
  // ban berjalan
  const by = 96, bh = 74
  g.fillStyle = '#4b4f58'; g.fillRect(0, by, W, bh)
  g.fillStyle = '#3a3d45'; const off = (t * 70) % 32
  for (let x = -32 + off; x < W; x += 32) g.fillRect(x, by + bh - 8, 16, 8)
  g.fillStyle = '#ffd32a'; g.fillRect(0, by - 4, W, 4); g.fillRect(0, by + bh, W, 4)
  text(g, 'BATAS ▶', W - 10, by - 14, 11, '#ff6b6b', 'right')
  const bx = (b: Box) => 34 + (b.x * (W - 90)) / SortSim.LENGTH
  const front = s.boxes.filter((b) => b.state === 'belt').sort((a, b) => b.x - a.x)[0]
  // palet
  const binX = [W * 0.2, W * 0.5, W * 0.8]
  for (let i = 0; i < 3; i++) {
    const hit = s.flash && s.flash.color === i
    g.fillStyle = hit ? (s.flash!.ok ? '#ffffff' : '#ff3838') : SORT_COL[i]; g.globalAlpha = hit ? 0.95 : 0.85
    rr(g, binX[i] - 62, 262, 124, 70, 12); g.fill(); g.globalAlpha = 1
    text(g, SORT_KEY[i], binX[i], 297, 22, '#fff', 'center', '800')
  }
  // peti
  for (const b of s.boxes) {
    let x = bx(b), y = by + bh / 2, sc = 1, a = 1
    if (b.state === 'sorted') { const k = Math.min(1, b.t / 0.5); const tx = binX[b.color]; x = x + (tx - x) * k; y = y + (275 - y) * k * k; sc = 1 - 0.4 * k; a = 1 - 0.2 * k }
    if (b.state === 'lost') { const k = Math.min(1, b.t / 0.5); y += k * 60; a = 1 - k }
    g.globalAlpha = a
    const sz = 46 * sc
    g.fillStyle = SORT_COL[b.color]; rr(g, x - sz / 2, y - sz / 2, sz, sz, 8); g.fill()
    g.lineWidth = b === front && b.state === 'belt' ? 4 : 2; g.strokeStyle = b === front && b.state === 'belt' ? '#fff' : 'rgba(0,0,0,.35)'; g.stroke()
    if (b.heavy) { g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, x - sz / 2, y + sz / 2 - 14 * sc, sz, 14 * sc, 5); g.fill(); text(g, b.hp > 1 ? '×2' : '×1', x, y + sz / 2 - 7 * sc, 11 * sc, '#ffd32a', 'center', '800') }
    text(g, String(b.color + 1), x, y - (b.heavy ? 4 : 0), 20 * sc, '#fff', 'center', '800')
    g.globalAlpha = 1
  }
  text(g, 'Tekan angka/panah sesuai warna peti terdepan (yang bergaris putih)', W / 2, H - 12, 12, 'rgba(255,255,255,.6)', 'center', '500')
}

// ---------------------------------------------------------------- Lampu Merah
const CAR_COL = ['#e67e22', '#9b59b6', '#16a085', '#c0392b', '#2980b9', '#f1c40f']
function drawLight(g: G, s: LightSim, t: number) {
  g.fillStyle = '#7f8c8d'; g.fillRect(0, 0, W, H)
  timeBar(g, s.timeLeft, s.total)
  const top = 52, laneH = (H - top - 30) / s.lanes
  const shake = s.shake > 0 ? Math.sin(t * 90) * 3 : 0
  g.fillStyle = '#3d4148'; g.fillRect(0, top, W, laneH * s.lanes)
  g.fillStyle = '#dfe6e9'; for (let l = 1; l < s.lanes; l++) for (let x = 0; x < W; x += 36) g.fillRect(x, top + l * laneH - 1, 20, 2)
  const stopX = 360
  g.fillStyle = s.isRed ? '#ff5252' : '#9be59b'; g.fillRect(stopX + 60, top, 4, laneH * s.lanes)
  const now = s.now
  for (const c of s.cars) {
    const cy = top + c.lane * laneH + laneH / 2
    if (c.cycle !== s.cycleNo || now < c.arrive - 1.0) continue
    let x = stopX
    if (now < c.arrive) { const k = (now - (c.arrive - 1.0)) / 1.0; x = W + 90 + (stopX - W - 90) * (1 - (1 - k) * (1 - k)) }
    else if (!s.isRed) x = stopX - Math.min(1, (s.phaseT - s.RED) / 1.4) * (stopX + 160)
    const w = 92, h = Math.min(46, laneH - 10), col = CAR_COL[(c.lane + c.cycle) % CAR_COL.length]
    g.fillStyle = col; rr(g, x - w / 2, cy - h / 2, w, h, 10); g.fill()
    g.fillStyle = 'rgba(0,0,0,.25)'; rr(g, x - w / 2 + 8, cy - h / 2 + h * 0.62, w - 16, h * 0.28, 6); g.fill()
    const open = s.isOpen(c) && !c.sold
    g.fillStyle = c.sold ? '#2ecc71' : open ? '#fff200' : '#2c3e50'; rr(g, x - w / 2 + 6, cy - h / 2 + 5, 28, h * 0.5, 5); g.fill()
    if (open) { g.strokeStyle = '#fff200'; g.lineWidth = 3; g.globalAlpha = 0.5 + 0.5 * Math.sin(t * 14); rr(g, x - w / 2 - 2, cy - h / 2 - 2, w + 4, h + 4, 12); g.stroke(); g.globalAlpha = 1 }
    if (c.sold) text(g, '+', x - w / 2 + 20, cy - h / 2 + 5 + h * 0.25, 18, '#fff', 'center', '800')
    g.fillStyle = '#ecf0f1'; g.fillRect(x - w / 2 - 3, cy - h / 2 + 8, 4, 8)
  }
  // penjual + kursor
  for (let l = 0; l < s.lanes; l++) {
    const cy = top + l * laneH + laneH / 2, on = l === s.cursor
    g.fillStyle = on ? '#ffeaa7' : 'rgba(255,255,255,.25)'; rr(g, 24 + shake, cy - 17, 70, 34, 8); g.fill()
    text(g, on ? '📰▶' : '  ', 56 + shake, cy, 18, '#222', 'center')
    if (on) { g.strokeStyle = '#ffeaa7'; g.setLineDash([6, 6]); g.lineWidth = 2; g.beginPath(); g.moveTo(96, cy); g.lineTo(stopX - 50, cy); g.stroke(); g.setLineDash([]) }
  }
  // lampu
  g.fillStyle = '#222'; rr(g, W - 60, 10, 46, 20, 6); g.fill()
  g.fillStyle = s.isRed ? '#ff3b3b' : '#4a1f1f'; g.beginPath(); g.arc(W - 48, 20, 7, 0, 7); g.fill()
  g.fillStyle = !s.isRed ? '#34e86a' : '#1d3a26'; g.beginPath(); g.arc(W - 24, 20, 7, 0, 7); g.fill()
  const left = s.isRed ? s.RED - s.phaseT : s.cycleLen - s.phaseT
  text(g, `${s.isRed ? 'MERAH' : 'HIJAU'} ${left.toFixed(1)}s`, W / 2, 20, 12, 'rgba(255,255,255,.0)', 'center')
  text(g, `Terjual ${s.sold}`, 16, H - 14, 15, '#fff'); text(g, `Sia-sia ${s.wasted}`, W - 16, H - 14, 15, '#ffb4b4', 'right')
  text(g, '↑↓ pilih lajur · Spasi jual saat jendela menyala kuning', W / 2, H - 14, 12, 'rgba(255,255,255,.75)', 'center', '500')
}

// ---------------------------------------------------------------- Wajan Panas
function drawWok(g: G, s: WokSim, t: number) {
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#2b1d14'); bg.addColorStop(1, '#4a2c1a'); g.fillStyle = bg; g.fillRect(0, 0, W, H)
  timeBar(g, s.timeLeft, s.total)
  text(g, `Piring ${Math.min(WokSim.PLATES, s.plateScores.length + (s.phase === 'serve' ? 0 : 1))}/${WokSim.PLATES}`, 16, 42, 15, '#ffd9a0')
  // resep
  const n = s.recipe.length, x0 = W / 2 - (n * 54) / 2
  text(g, 'PESANAN', W / 2, 44, 11, 'rgba(255,255,255,.55)', 'center')
  for (let i = 0; i < n; i++) {
    const done = i < s.step_ || s.phase !== 'add', cur = s.phase === 'add' && i === s.step_
    g.fillStyle = done ? '#27ae60' : cur ? '#f1c40f' : 'rgba(255,255,255,.18)'; rr(g, x0 + i * 54, 56, 46, 46, 10); g.fill()
    text(g, INGREDIENTS[s.recipe[i]], x0 + i * 54 + 23, 80, 24, '#fff', 'center')
  }
  const sh = s.shake > 0 ? Math.sin(t * 90) * 4 : 0
  // wajan + api
  const cx = W / 2 + sh, cy = 205
  for (let i = 0; i < 5; i++) { g.fillStyle = `rgba(255,${120 + 20 * i},30,.8)`; const fx = cx - 70 + i * 35, fh = 22 + 12 * Math.abs(Math.sin(t * 9 + i)); g.beginPath(); g.moveTo(fx - 12, cy + 52); g.quadraticCurveTo(fx, cy + 52 - fh * 2, fx + 12, cy + 52); g.fill() }
  g.fillStyle = '#1e1e1e'; g.beginPath(); g.ellipse(cx, cy + 20, 120, 46, 0, 0, Math.PI); g.fill(); g.fillStyle = '#3a3a3a'; g.beginPath(); g.ellipse(cx, cy + 20, 120, 26, 0, 0, 7); g.fill()
  g.fillStyle = '#d4a15a'; g.beginPath(); g.ellipse(cx, cy + 22, 96, 18, 0, 0, 7); g.fill()
  for (let i = 0; i < s.step_ && s.phase === 'add'; i++) text(g, INGREDIENTS[s.recipe[i]], cx - 70 + i * 34, cy + 16, 20, '#fff', 'center')
  if (s.phase !== 'add') { g.fillStyle = s.phase === 'serve' ? '#f4d03f' : '#e0a24a'; g.beginPath(); g.ellipse(cx, cy + 20, 86, 14, 0, 0, 7); g.fill() }
  const py = 298
  if (s.phase === 'add') {
    text(g, 'Tekan angka sesuai bahan yang menyala kuning', W / 2, 132, 13, 'rgba(255,255,255,.8)', 'center', '500')
    for (let i = 0; i < 5; i++) { g.fillStyle = 'rgba(255,255,255,.14)'; rr(g, W / 2 - 150 + i * 62, py - 22, 54, 54, 10); g.fill(); text(g, INGREDIENTS[i], W / 2 - 123 + i * 62, py - 2, 22, '#fff', 'center'); text(g, `${i + 1}`, W / 2 - 123 + i * 62, py + 22, 11, '#ffd9a0', 'center') }
  } else if (s.phase === 'stir') {
    const f = Math.min(1, s.stirCount / s.stirNeed)
    text(g, 'ADUK! Tekan A dan D bergantian', W / 2, 132, 14, '#ffd9a0', 'center')
    g.fillStyle = 'rgba(255,255,255,.15)'; rr(g, W / 2 - 150, py, 300, 18, 9); g.fill(); g.fillStyle = '#4cd137'; rr(g, W / 2 - 150, py, 300 * f, 18, 9); g.fill()
    const nextA = s.lastStir !== 'A'
    for (const [k, x] of [['A', W / 2 - 60], ['D', W / 2 + 60]] as const) { const on = (k === 'A') === nextA; g.fillStyle = on ? '#f1c40f' : 'rgba(255,255,255,.18)'; rr(g, x - 24, py - 56, 48, 40, 8); g.fill(); text(g, k, x, py - 36, 22, on ? '#222' : '#fff', 'center', '800') }
    g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(W / 2 - 150, py + 24, 300 * (1 - s.stirT / s.stirLimit), 3)
  } else if (s.phase === 'flip') {
    text(g, 'BALIK! Spasi saat penanda di zona hijau', W / 2, 132, 14, '#ffd9a0', 'center')
    const bx = W / 2 - 200, bw = 400
    g.fillStyle = 'rgba(255,255,255,.15)'; rr(g, bx, py - 6, bw, 26, 13); g.fill()
    g.fillStyle = '#2ecc71'; rr(g, bx + bw * (0.5 - s.zone / 2), py - 6, bw * s.zone, 26, 13); g.fill()
    g.fillStyle = s.flipFlash > 0 ? '#ffffff' : '#ff6b6b'; rr(g, bx + bw * s.marker - 5, py - 14, 10, 42, 5); g.fill()
  } else {
    const l = s.last
    text(g, 'Siap saji!', W / 2, 132, 18, '#f9e79f', 'center', '800')
    if (l) text(g, `Bahan ${Math.round(l.add * 100)}%  ·  Aduk ${Math.round(l.stir * 100)}%  ·  Balik ${Math.round(l.flip * 100)}%`, W / 2, py + 4, 14, '#fff', 'center')
  }
}

const BASE: Partial<Record<GameId, GameDef>> = {
  gudang: {
    id: 'gudang', title: 'Sortir Peti', icon: '📦', blurb: 'Kirim tiap peti ke palet warna yang benar sebelum lolos dari ban berjalan.',
    howto: ['Peti berwarna lewat di ban berjalan.', 'Tekan angka atau panah sesuai warnanya: 1/← merah, 2/↓ biru, 3/→ hijau.', 'Selalu peti terdepan (bergaris putih) yang terkirim.', 'Peti berat (level lanjut) perlu ditekan dua kali.'],
    keys: '1 2 3  atau  ← ↓ →',
    create: (o) => new SortSim(o), draw: drawSort as GameDef['draw'],
  },
  koran: {
    id: 'koran', title: 'Lampu Merah', icon: '📰', blurb: 'Jual koran ke pengendara yang berhenti selama lampu merah.',
    howto: ['Saat lampu merah, mobil berhenti di tiap lajur.', 'Geser kursor dengan ↑ ↓ ke lajur mobil yang jendelanya menyala kuning.', 'Tekan Spasi saat jendela terbuka untuk menjual. Jendela tertutup = sia-sia.', 'Lampu hijau: mobil jalan dan peluang hilang.'],
    keys: '↑ ↓  lalu  Spasi',
    create: (o) => new LightSim(o), draw: drawLight as GameDef['draw'],
  },
  nasgor: {
    id: 'nasgor', title: 'Wajan Panas', icon: '🍳', blurb: 'Masak nasi goreng sesuai pesanan: bahan, aduk, lalu balik wajan.',
    howto: ['Masukkan bahan sesuai urutan pesanan dengan tombol 1–5.', 'Aduk dengan menekan A dan D bergantian secepatnya.', 'Balik wajan dengan Spasi saat penanda berada di zona hijau.', 'Selesaikan 4 piring sebelum waktu habis.'],
    keys: '1–5 · A D · Spasi',
    create: (o) => new WokSim(o), draw: drawWok as GameDef['draw'],
  },
}
BASE.parkir = {
  id: 'parkir', title: 'Atur Parkir', icon: '🛵', blurb: 'Atur motor pelanggan ke slot kosong dan tagih uang parkir saat mereka mau pergi.',
  howto: ['Motor datang dan mengantre di bawah. Kesabaran mereka terus berkurang.', 'Pilih slot kosong dengan ← →, lalu Spasi untuk memarkirkan motor terdepan.', 'Saat motor menyala 💰 dan lingkarannya berjalan, tekan Spasi di slotnya untuk mengambil uang sebelum ia pergi.', 'Spasi di slot yang belum siap atau tanpa antrean dihitung salah.'],
  keys: '← →  lalu  Spasi',
  create: (o) => new ParkSim(o), draw: drawPark as GameDef['draw'],
}
BASE.pelayan = {
  id: 'pelayan', title: 'Antar Pesanan', icon: '🍽️', blurb: 'Antar lauk yang tepat ke meja pelanggan sebelum mereka kesal.',
  howto: ['Pelanggan memesan lewat gelembung di atas meja.', 'Tekan 1–3 untuk mengambil lauk: pecel, es teh, gorengan.', 'Pilih meja dengan ← →, lalu Spasi untuk mengantar.', 'Lauk yang salah dihitung kesalahan. Pelanggan yang menunggu terlalu lama pergi dengan marah.'],
  keys: '1 2 3  ·  ← →  ·  Spasi',
  create: (o) => new ServeSim(o), draw: drawServe as GameDef['draw'],
}
BASE.kurir = {
  id: 'kurir', title: 'Rute Kilat', icon: '📦', blurb: 'Susun rute antar tersingkat, lalu serahkan setiap paket tepat waktu.',
  howto: ['Peta menampilkan gudang 🏠 dan beberapa alamat bernomor.', 'Tekan nomor alamat sesuai urutan kunjungan. Rute yang lebih pendek berarti skor lebih tinggi.', 'Kurir berjalan menyusuri jalan. Saat tiba di alamat, tekan Spasi sebelum waktu habis untuk menyerahkan paket.', 'Ada 3 ronde. Spasi sebelum tiba dihitung salah.'],
  keys: '1–9  ·  Spasi  ·  Backspace',
  create: (o) => new RouteSim(o), draw: drawRoute as GameDef['draw'],
}
BASE.ojek = {
  id: 'ojek', title: 'Antar Penumpang', icon: '🏍️', blurb: 'Antar penumpang dengan nyaman: hindari lubang dan motor lain di jalan.',
  howto: ['Jalan raya tiga lajur bergulir ke arahmu.', 'Pindah lajur dengan ← → agar tidak menabrak lubang atau motor lain.', 'Setiap guncangan mengurangi kenyamanan penumpang, dan tip mengikuti kenyamanannya.', 'Makin lama jalan makin ramai dan cepat.'],
  keys: '← →',
  create: (o) => new RideSim(o), draw: drawRide as GameDef['draw'],
}
export const GAMES = BASE as Record<GameId, GameDef>
export const MINI_JOBS = new Set<string>(Object.keys(GAMES))
void ING_NAMES
