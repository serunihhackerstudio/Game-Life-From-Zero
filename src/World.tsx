import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { Color, DirectionalLight, Fog, HemisphereLight, MeshStandardMaterial } from 'three'
import { KOS_WALL_H, KOS_WALLS, LAMPS, TREES, ZONES } from './data'
import { Humanoid } from './Humanoid'
import { useGame } from './store'

interface BProps { x: number; y?: number; z: number; w: number; h: number; d: number; color: string; rx?: number; ry?: number }
function B({ x, y = 0, z, w, h, d, color, rx = 0, ry = 0 }: BProps) {
  return (
    <mesh position={[x, y + h / 2, z]} rotation={[rx, ry, 0]} castShadow receiveShadow>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}
const Label = ({ pos, text }: { pos: [number, number, number]; text: string }) => (
  <Html position={pos} center distanceFactor={16} style={{ pointerEvents: 'none' }}>
    <div className="label">{text}</div>
  </Html>
)

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const DAY_SKY = new Color('#8fc7ff'), NIGHT_SKY = new Color('#0a1128'), DUSK = new Color('#ff9a5a')
const tmp = new Color()

const bulbMat = new MeshStandardMaterial({ color: '#fff3c4', emissive: '#ffd98a', emissiveIntensity: 0 })

/** Siklus siang-malam: warna langit, matahari, lampu jalan. */
function DayNight() {
  const dir = useRef<DirectionalLight>(null)
  const hemi = useRef<HemisphereLight>(null)
  const { scene } = useThree()
  useEffect(() => {
    scene.fog = new Fog('#8fc7ff', 40, 110)
    scene.background = new Color('#8fc7ff')
  }, [scene])
  useFrame(() => {
    const h = ((useGame.getState().minute % 1440) / 60)
    const ang = ((h - 6) / 12) * Math.PI
    const sun = Math.sin(ang)
    const k = clamp01(sun * 2.5 + 0.25)
    const dusk = clamp01(1 - Math.abs(sun) / 0.25)
    tmp.copy(NIGHT_SKY).lerp(DAY_SKY, k).lerp(DUSK, dusk * 0.5)
    ;(scene.background as Color).copy(tmp)
    if (scene.fog) (scene.fog as Fog).color.copy(tmp)
    if (dir.current) {
      dir.current.position.set(Math.cos(ang) * 40, Math.max(sun, 0.2) * 45, 18)
      dir.current.intensity = 0.15 + 1.4 * k
      dir.current.color.set(dusk > 0.3 ? '#ffc08a' : k > 0.5 ? '#ffffff' : '#7f9bff')
    }
    if (hemi.current) hemi.current.intensity = 0.25 + 0.6 * k
    bulbMat.emissiveIntensity = (1 - k) * 2.5
  })
  return (
    <>
      <hemisphereLight ref={hemi} args={['#cfe4ff', '#6b7a55', 0.8]} />
      <directionalLight
        ref={dir}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-50} shadow-camera-right={50} shadow-camera-top={40} shadow-camera-bottom={-40}
        shadow-camera-near={1} shadow-camera-far={140}
      />
    </>
  )
}

function Kos() {
  return (
    <group>
      <B x={-18} z={-14} w={10} h={0.1} d={8} color="#b98b5e" />
      {KOS_WALLS.map((w, i) => <B key={i} x={w.x} z={w.z} w={w.w} h={KOS_WALL_H} d={w.d} color="#e8d9b5" />)}
      <B x={-18} y={2.3} z={-10} w={2.4} h={0.3} d={0.4} color="#e8d9b5" />
      {/* kasur */}
      <B x={-21.2} y={0.1} z={-16.6} w={1.8} h={0.4} d={2.2} color="#6b4a2f" />
      <B x={-21.2} y={0.5} z={-16.4} w={1.7} h={0.2} d={1.9} color="#4a6fa5" />
      <B x={-21.2} y={0.7} z={-17.4} w={1.0} h={0.15} d={0.4} color="#f2efe6" />
      {/* meja + kursi + lemari */}
      <B x={-14.5} y={0.1} z={-16.8} w={1.6} h={0.65} d={0.8} color="#8a5a35" />
      <B x={-14.5} y={0.1} z={-15.8} w={0.5} h={0.45} d={0.5} color="#a37042" />
      <B x={-18} y={0.1} z={-17.6} w={1.6} h={2.0} d={0.6} color="#7a5230" />
      <pointLight position={[-18, 2.3, -14]} intensity={14} distance={10} color="#ffe2b0" />
      <Label pos={[-18, 4, -10]} text="Kos Pak Budi" />
      <group position={[-14, 0, -8.5]} rotation={[0, -Math.PI / 2, 0]}>
        <Humanoid look={{ shirt: '#cdbf9a', pants: '#2d2d2d', skin: '#b98660', hair: '#c9c9c9', elder: true, sandals: true }} />
      </group>
      <Label pos={[-14, 2.4, -8.5]} text="Pak Budi" />
    </group>
  )
}

function Warung() {
  return (
    <group>
      <B x={0} z={-13} w={7} h={3.2} d={5} color="#d9a05b" />
      <B x={0} z={-10.2} w={5} h={1.1} d={0.8} color="#7a4b25" />
      <B x={0} y={2.7} z={-10.1} w={6.4} h={0.12} d={1.6} color="#c0392b" rx={0.25} />
      <B x={-1.6} y={1.1} z={-10.3} w={0.5} h={0.3} d={0.4} color="#f1c40f" />
      <B x={1.4} y={1.1} z={-10.3} w={0.6} h={0.25} d={0.4} color="#27ae60" />
      <Label pos={[0, 4.4, -10]} text="Warung" />
    </group>
  )
}

function Gudang() {
  return (
    <group>
      <B x={22} z={-14} w={14} h={7} d={9} color="#8d99a6" />
      <B x={22} z={-9.43} w={6} h={4} d={0.12} color="#5d6d7e" />
      <B x={22} y={4.1} z={-9.4} w={6.4} h={0.25} d={0.3} color="#f39c12" />
      <B x={28} z={-8.2} w={1.2} h={1.2} d={1.2} color="#b9803f" />
      <B x={29.3} z={-8.2} w={1.2} h={1.2} d={1.2} color="#a8722f" />
      <B x={28.6} y={1.2} z={-8.2} w={1.1} h={1.0} d={1.1} color="#c99055" />
      <Label pos={[22, 8.4, -9.5]} text="Gudang Logistik" />
    </group>
  )
}

function Taman() {
  return (
    <group>
      <B x={0} y={0} z={14} w={26} h={0.04} d={10} color="#6aa84f" />
      <B x={4} y={0.4} z={13.2} w={2} h={0.12} d={0.6} color="#8a5a35" />
      <B x={3.2} z={13.2} w={0.12} h={0.4} d={0.5} color="#444" />
      <B x={4.8} z={13.2} w={0.12} h={0.4} d={0.5} color="#444" />
      <B x={4} y={0.55} z={13.5} w={2} h={0.5} d={0.1} color="#8a5a35" />
      <Label pos={[4, 2.2, 13.2]} text="Taman Kota" />
    </group>
  )
}

function Trees() {
  return (
    <>
      {TREES.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.9, 0]} castShadow><cylinderGeometry args={[0.18, 0.25, 1.8, 8]} /><meshStandardMaterial color="#6b4a2f" /></mesh>
          <mesh position={[0, 2.5, 0]} castShadow><coneGeometry args={[1.3, 2.6, 8]} /><meshStandardMaterial color={i % 2 ? '#2f7d3a' : '#3c9448'} /></mesh>
          <mesh position={[0, 3.6, 0]} castShadow><coneGeometry args={[0.95, 1.9, 8]} /><meshStandardMaterial color={i % 2 ? '#3c9448' : '#2f7d3a'} /></mesh>
        </group>
      ))}
    </>
  )
}

function Lamps() {
  return (
    <>
      {LAMPS.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 2, 0]} castShadow><cylinderGeometry args={[0.06, 0.08, 4, 8]} /><meshStandardMaterial color="#333" /></mesh>
          <mesh position={[0, 4.1, 0]} material={bulbMat}><sphereGeometry args={[0.22, 12, 10]} /></mesh>
        </group>
      ))}
    </>
  )
}

function Backdrop() {
  const blocks = useMemo(() => {
    const cols = ['#9aa5b1', '#c9b79c', '#a7b8a0', '#b8a0a0', '#8f9fb8']
    return Array.from({ length: 11 }, (_, i) => ({
      x: -40 + i * 8, z: -28 - (i % 3) * 2, h: 6 + ((i * 7) % 10), w: 6.5, c: cols[i % cols.length],
    }))
  }, [])
  return (
    <>
      {blocks.map((b, i) => <B key={i} x={b.x} z={b.z} w={b.w} h={b.h} d={7} color={b.c} />)}
    </>
  )
}

function Markers() {
  const nearby = useGame((s) => s.nearby)
  return (
    <>
      {ZONES.map((z) => (
        <mesh key={z.id} position={[z.x, 0.06, z.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.55, 0.75, 32]} />
          <meshBasicMaterial color={nearby === z.id ? '#ffd23f' : '#ffffff'} transparent opacity={nearby === z.id ? 0.95 : 0.35} />
        </mesh>
      ))}
    </>
  )
}

export function World() {
  return (
    <>
      <DayNight />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[160, 120]} />
        <meshStandardMaterial color="#7fae5d" />
      </mesh>
      {/* trotoar + jalan */}
      <B x={0} z={-6.7} w={80} h={0.05} d={5.4} color="#cfcfc8" />
      <B x={0} z={0} w={80} h={0.04} d={8} color="#3b3f45" />
      <B x={0} z={4.6} w={80} h={0.05} d={1.2} color="#cfcfc8" />
      {Array.from({ length: 14 }, (_, i) => <B key={i} x={-32.5 + i * 5} y={0.04} z={0} w={2} h={0.01} d={0.2} color="#f5f5f5" />)}
      <Kos /><Warung /><Gudang /><Taman /><Trees /><Lamps /><Backdrop /><Markers />
    </>
  )
}
