import { H, W, rr, text, timeBar, type G } from './draw'
import { ParkSim } from './park'
import { ServeSim, DISHES, DISH_NAMES } from './serve'
import { RouteSim, GRID, ROUNDS } from './route'
import { RideSim, RIDE } from './ride'

const HUE = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22']

// ---------------------------------------------------------------- Atur Parkir
export function drawPark(g: G, s: ParkSim, t: number) {
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#4a5560'); bg.addColorStop(1, '#2d343c'); g.fillStyle = bg; g.fillRect(0, 0, W, H)
  timeBar(g, s.timeLeft, s.total)
  text(g, `Uang parkir ${s.collected}`, 16, 42, 15, '#9be59b'); text(g, `Salah ${s.wrong}`, W / 2, 42, 14, '#ffb4b4', 'center'); text(g, `Marah ${s.angry + s.lostFull}  ·  Terlewat ${s.missed}`, W - 16, 42, 14, '#ff9f9f', 'right')
  const n = s.nSlots, sw = (W - 60) / n
  g.fillStyle = '#6b7480'; g.fillRect(0, 84, W, 150)
  for (let i = 0; i < n; i++) {
    const x = 30 + i * sw, m = s.slots[i], on = i === s.cursor
    g.fillStyle = on ? 'rgba(255,236,150,.28)' : 'rgba(255,255,255,.08)'; rr(g, x + 4, 92, sw - 8, 134, 10); g.fill()
    g.strokeStyle = on ? '#ffeaa7' : 'rgba(255,255,255,.4)'; g.lineWidth = on ? 4 : 2; g.setLineDash(on ? [] : [8, 6]); rr(g, x + 4, 92, sw - 8, 134, 10); g.stroke(); g.setLineDash([])
    text(g, `${i + 1}`, x + sw / 2, 238, 12, 'rgba(255,255,255,.55)', 'center')
    if (m) {
      const cx = x + sw / 2, cy = 160, ready = m.state === 'ready'
      g.fillStyle = HUE[m.hue % 6]; rr(g, cx - 18, cy - 34, 36, 68, 12); g.fill()
      g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, cx - 12, cy - 22, 24, 20, 6); g.fill()
      g.fillStyle = '#222'; rr(g, cx - 5, cy - 46, 10, 16, 4); g.fill()
      text(g, '🛵', cx, cy + 6, 26, '#fff', 'center')
      if (ready) {
        const f = Math.max(0, m.readyLeft / s.readyWindow)
        g.globalAlpha = 0.6 + 0.4 * Math.sin(t * 14); text(g, '💰', cx, cy - 58, 26, '#fff', 'center'); g.globalAlpha = 1
        g.strokeStyle = f > 0.4 ? '#2ecc71' : '#e74c3c'; g.lineWidth = 4; g.beginPath(); g.arc(cx, cy, 44, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * f); g.stroke()
      } else { g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(cx - 18, cy + 40, 36 * (m.t / m.stay), 4) }
    }
  }
  // antrean
  text(g, 'ANTREAN', 16, 254, 11, 'rgba(255,255,255,.55)')
  s.queue.forEach((w, i) => {
    const x = 40 + i * 70, y = 296, f = w.left / w.patience
    g.fillStyle = HUE[w.hue % 6]; rr(g, x - 20, y - 22, 40, 44, 10); g.fill(); text(g, '🛵', x, y, 22, '#fff', 'center')
    g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(x - 20, y + 26, 40, 5); g.fillStyle = f > 0.4 ? '#2ecc71' : '#e74c3c'; g.fillRect(x - 20, y + 26, 40 * f, 5)
  })
  if (!s.queue.length) text(g, 'Tidak ada yang mengantre', 40, 296, 13, 'rgba(255,255,255,.4)')
  text(g, '← → pilih slot · Spasi: parkirkan motor terdepan / ambil uang (💰)', W / 2, H - 12, 12, 'rgba(255,255,255,.75)', 'center', '500')
}

// ---------------------------------------------------------------- Antar Pesanan
export function drawServe(g: G, s: ServeSim, t: number) {
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#5a3b27'); bg.addColorStop(1, '#3a2418'); g.fillStyle = bg; g.fillRect(0, 0, W, H)
  timeBar(g, s.timeLeft, s.total)
  text(g, `Terantar ${s.delivered}`, 16, 42, 15, '#9be59b'); text(g, `Salah ${s.wrong}`, W / 2, 42, 14, '#ffb4b4', 'center'); text(g, `Kesal ${s.angry}`, W - 16, 42, 14, '#ff9f9f', 'right')
  const n = s.nTables, tw = (W - 40) / n
  for (let i = 0; i < n; i++) {
    const cx = 20 + tw * i + tw / 2, on = i === s.cursor, o = s.orders[i]
    g.fillStyle = on ? '#e8c08a' : '#c99a62'; g.beginPath(); g.ellipse(cx, 190, Math.min(54, tw / 2 - 6), 22, 0, 0, 7); g.fill()
    g.fillStyle = '#8a5a35'; g.fillRect(cx - 5, 208, 10, 26)
    if (on) { g.strokeStyle = '#ffeaa7'; g.lineWidth = 3; g.beginPath(); g.ellipse(cx, 190, Math.min(60, tw / 2 - 2), 27, 0, 0, 7); g.stroke() }
    text(g, `${i + 1}`, cx, 246, 12, 'rgba(255,255,255,.55)', 'center')
    text(g, '🧑', cx, 160, 26, '#fff', 'center')
    if (o) {
      const f = o.state === 'wait' ? Math.max(0, o.left / o.patience) : 0
      const col = o.state === 'done' ? '#2ecc71' : o.state === 'angry' ? '#e74c3c' : '#fff'
      g.fillStyle = col; rr(g, cx - 28, 78, 56, 56, 14); g.fill()
      g.beginPath(); g.moveTo(cx - 6, 133); g.lineTo(cx, 143); g.lineTo(cx + 6, 133); g.fill()
      text(g, o.state === 'angry' ? '😡' : o.state === 'done' ? '😊' : DISHES[o.dish], cx, 107, 28, '#222', 'center')
      if (o.state === 'wait') { g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(cx - 28, 70, 56, 5); g.fillStyle = f > 0.5 ? '#2ecc71' : f > 0.25 ? '#f1c40f' : '#e74c3c'; g.fillRect(cx - 28, 70, 56 * f, 5) }
    }
  }
  // etalase
  g.fillStyle = '#7a4b25'; rr(g, 40, 268, W - 80, 62, 12); g.fill()
  for (let i = 0; i < 3; i++) {
    const x = W / 2 - 150 + i * 150, on = s.held === i
    g.fillStyle = on ? '#ffeaa7' : 'rgba(255,255,255,.16)'; rr(g, x - 52, 274, 104, 50, 10); g.fill()
    text(g, DISHES[i], x - 26, 299, 28, '#fff', 'center'); text(g, `${i + 1}`, x + 6, 290, 16, on ? '#222' : '#ffd9a0', 'left', '800'); text(g, DISH_NAMES[i], x + 6, 312, 11, on ? '#222' : '#fff', 'left', '500')
  }
  text(g, s.held === null ? 'Tangan kosong' : `Membawa ${DISHES[s.held]}`, W / 2, 252, 13, s.held === null ? 'rgba(255,255,255,.5)' : '#ffeaa7', 'center')
  text(g, '1–3 ambil lauk · ← → pilih meja · Spasi antar', W / 2, H - 10, 12, 'rgba(255,255,255,.75)', 'center', '500')
  void t
}

// ---------------------------------------------------------------- Rute Kilat
export function drawRoute(g: G, s: RouteSim, t: number) {
  g.fillStyle = '#26323d'; g.fillRect(0, 0, W, H)
  timeBar(g, s.timeLeft, s.total)
  const M = 36, X0 = 20, Y0 = 44, C = (H - Y0 - 14) / GRID
  const px = (x: number) => X0 + x * C + C / 2, py = (y: number) => Y0 + y * C + C / 2
  g.fillStyle = '#34495e'; rr(g, X0 - 4, Y0 - 4, C * GRID + 8, C * GRID + 8, 10); g.fill()
  g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 1
  for (let i = 0; i <= GRID; i++) { g.beginPath(); g.moveTo(X0 + i * C, Y0); g.lineTo(X0 + i * C, Y0 + GRID * C); g.stroke(); g.beginPath(); g.moveTo(X0, Y0 + i * C); g.lineTo(X0 + GRID * C, Y0 + i * C); g.stroke() }
  void M
  // jalur terpilih
  const order = s.phase === 'plan' ? s.chosen : s.chosen
  let prev = s.depot
  g.strokeStyle = '#f1c40f'; g.lineWidth = 4; g.lineJoin = 'round'
  for (const i of order) { const p = s.stops[i]; g.beginPath(); g.moveTo(px(prev.x), py(prev.y)); g.lineTo(px(p.x), py(prev.y)); g.lineTo(px(p.x), py(p.y)); g.stroke(); prev = p }
  // depot & alamat
  text(g, '🏠', px(s.depot.x), py(s.depot.y), 20, '#fff', 'center')
  s.stops.forEach((p, i) => {
    const k = s.chosen.indexOf(i), done = s.phase === 'drive' && k >= 0 && k < s.nextStop
    g.fillStyle = done ? '#2ecc71' : k >= 0 ? '#f1c40f' : '#ecf0f1'; g.beginPath(); g.arc(px(p.x), py(p.y), C * 0.38, 0, 7); g.fill()
    text(g, String(i + 1), px(p.x), py(p.y), 15, '#222', 'center', '800')
    if (k >= 0) text(g, `#${k + 1}`, px(p.x) + C * 0.42, py(p.y) - C * 0.4, 11, '#ffeaa7', 'left', '800')
  })
  if (s.phase === 'drive' || s.phase === 'between') { const q = s.pos; text(g, '🛵', px(q.x), py(q.y), 24, '#fff', 'center') }
  // panel
  const RX = X0 + C * GRID + 22
  text(g, `Ronde ${Math.min(ROUNDS, s.round + (s.phase === 'between' ? 0 : 1))}/${ROUNDS}`, RX, 52, 16, '#ffd9a0')
  if (s.phase === 'plan') {
    text(g, 'SUSUN URUTAN ANTAR', RX, 82, 13, '#fff')
    text(g, 'Tekan nomor alamat dari yang', RX, 104, 12, 'rgba(255,255,255,.7)', 'left', '500'); text(g, 'pertama dikunjungi. Pilih rute tersingkat!', RX, 120, 12, 'rgba(255,255,255,.7)', 'left', '500')
    const f = Math.max(0, s.planLeft / s.planLimit)
    g.fillStyle = 'rgba(255,255,255,.15)'; rr(g, RX, 140, 200, 8, 4); g.fill(); g.fillStyle = f > 0.3 ? '#4cd137' : '#e84118'; rr(g, RX, 140, 200 * f, 8, 4); g.fill()
    s.chosen.forEach((i, k) => { g.fillStyle = '#f1c40f'; rr(g, RX + k * 34, 168, 30, 30, 8); g.fill(); text(g, String(i + 1), RX + k * 34 + 15, 183, 15, '#222', 'center', '800') })
    for (let k = s.chosen.length; k < s.n; k++) { g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 2; rr(g, RX + k * 34, 168, 30, 30, 8); g.stroke() }
    text(g, 'Backspace: batalkan', RX, 222, 12, 'rgba(255,255,255,.55)', 'left', '500')
  } else if (s.phase === 'drive') {
    text(g, s.atStop ? 'SERAHKAN PAKET! (Spasi)' : 'Mengantar…', RX, 86, 16, s.atStop ? '#ffeaa7' : '#fff', 'left', '800')
    if (s.atStop) { const f = Math.max(0, s.stopLeft / s.window); g.fillStyle = 'rgba(255,255,255,.15)'; rr(g, RX, 106, 200, 10, 5); g.fill(); g.fillStyle = f > 0.35 ? '#2ecc71' : '#e74c3c'; rr(g, RX, 106, 200 * f, 10, 5); g.fill(); g.globalAlpha = 0.6 + 0.4 * Math.sin(t * 14); text(g, '📦', RX + 100, 150, 34, '#fff', 'center'); g.globalAlpha = 1 }
    text(g, `Paket ${s.handoverOk}/${s.n}`, RX, 206, 14, '#9be59b')
    text(g, `Rute ${Math.round(s.routeScore * 100)}% dari terbaik`, RX, 230, 13, 'rgba(255,255,255,.75)', 'left', '500')
  } else {
    text(g, 'Ronde selesai', RX, 86, 16, '#9be59b', 'left', '800')
    const l = s.roundScores[s.roundScores.length - 1] ?? 0; text(g, `Skor ronde ${Math.round(l * 100)}%`, RX, 112, 14, '#fff')
  }
  text(g, 'Tekan nomor alamat · Spasi saat tiba di alamat', W - 16, H - 12, 11, 'rgba(255,255,255,.6)', 'right', '500')
}

// ---------------------------------------------------------------- Antar Penumpang
const laneX = (l: number) => 200 + l * 80 + 40
export function drawRide(g: G, s: RideSim, t: number) {
  g.fillStyle = '#2f6b3a'; g.fillRect(0, 0, W, H)
  g.fillStyle = '#3b3f46'; g.fillRect(190, 0, 260, H)
  g.fillStyle = '#d9d9d9'; g.fillRect(186, 0, 4, H); g.fillRect(450, 0, 4, H)
  const off = s.dist % 60
  g.fillStyle = '#f0f0f0'; for (let l = 1; l < 3; l++) for (let y = -60 + off; y < H; y += 60) g.fillRect(190 + l * 80 + 79, y, 3, 30)
  for (let y = -60 + (s.dist * 0.6) % 90; y < H; y += 90) { g.fillStyle = '#1f4d28'; g.beginPath(); g.arc(150, y, 16, 0, 7); g.fill(); g.beginPath(); g.arc(500, y + 30, 16, 0, 7); g.fill() }
  for (const row of s.rows) row.lanes.forEach((l, k) => {
    const x = laneX(l), y = row.y
    if (row.kinds[k] === 'hole') { g.fillStyle = '#16181c'; g.beginPath(); g.ellipse(x, y, 30, 17, 0, 0, 7); g.fill(); g.strokeStyle = '#555'; g.lineWidth = 2; g.stroke() }
    else { g.fillStyle = '#c0392b'; rr(g, x - 14, y - 32, 28, 64, 10); g.fill(); g.fillStyle = '#222'; rr(g, x - 6, y - 24, 12, 14, 4); g.fill(); text(g, '🛵', x, y + 6, 22, '#fff', 'center') }
  })
  // pemain (halus antar lajur)
  const tx = laneX(s.lane); const cur = (drawRide as unknown as { x?: number }).x ?? tx
  const nx = cur + (tx - cur) * 0.35; (drawRide as unknown as { x?: number }).x = nx
  const blink = s.invul > 0 && Math.floor(t * 14) % 2 === 0
  if (!blink) { g.fillStyle = '#27ae60'; rr(g, nx - 15, RIDE.PY - 36, 30, 72, 12); g.fill(); g.fillStyle = '#fff'; rr(g, nx - 8, RIDE.PY - 18, 16, 16, 5); g.fill(); text(g, '🏍️', nx, RIDE.PY + 8, 26, '#fff', 'center'); text(g, '🧍', nx, RIDE.PY - 8, 16, '#fff', 'center') }
  // HUD
  timeBar(g, s.timeLeft, s.total)
  text(g, 'KENYAMANAN PENUMPANG', 464, 54, 11, 'rgba(255,255,255,.7)'); g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, 464, 66, 160, 14, 7); g.fill()
  g.fillStyle = s.comfort > 60 ? '#2ecc71' : s.comfort > 30 ? '#f1c40f' : '#e74c3c'; rr(g, 464, 66, 160 * (s.comfort / 100), 14, 7); g.fill()
  text(g, s.comfort > 70 ? '😊' : s.comfort > 40 ? '😐' : '😣', 544, 106, 30, '#fff', 'center')
  text(g, `Guncangan ${s.hits}`, 16, 42, 14, '#ffb4b4')
  text(g, '← → pindah lajur menghindari lubang & motor', W / 2, H - 12, 12, 'rgba(255,255,255,.85)', 'center', '500')
}
