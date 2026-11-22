import { useMemo, type ReactNode } from 'react'
import { QuadraticBezierLine, RoundedBox } from '@react-three/drei'
import { DoubleSide, MeshStandardMaterial, type Texture } from 'three'
import { registerGlow } from './glow'
import { signTex, stripes, tiled } from './textures'

type V3 = [number, number, number]

/** Kotak bertekstur: tiap sisi diulang sesuai ukuran nyata (mpt = meter per ubin). */
export function TBox({ x, y = 0, z, w, h, d, tex, mpt = 2, color = '#ffffff', rough = 0.9, metal = 0, ry = 0, rx = 0, mid = false, shadow = true }: {
  x: number; y?: number; z: number; w: number; h: number; d: number; tex: Texture; mpt?: number
  color?: string; rough?: number; metal?: number; ry?: number; rx?: number; mid?: boolean; shadow?: boolean
}) {
  const mats = useMemo(() => {
    const r = (v: number) => Math.max(0.25, Math.round((v / mpt) * 4) / 4)
    const f = (a: number, b: number) => new MeshStandardMaterial({ map: tiled(tex, r(a), r(b)), color, roughness: rough, metalness: metal })
    return [f(d, h), f(d, h), f(w, d), f(w, d), f(w, h), f(w, h)]
  }, [tex, w, h, d, mpt, color, rough, metal])
  return (
    <mesh position={[x, mid ? y : y + h / 2, z]} rotation={[rx, ry, 0]} castShadow={shadow} receiveShadow material={mats}>
      <boxGeometry args={[w, h, d]} />
    </mesh>
  )
}

export function Bx({ x, y = 0, z, w, h, d, c, rough = 0.85, ry = 0, rx = 0, rz = 0, mid = false, metal = 0 }: {
  x: number; y?: number; z: number; w: number; h: number; d: number; c: string
  rough?: number; ry?: number; rx?: number; rz?: number; mid?: boolean; metal?: number
}) {
  return (
    <mesh position={[x, mid ? y : y + h / 2, z]} rotation={[rx, ry, rz]} castShadow receiveShadow>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color={c} roughness={rough} metalness={metal} />
    </mesh>
  )
}
export function Cyl({ p, r, h, c, rot, rough = 0.8, metal = 0, seg = 16, r2 }: { p: V3; r: number; h: number; c: string; rot?: V3; rough?: number; metal?: number; seg?: number; r2?: number }) {
  return (
    <mesh position={p} rotation={rot} castShadow>
      <cylinderGeometry args={[r2 ?? r, r, h, seg]} />
      <meshStandardMaterial color={c} roughness={rough} metalness={metal} />
    </mesh>
  )
}
export function Ball({ p, r, c, s, rough = 0.7, seg = 14 }: { p: V3; r: number; c: string; s?: V3; rough?: number; seg?: number }) {
  return (
    <mesh position={p} scale={s} castShadow>
      <sphereGeometry args={[r, seg, Math.max(8, seg - 4)]} />
      <meshStandardMaterial color={c} roughness={rough} />
    </mesh>
  )
}

/** Papan nama bertulisan (menyala redup di malam hari). */
export function Sign({ text, sub, w = 3, h = 0.75, p, ry = 0, bg = '#f2efe4', fg = '#1b2a3a', glow = 0.5 }: {
  text: string; sub?: string; w?: number; h?: number; p: V3; ry?: number; bg?: string; fg?: string; glow?: number
}) {
  const tex = useMemo(() => signTex(text, bg, fg, w / h, sub), [text, sub, bg, fg, w, h])
  const mat = useMemo(() => registerGlow(new MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: 0, roughness: 0.6 }), glow), [tex, glow])
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <mesh material={mat}><planeGeometry args={[w, h]} /></mesh>
      <Bx x={0} y={0} z={-0.025} w={w + 0.1} h={h + 0.1} d={0.04} c="#2b2b2b" mid />
    </group>
  )
}

/** Jendela berbingkai; kaca menyala hangat di malam hari. */
export function Window({ w = 1.4, h = 1.1, p, ry = 0, frame = '#5a3d27' }: { w?: number; h?: number; p: V3; ry?: number; frame?: string }) {
  const glass = useMemo(() => registerGlow(new MeshStandardMaterial({ color: '#8fb3d1', roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.6, emissive: '#ffcf7a', emissiveIntensity: 0, side: DoubleSide }), 0.9), [])
  const t = 0.07
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <mesh material={glass}><planeGeometry args={[w, h]} /></mesh>
      <Bx x={0} y={h / 2} z={0.02} w={w + t * 2} h={t} d={0.08} c={frame} mid />
      <Bx x={0} y={-h / 2} z={0.02} w={w + t * 2} h={t} d={0.08} c={frame} mid />
      <Bx x={-w / 2} y={0} z={0.02} w={t} h={h} d={0.08} c={frame} mid />
      <Bx x={w / 2} y={0} z={0.02} w={t} h={h} d={0.08} c={frame} mid />
      <Bx x={0} y={0} z={0.02} w={0.04} h={h} d={0.05} c={frame} mid />
      <Bx x={0} y={0} z={0.02} w={w} h={0.04} d={0.05} c={frame} mid />
      <Bx x={0} y={-h / 2 - 0.08} z={0.07} w={w + 0.3} h={0.05} d={0.16} c="#b9b2a4" mid />
    </group>
  )
}

export function Bulb({ p, r = 0.1, s = 2.5 }: { p: V3; r?: number; s?: number }) {
  const m = useMemo(() => registerGlow(new MeshStandardMaterial({ color: '#fff3c4', emissive: '#ffd98a', emissiveIntensity: 0 }), s), [s])
  return <mesh position={p} material={m}><sphereGeometry args={[r, 12, 10]} /></mesh>
}

export function Plant({ p, s = 1 }: { p: V3; s?: number }) {
  const leaves = useMemo(() => Array.from({ length: 9 }, (_, i) => ({ a: (i / 9) * Math.PI * 2, t: 0.35 + (i % 3) * 0.18, c: ['#2f7d3a', '#3c9448', '#27692f'][i % 3] })), [])
  return (
    <group position={p} scale={s}>
      <Cyl p={[0, 0.2, 0]} r={0.2} r2={0.14} h={0.4} c="#a4552f" rough={0.9} />
      <Cyl p={[0, 0.41, 0]} r={0.21} h={0.04} c="#8a4524" />
      {leaves.map((l, i) => (
        <mesh key={i} position={[Math.sin(l.a) * 0.1, 0.65, Math.cos(l.a) * 0.1]} rotation={[Math.cos(l.a) * l.t, 0, -Math.sin(l.a) * l.t]} castShadow>
          <capsuleGeometry args={[0.045, 0.55, 4, 8]} />
          <meshStandardMaterial color={l.c} roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

export function Tree({ p, seed = 0 }: { p: V3; seed?: number }) {
  const blobs = useMemo(() => {
    const cols = ['#2f7d3a', '#3c9448', '#4aa457', '#2a6e33']
    return Array.from({ length: 6 }, (_, i) => {
      const a = i * 2.4 + seed
      return { x: Math.cos(a) * 0.9 * (i ? 1 : 0), y: 3.3 + (i % 3) * 0.55 + (i ? 0 : 0.5), z: Math.sin(a) * 0.9 * (i ? 1 : 0), r: 1.15 - i * 0.08, c: cols[(i + Math.floor(seed * 10)) % 4] }
    })
  }, [seed])
  return (
    <group position={p} rotation={[0, seed, 0]}>
      <mesh position={[0, 1.4, 0]} rotation={[0.05, 0, 0.04]} castShadow><cylinderGeometry args={[0.16, 0.26, 2.8, 8]} /><meshStandardMaterial color="#6b4a2f" roughness={0.95} /></mesh>
      <mesh position={[0.35, 2.7, 0]} rotation={[0, 0, -0.7]} castShadow><cylinderGeometry args={[0.07, 0.11, 1.1, 6]} /><meshStandardMaterial color="#6b4a2f" roughness={0.95} /></mesh>
      {blobs.map((b, i) => (
        <mesh key={i} position={[b.x, b.y, b.z]} castShadow receiveShadow>
          <icosahedronGeometry args={[b.r, 1]} />
          <meshStandardMaterial color={b.c} roughness={0.9} flatShading />
        </mesh>
      ))}
    </group>
  )
}

export function Pole({ x, z, h = 7.5 }: { x: number; z: number; h?: number }) {
  return (
    <group position={[x, 0, z]}>
      <Cyl p={[0, h / 2, 0]} r={0.11} r2={0.15} h={h} c="#7d7d78" rough={0.95} />
      <Bx x={0} y={h - 0.9} z={0} w={0.1} h={0.1} d={1.6} c="#4a3322" mid />
      <Bx x={0} y={h - 0.3} z={0} w={0.1} h={0.1} d={1.2} c="#4a3322" mid />
      <Cyl p={[0, h - 1.4, 0]} r={0.3} h={0.7} c="#6e7a83" metal={0.3} />
    </group>
  )
}
export function Wire({ a, b, y = 6.6, z = 0, sag = 0.6 }: { a: number; b: number; y?: number; z?: number; sag?: number }) {
  return <QuadraticBezierLine start={[a, y, z]} end={[b, y, z]} mid={[(a + b) / 2, y - sag, z]} color="#1b1b1b" lineWidth={1.2} />
}

export function Motorbike({ color = '#c0392b', rider, riderColor = '#3a6ea5', helmet = '#f1c40f' }: { color?: string; rider?: boolean; riderColor?: string; helmet?: string }) {
  const head = useMemo(() => registerGlow(new MeshStandardMaterial({ color: '#fff7d6', emissive: '#fff1b0', emissiveIntensity: 0 }), 3), [])
  const wheel = (x: number) => (
    <group position={[x, 0.3, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.3, 0.3, 0.11, 18]} /><meshStandardMaterial color="#1a1a1a" roughness={0.9} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.16, 0.16, 0.12, 14]} /><meshStandardMaterial color="#b8bcc2" metalness={0.7} roughness={0.35} /></mesh>
    </group>
  )
  return (
    <group>
      {wheel(0.62)}{wheel(-0.62)}
      <Bx x={-0.05} y={0.3} z={0} w={1.0} h={0.22} d={0.22} c="#2a2a2a" mid metal={0.5} />
      <Bx x={-0.08} y={0.55} z={0} w={0.55} h={0.28} d={0.3} c={color} mid rough={0.4} />
      <Bx x={0.2} y={0.68} z={0} w={0.35} h={0.2} d={0.26} c={color} mid rough={0.4} />
      <Bx x={-0.4} y={0.7} z={0} w={0.6} h={0.1} d={0.3} c="#161616" mid />
      <Bx x={-0.72} y={0.42} z={0} w={0.4} h={0.05} d={0.26} c={color} mid rz={0.2} />
      <Bx x={0.5} y={0.62} z={0} w={0.07} h={0.6} d={0.07} c="#aaa" mid rz={0.25} metal={0.7} />
      <Bx x={0.45} y={0.98} z={0} w={0.06} h={0.06} d={0.7} c="#222" mid />
      <mesh position={[0.62, 0.86, 0]} material={head}><sphereGeometry args={[0.09, 12, 10]} /></mesh>
      <Bx x={-0.84} y={0.62} z={0} w={0.05} h={0.07} d={0.14} c="#d62020" mid />
      {rider && (
        <group position={[-0.28, 0.76, 0]}>
          <mesh position={[0.05, 0.38, 0]} rotation={[0, 0, -0.35]} castShadow><capsuleGeometry args={[0.15, 0.32, 5, 10]} /><meshStandardMaterial color={riderColor} roughness={0.85} /></mesh>
          <Ball p={[0.27, 0.9, 0]} r={0.14} c="#c68e64" />
          <mesh position={[0.27, 0.95, 0]} scale={[1, 0.9, 1]} castShadow><sphereGeometry args={[0.18, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62]} /><meshStandardMaterial color={helmet} roughness={0.3} /></mesh>
          <mesh position={[0.32, 0.18, 0.15]} rotation={[0.4, 0, -1.2]} castShadow><capsuleGeometry args={[0.045, 0.42, 4, 8]} /><meshStandardMaterial color={riderColor} /></mesh>
          <mesh position={[0.32, 0.18, -0.15]} rotation={[-0.4, 0, -1.2]} castShadow><capsuleGeometry args={[0.045, 0.42, 4, 8]} /><meshStandardMaterial color={riderColor} /></mesh>
          <mesh position={[0.1, -0.25, 0.14]} rotation={[0, 0, 0.3]} castShadow><capsuleGeometry args={[0.065, 0.4, 4, 8]} /><meshStandardMaterial color="#2c3e50" /></mesh>
          <mesh position={[0.1, -0.25, -0.14]} rotation={[0, 0, 0.3]} castShadow><capsuleGeometry args={[0.065, 0.4, 4, 8]} /><meshStandardMaterial color="#2c3e50" /></mesh>
        </group>
      )}
    </group>
  )
}

/** Gerobak es teh manis (seperti di gambar referensi). */
export function Cart({ p, ry = 0 }: { p: V3; ry?: number }) {
  const st = useMemo(() => stripes('#e07b1a', '#f4efe6'), [])
  const ust = useMemo(() => tiled(st, 3, 1), [st])
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <Bx x={0} y={0.45} z={0} w={1.7} h={0.8} d={0.9} c="#d98a3d" mid rough={0.7} />
      <Bx x={0} y={0.88} z={0} w={1.8} h={0.06} d={1.0} c="#8a5a35" mid />
      <Bx x={0} y={0.55} z={0.46} w={1.2} h={0.5} d={0.02} c="#fff3d8" mid />
      <Sign text="ES TEH MANIS" w={1.3} h={0.45} p={[0, 0.55, 0.48]} bg="#f4efe6" fg="#c0392b" glow={0.2} />
      {[-0.55, -0.15, 0.25].map((x) => <Cyl key={x} p={[x, 1.12, 0.1]} r={0.14} h={0.4} c="#d9eef5" rough={0.1} />)}
      {[-0.55, -0.15, 0.25].map((x) => <Cyl key={'l' + x} p={[x, 1.34, 0.1]} r={0.15} h={0.04} c="#c0392b" />)}
      <Ball p={[0.65, 1.05, -0.1]} r={0.12} c="#e8e2d4" />
      <Cyl p={[0.2, 1.55, -0.3]} r={0.025} h={1.6} c="#555" />
      <mesh position={[0.2, 2.45, -0.3]} castShadow><coneGeometry args={[1.25, 0.45, 16]} /><meshStandardMaterial map={ust} roughness={0.8} side={DoubleSide} /></mesh>
      {[-0.55, 0.55].map((x) => (
        <mesh key={x} position={[x, 0.3, 0.52]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.3, 0.3, 0.07, 18]} /><meshStandardMaterial color="#222" /></mesh>
      ))}
      <Bx x={-1.2} y={0.55} z={0} w={0.7} h={0.04} d={0.05} c="#6b4a2f" mid />
    </group>
  )
}

export function Truck({ p, ry = 0 }: { p: V3; ry?: number }) {
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <Bx x={-0.6} y={0.55} z={0} w={3.6} h={2.3} d={2.2} c="#eceff1" />
      <Bx x={-0.6} y={0.55} z={1.11} w={3.6} h={0.5} d={0.02} c="#1f5e8c" />
      <Sign text="LOGISTIK" w={1.8} h={0.5} p={[-0.6, 1.9, 1.12]} bg="#eceff1" fg="#1f5e8c" glow={0} />
      <Bx x={1.7} y={0.55} z={0} w={1.3} h={1.5} d={2.1} c="#1f5e8c" rough={0.5} />
      <Bx x={2.1} y={1.5} z={0} w={0.6} h={0.55} d={2.0} c="#9ec9e6" rough={0.1} />
      <Bx x={-0.6} y={0.35} z={0} w={4.2} h={0.25} d={1.9} c="#2a2a2a" />
      {[-1.6, 0.4, 1.9].map((x) => [1, -1].map((s) => (
        <mesh key={x + ':' + s} position={[x, 0.42, s * 1.0]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.42, 0.42, 0.28, 18]} /><meshStandardMaterial color="#1a1a1a" /></mesh>
      )))}
    </group>
  )
}

export function Stool({ p, c = '#c0392b', h = 0.4 }: { p: V3; c?: string; h?: number }) {
  return (
    <group position={p}>
      <Cyl p={[0, h, 0]} r={0.22} h={0.06} c={c} rough={0.5} />
      {[0, 1, 2, 3].map((i) => <Cyl key={i} p={[Math.cos(i * 1.57 + 0.78) * 0.15, h / 2, Math.sin(i * 1.57 + 0.78) * 0.15]} r={0.025} h={h} c={c} rough={0.5} />)}
    </group>
  )
}
export const Barrel = ({ p, c = '#1f5e8c' }: { p: V3; c?: string }) => (
  <group position={p}><Cyl p={[0, 0.45, 0]} r={0.3} h={0.9} c={c} rough={0.5} metal={0.4} /><Cyl p={[0, 0.3, 0]} r={0.31} h={0.04} c="#222" /><Cyl p={[0, 0.65, 0]} r={0.31} h={0.04} c="#222" /></group>
)
export const Bin = ({ p, c = '#2e7d4f' }: { p: V3; c?: string }) => (
  <group position={p}><Cyl p={[0, 0.4, 0]} r={0.26} r2={0.22} h={0.8} c={c} rough={0.6} /><Cyl p={[0, 0.82, 0]} r={0.28} h={0.05} c="#1d5a37" /></group>
)
export function Pallet({ p, h = 3 }: { p: V3; h?: number }) {
  return (
    <group position={p}>
      <Bx x={0} z={0} w={1.2} h={0.12} d={1.2} c="#a8793f" />
      {Array.from({ length: h }, (_, i) => <Bx key={i} x={0} y={0.12 + i * 0.4} z={0} w={1.1} h={0.4} d={1.1} c={['#c99055', '#b9803f', '#d4a066'][i % 3]} />)}
    </group>
  )
}
export function Flowers({ p, w, d }: { p: V3; w: number; d: number }) {
  const dots = useMemo(() => Array.from({ length: 28 }, (_, i) => ({ x: ((i * 37) % 100) / 100 - 0.5, z: ((i * 61) % 100) / 100 - 0.5, c: ['#e74c3c', '#f1c40f', '#ff7eb6', '#fff'][i % 4] })), [])
  return (
    <group position={p}>
      <Bx x={0} z={0} w={w} h={0.3} d={d} c="#7a5a3a" />
      <Bx x={0} y={0.3} z={0} w={w - 0.12} h={0.04} d={d - 0.12} c="#3a2a1a" />
      {dots.map((f, i) => (
        <group key={i} position={[f.x * (w - 0.3), 0.36, f.z * (d - 0.3)]}>
          <Cyl p={[0, 0.08, 0]} r={0.012} h={0.2} c="#2f7d3a" />
          <Ball p={[0, 0.2, 0]} r={0.06} c={f.c} seg={8} />
        </group>
      ))}
    </group>
  )
}
export const Group = ({ children }: { children: ReactNode }) => <group>{children}</group>
