import type { Hold, PoseName } from './Humanoid'
import type { SceneInfo } from './store'

export type V3 = [number, number, number]
export interface Frame {
  x: number; y: number; z: number; rotX: number; rotY: number
  pose: PoseName; hold: Hold; speed: number; reach: number; fill: number; sitY: number
  cam: V3; look: V3
}

const base = (): Frame => ({ x: 0, y: 0, z: 0, rotX: 0, rotY: 0, pose: 'stand', hold: 'none', speed: 0, reach: 0, fill: 0, sitY: 0.29, cam: [0, 2, 0], look: [0, 1, 0] })
const PI = Math.PI

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
