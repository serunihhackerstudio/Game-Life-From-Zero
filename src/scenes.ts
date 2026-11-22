import type { Hold, PoseName } from './Humanoid'
import { NPCS } from './npcs'
import { playerPos, type SceneInfo } from './store'

export type V3 = [number, number, number]
export interface Frame {
  x: number; y: number; z: number; rotX: number; rotY: number
  pose: PoseName; hold: Hold; speed: number; reach: number; fill: number; sitY: number
  cam: V3; look: V3; hidden?: boolean
}

const base = (): Frame => ({ x: 0, y: 0, z: 0, rotX: 0, rotY: 0, pose: 'stand', hold: 'none', speed: 0, reach: 0, fill: 0, sitY: 0.29, cam: [0, 2, 0], look: [0, 1, 0] })
const PI = Math.PI

type Pt = [number, number]
/** Titik pada polyline pada fraksi u (0..1) beserta arah geraknya. */
export function polyAt(pts: Pt[], u: number) {
  const segs = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]))
  const total = segs.reduce((a, b) => a + b, 0)
  let d = Math.min(1, Math.max(0, u)) * total
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i] || i === segs.length - 1) {
      const f = segs[i] ? Math.min(1, d / segs[i]) : 1
      const a = pts[i], b = pts[i + 1]
      return { x: a[0] + (b[0] - a[0]) * f, z: a[1] + (b[1] - a[1]) * f, dx: b[0] - a[0], dz: b[1] - a[1] }
    }
    d -= segs[i]
  }
  return { x: pts[0][0], z: pts[0][1], dx: 1, dz: 0 }
}
const easeOut = (x: number) => 1 - (1 - Math.min(1, Math.max(0, x))) ** 2.2

/** Rute jalan dengan jeda di tiap titik: [x, z, lama tunggu detik]. */
export type Route = [number, number, number][]
export function routeAt(route: Route, speed: number, tt: number) {
  let t = 0
  for (let i = 0; i < route.length - 1; i++) {
    const [ax, az] = route[i], [bx, bz, w] = route[i + 1]
    const dist = Math.hypot(bx - ax, bz - az), tm = dist / speed
    if (i === 0 && route[0][2] > 0) { // tunggu di titik awal
      if (tt < route[0][2]) return { x: ax, z: az, rot: Math.atan2(bx - ax, bz - az), moving: false, wait: true, prog: tt / route[0][2], end: false }
      t += route[0][2]
    }
    if (tt < t + tm) { const f = (tt - t) / tm; return { x: ax + (bx - ax) * f, z: az + (bz - az) * f, rot: Math.atan2(bx - ax, bz - az), moving: true, wait: false, prog: 0, end: false } }
    t += tm
    if (tt < t + w) return { x: bx, z: bz, rot: Math.atan2(bx - ax, bz - az), moving: false, wait: true, prog: (tt - t) / w, end: false }
    t += w
  }
  const l = route[route.length - 1]
  return { x: l[0], z: l[1], rot: 0, moving: false, wait: false, prog: 0, end: true }
}
export const routeDuration = (route: Route, speed: number) =>
  route.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - route[i][0], p[1] - route[i][1]) / speed + p[2], route[0][2])

// Motor di adegan parkir & kurir
export const PARK_PATH: Pt[] = [[-8, -2.7], [1.2, -2.7], [4.4, -3.9], [5.5, -5.9]]
export const KURIR_PATH: Pt[] = [[-33, -2.1], [-19, -2.1], [-16.5, -3.0], [-15.2, -4.5]]
export const KURIR_RIDE = 4.8
export const OJEK_PATH: Pt[] = [[-13, 2.1], [6, 2.1], [17, 2.1], [21.5, 3.3]]
export const OJEK_RIDE = 5.2
export function bikeAt(kind: 'parkir' | 'kurir' | 'ojek', t: number) {
  const path = kind === 'parkir' ? PARK_PATH : kind === 'ojek' ? OJEK_PATH : KURIR_PATH
  const dur = kind === 'parkir' ? 4.0 : kind === 'ojek' ? OJEK_RIDE : KURIR_RIDE
  const q = polyAt(path, easeOut(t / dur))
  return { x: q.x, z: q.z, rotY: -Math.atan2(q.dz, q.dx) }
}
// Satpam: rute patroli di depan gudang & toko; penumpang ojek; pembeli nasi goreng
export const JAGA_ROUTE: Route = [[14.5, -7.0, 1.2], [26.5, -7.0, 1.6], [26.5, -5.7, 0.4], [14.5, -5.7, 1.4], [14.5, -7.0, 0]]
export const PASSENGER_ROUTE: Route = [[22.4, 2.8, 0.5], [23.6, -3.5, 0]]
export const NASGOR_CUSTOMERS: Route = [[-27.4, -3.6, 0], [-25.6, -4.9, 3.4], [-27.4, -3.6, 0]]
// Pelayan: rute bolak-balik di depan bangku, berhenti di tiap pelanggan
export const WAITER_ROUTE: Route = [[3.4, -8.5, 0.3], [1.2, -8.5, 1.0], [-1.2, -8.5, 1.0], [3.4, -8.5, 0.4]]
// Pelanggan pembeli koran
export const KORAN_CUSTOMER: Route = [[-26.4, -4.6, 0], [-29.1, -6.4, 2.2], [-26.4, -4.6, 0]]

/** Posisi, pose, dan kamera tiap adegan aktivitas pada detik ke-t. */
export function sceneFrame(sc: SceneInfo, t: number, bagCount: number): Frame {
  const f = base()
  switch (sc.kind) {
    case 'work': {
      // bolak-balik mengangkut peti di depan pintu gudang
      const x0 = 19.6, x1 = 24.6, cyc = 5.8, u = t % cyc
      f.z = -8.5
      if (u < 2.2) { f.x = x0 + ((x1 - x0) * u) / 2.2; f.rotY = PI / 2; f.pose = 'carry'; f.hold = 'crate'; f.speed = 2.2 }
      else if (u < 2.9) { f.x = x1; f.rotY = PI / 2; f.pose = 'carry'; f.hold = 'none' }
      else if (u < 5.1) { f.x = x1 - ((x1 - x0) * (u - 2.9)) / 2.2; f.rotY = -PI / 2; f.speed = 2.2 }
      else { f.x = x0; f.rotY = -PI / 2; f.pose = 'carry'; f.hold = 'crate' }
      const a = -0.55 + t * 0.09
      f.cam = [22.1 + Math.sin(a) * 6.6, 2.1, -8.5 + Math.cos(a) * 6.6]
      f.look = [f.x * 0.5 + 11.0, 1.1, -8.7]
      break
    }
    case 'talk': {
      const n = NPCS[sc.npc!]
      const px = playerPos.x, pz = playerPos.z
      const dx = n.pos[0] - px, dz = n.pos[1] - pz, L = Math.hypot(dx, dz) || 1
      const ux = dx / L, uz = dz / L
      f.x = px; f.z = pz; f.rotY = Math.atan2(dx, dz); f.pose = 'stand'
      // kamera di samping garis pandang, di sisi jalan (z lebih besar), sedikit di belakang pemain
      let sx = -uz, sz = ux
      if (sz < -0.001 || (Math.abs(sz) < 0.001 && sx < 0)) { sx = -sx; sz = -sz }
      const mx = (px + n.pos[0]) / 2, mz = (pz + n.pos[1]) / 2
      const drift = Math.sin(t * 0.4) * 0.15
      f.cam = [mx + sx * (2.7 + drift) - ux * 1.2, 1.55, mz + sz * (2.7 + drift) - uz * 1.2]
      f.look = [mx, 0.95, mz]
      break
    }
    case 'nasgor':
      f.x = -23.5; f.z = -7.6; f.rotY = 0; f.pose = 'cook'; f.hold = 'spatula'
      f.cam = [-20.6 - t * 0.02, 1.6, -4.2]; f.look = [-23.4, 1.25, -7.0]
      break
    case 'ojek': {
      if (t < OJEK_RIDE + 0.1) {
        const b = bikeAt('ojek', t)
        f.hidden = true; f.x = b.x; f.z = b.z
        f.cam = [b.x - 2.0, 1.7, b.z + 5.2]; f.look = [b.x + 1.6, 1.0, b.z]
      } else {
        f.x = 20.3; f.z = 2.5; f.rotY = -PI / 2 + 0.2; f.pose = 'stand'
        f.cam = [17.6, 1.7, 5.4]; f.look = [21.2, 1.2, 2.8]
      }
      break
    }
    case 'jaga': {
      const dur = routeDuration(JAGA_ROUTE, 1.2)
      const r = routeAt(JAGA_ROUTE, 1.2, t % dur)
      f.x = r.x; f.z = r.z; f.rotY = r.end ? PI : r.rot; f.pose = 'patrol'; f.hold = 'torch'; f.speed = r.moving ? 1.8 : 0
      f.cam = [f.x - 3.6 + Math.sin(t * 0.3) * 0.6, 1.7, f.z + 4.6]; f.look = [f.x + 1.6, 1.1, f.z - 0.2]
      break
    }
    case 'koran':
      f.x = -30.2; f.z = -6.9; f.rotY = 0; f.pose = 'sell'; f.hold = 'paper'
      f.cam = [-27.4 - t * 0.03, 1.65, -3.7]; f.look = [-29.9, 1.3, -7.2]
      break
    case 'parkir':
      f.x = 3.0; f.z = -5.6; f.rotY = 0.9; f.pose = 'signal'
      f.cam = [6.9, 1.7, -2.2]; f.look = [3.9, 1.2, -5.2]
      break
    case 'pelayan': {
      const r = routeAt(WAITER_ROUTE, 1.6, t % routeDuration(WAITER_ROUTE, 1.6))
      f.x = r.x; f.z = r.z; f.pose = 'tray'; f.hold = 'tray'
      f.speed = r.moving ? 2.2 : 0
      f.rotY = r.wait ? PI : r.rot
      f.reach = r.wait ? Math.sin(r.prog * PI) : 0
      f.cam = [5.2, 1.55, -6.0]; f.look = [0.4, 1.15, -9.2]
      break
    }
    case 'kurir': {
      if (t < KURIR_RIDE + 0.2) {
        const b = bikeAt('kurir', t)
        f.hidden = true; f.x = b.x; f.z = b.z
        f.cam = [b.x + 3.2, 1.8, b.z + 4.6]; f.look = [b.x - 0.5, 1.0, b.z]
      } else {
        const u = t - (KURIR_RIDE + 0.2), walk = Math.min(1, u / 1.7)
        f.x = -14.3 + 0.1 * walk; f.z = -5.2 - 2.3 * walk; f.rotY = PI
        f.pose = 'carry'; f.hold = t < 6.9 ? 'crate' : 'none'; f.speed = walk < 1 ? 2.2 : 0
        f.cam = [-11.9, 1.7, -4.1]; f.look = [-14.3, 1.2, -6.6]
      }
      break
    }
    case 'eat':
      f.x = 1.2; f.z = -9.28; f.rotY = PI; f.pose = 'eat'; f.hold = 'spoon'; f.sitY = 0.29
      f.cam = [3.7 - t * 0.04, 1.5, -7.9]; f.look = [1.25, 1.1, -9.6]
      break
    case 'cook':
      f.x = -16.25; f.z = -16.85; f.rotY = PI; f.pose = 'cook'; f.hold = 'spatula'
      f.cam = [-14.3, 1.65, -15.2 + Math.sin(t * 0.4) * 0.2]; f.look = [-16.2, 1.15, -17.4]
      break
    case 'sleep':
      // telentang di kasur: kepala di bantal (z -17.3), kaki ke arah +z
      f.x = -21.2; f.y = 0.85; f.z = -15.75; f.rotX = -PI / 2; f.rotY = 0; f.pose = 'sleep'
      f.cam = [-19.2 + Math.sin(t * 0.35) * 0.2, 1.75 + t * 0.045, -14.3 + t * 0.02]
      f.look = [-21.15, 0.9, -16.6]
      break
    case 'rest':
      f.x = 4; f.z = 13.0; f.rotY = PI; f.pose = 'sit'; f.sitY = 0.29
      f.cam = [6.3, 1.5, 10.5]; f.look = [4.1, 1.05, 13]
      break
    case 'shop': {
      const mini = sc.shop === 'kelontong'
      // reach: tangan terulur sebentar setiap kali membeli
      const since = performance.now() - sc.pulseAt
      f.reach = sc.pulseAt && since < 800 ? Math.sin((since / 800) * PI) : 0
      f.fill = Math.min(6, bagCount)
      f.pose = 'browse'; f.hold = 'basket'
      if (mini) { f.x = 9.6; f.z = -8.6; f.rotY = PI; f.cam = [6.9, 1.7, -5.9]; f.look = [11.3, 1.3, -9.4] }
      else { f.x = 22.5; f.z = 8.7; f.rotY = 0; f.cam = [20.2, 1.75, 6.4]; f.look = [24.6, 1.25, 10.2] }
      break
    }
  }
  return f
}
