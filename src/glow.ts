import type { MeshStandardMaterial } from 'three'

// Material yang menyala di malam hari (lampu, jendela, papan nama).
const list: { m: MeshStandardMaterial; s: number }[] = []
export function registerGlow<T extends MeshStandardMaterial>(m: T, s: number): T {
  list.push({ m, s })
  return m
}
export function updateGlow(night: number) {
  for (const { m, s } of list) m.emissiveIntensity = night * s
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
/** Faktor siang (k: 0 malam..1 siang), senja, dan tinggi matahari untuk jam h. */
export function daylight(h: number) {
  const ang = ((h - 6) / 12) * Math.PI
  const sun = Math.sin(ang)
  return { ang, sun, k: clamp01(sun * 2.5 + 0.25), dusk: clamp01(1 - Math.abs(sun) / 0.25) }
}
