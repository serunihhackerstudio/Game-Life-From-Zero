import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment, Html, Lightformer } from '@react-three/drei'
import { Color, DirectionalLight, Fog, HemisphereLight, MeshStandardMaterial, PointLight, Sprite } from 'three'
import { KOS_WALL_H, KOS_WALLS, LAMPS, TREES, ZONES } from './data'
import { daylight, registerGlow, updateGlow } from './glow'
import { Humanoid } from './Humanoid'
import { Barrel, Bin, Bulb, Bx, Cart, Cyl, Flowers, Motorbike, Pallet, Plant, Pole, Sign, Stool, TBox, Tree, Truck, Window, Wire } from './props'
import { asphalt, cloudTex, facade, facadeEmissive, grass, hazard, metal, pavement, plaster, roofTile, rollerDoor, stripes, tiled, wood } from './textures'
import { Traffic } from './Traffic'
import { useGame } from './store'

const Label = ({ pos, text }: { pos: [number, number, number]; text: string }) => (
  <Html position={pos} center distanceFactor={16} style={{ pointerEvents: 'none' }}>
    <div className="label">{text}</div>
  </Html>
)

const DAY_SKY = new Color('#8fc7ff'), NIGHT_SKY = new Color('#0a1128'), DUSK = new Color('#ff9a5a')
const tmp = new Color()

/** Siklus siang-malam: warna langit, matahari, lampu jalan, jendela. */
function DayNight() {
  const dir = useRef<DirectionalLight>(null)
  const hemi = useRef<HemisphereLight>(null)
  const { scene } = useThree()
  useEffect(() => {
    scene.fog = new Fog('#8fc7ff', 45, 120)
    scene.background = new Color('#8fc7ff')
  }, [scene])
  useFrame(() => {
    const { ang, sun, k, dusk } = daylight((useGame.getState().minute % 1440) / 60)
    tmp.copy(NIGHT_SKY).lerp(DAY_SKY, k).lerp(DUSK, dusk * 0.5)
    ;(scene.background as Color).copy(tmp)
    if (scene.fog) (scene.fog as Fog).color.copy(tmp)
    if (dir.current) {
      dir.current.position.set(Math.cos(ang) * 40, Math.max(sun, 0.2) * 45, 18)
      dir.current.intensity = 0.15 + 1.4 * k
      dir.current.color.set(dusk > 0.3 ? '#ffc08a' : k > 0.5 ? '#ffffff' : '#7f9bff')
    }
    if (hemi.current) hemi.current.intensity = 0.25 + 0.6 * k
    scene.environmentIntensity = 0.04 + 0.4 * k
    updateGlow(1 - k)
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
        shadow-bias={-0.0004}
      />
    </>
  )
}

function Clouds() {
  const tex = useMemo(() => cloudTex(), [])
  const refs = useRef<(Sprite | null)[]>([])
  const spec = useMemo(() => Array.from({ length: 8 }, (_, i) => ({ x: -90 + i * 26, y: 48 + (i % 3) * 9, z: -95 - (i % 2) * 20, s: 55 + (i % 4) * 12, v: 0.5 + (i % 3) * 0.25 })), [])
  useFrame((_, dt) => {
    const { k } = daylight((useGame.getState().minute % 1440) / 60)
    refs.current.forEach((sp, i) => {
      if (!sp) return
      sp.position.x += spec[i].v * Math.min(dt, 0.05)
      if (sp.position.x > 110) sp.position.x = -110
      const m = sp.material
      m.opacity = 0.15 + 0.7 * k
      m.color.setScalar(0.35 + 0.65 * k)
    })
  })
  return (
    <>
      {spec.map((c, i) => (
        <sprite key={i} ref={(r) => { refs.current[i] = r }} position={[c.x, c.y, c.z]} scale={[c.s, c.s * 0.5, 1]}>
          <spriteMaterial map={tex} transparent depthWrite={false} fog={false} />
        </sprite>
      ))}
    </>
  )
}

/** Rumah kos: dinding plester, jendela, papan nama, teras, kamar berisi. */
function Kos() {
  const wall = useMemo(() => plaster('#e8d9b5'), [])
  const inner = useMemo(() => plaster('#efe6cf'), [])
  const floor = useMemo(() => wood('#b98b5e'), [])
  const dado = useMemo(() => plaster('#7d6b57'), [])
  const roof = useMemo(() => roofTile(), [])
  const conc = useMemo(() => pavement(), [])
  return (
    <group>
      <TBox x={-18} z={-14} w={10} h={0.1} d={8} tex={floor} mpt={1.5} />
      {KOS_WALLS.map((w, i) => <TBox key={i} x={w.x} z={w.z} w={w.w} h={KOS_WALL_H} d={w.d} tex={i === 0 ? inner : wall} mpt={2.4} />)}
      {/* list bawah (dado) + teras */}
      <TBox x={-21.1} z={-9.78} w={3.8} h={0.55} d={0.06} tex={dado} mpt={1} />
      <TBox x={-14.9} z={-9.78} w={3.8} h={0.55} d={0.06} tex={dado} mpt={1} />
      <TBox x={-18} z={-9.25} w={3.4} h={0.14} d={1.1} tex={conc} mpt={1} />
      {/* kusen pintu + ambang */}
      <Bx x={-19.2} z={-10} w={0.14} h={2.3} d={0.5} c="#4a2f1b" />
      <Bx x={-16.8} z={-10} w={0.14} h={2.3} d={0.5} c="#4a2f1b" />
      <Bx x={-18} y={2.3} z={-10} w={2.6} h={0.3} d={0.42} c="#4a2f1b" />
      <Bx x={-18} y={0.15} z={-9.1} w={1.2} h={0.03} d={0.7} c="#5b3a22" rough={1} />
      {/* jendela depan */}
      <Window p={[-21.1, 1.4, -9.76]} w={1.5} h={1.1} />
      <Window p={[-14.9, 1.4, -9.76]} w={1.5} h={1.1} />
      {/* papan nama di atas dinding + atap miring kecil */}
      <Bx x={-18} y={2.6} z={-10} w={4.2} h={1.05} d={0.22} c="#5b3a22" />
      <Sign text="KOS PAK BUDI" sub="Putra & Putri · Wifi · Km. Dalam" w={3.9} h={0.9} p={[-18, 3.12, -9.87]} />
      <TBox x={-18} y={2.95} z={-9.55} w={4.6} h={0.07} d={1.5} tex={roof} mpt={1.2} rx={0.18} mid />
      {/* tanaman pot di teras */}
      <Plant p={[-20.4, 0.14, -9.3]} s={1.1} />
      <Plant p={[-15.6, 0.14, -9.3]} s={1.2} />
      <Bx x={-23.4} z={-12.2} w={0.5} h={0.9} d={0.45} c="#6e7a83" metal={0.2} />{/* meteran listrik */}
      <Bx x={-23.4} y={0.95} z={-12.2} w={0.46} h={0.3} d={0.4} c="#cfd6dc" />

      {/* isi kamar */}
      <Bx x={-21.2} y={0.1} z={-16.6} w={1.8} h={0.4} d={2.2} c="#6b4a2f" />
      <Bx x={-21.2} y={0.5} z={-16.4} w={1.7} h={0.2} d={1.9} c="#4a6fa5" />
      <Bx x={-21.2} y={0.7} z={-15.65} w={1.72} h={0.04} d={0.5} c="#dfe7f2" />
      <Bx x={-21.2} y={0.7} z={-17.4} w={1.0} h={0.15} d={0.4} c="#f2efe6" />
      <Bx x={-18} y={0.11} z={-13.9} w={3} h={0.02} d={2.2} c="#7a3b3b" rough={1} />
      <Bx x={-18} y={0.12} z={-13.9} w={2.5} h={0.02} d={1.7} c="#a85a4a" rough={1} />
      <Bx x={-14.5} y={0.1} z={-16.8} w={1.6} h={0.65} d={0.8} c="#8a5a35" />
      <Bx x={-14.5} y={0.1} z={-15.8} w={0.5} h={0.45} d={0.5} c="#a37042" />
      <Bx x={-14.9} y={0.75} z={-16.8} w={0.45} h={0.03} d={0.3} c="#2a2f36" metal={0.6} />{/* laptop */}
      <Bx x={-14.9} y={0.78} z={-17.07} w={0.45} h={0.3} d={0.02} c="#14181d" rx={-0.2} />
      <Cyl p={[-14.0, 0.9, -16.9]} r={0.15} h={0.04} c="#ddd" rough={0.4} />
      <Cyl p={[-14.0, 0.97, -16.9]} r={0.03} h={0.2} c="#bbb" />
      <mesh position={[-14, 1.1, -16.85]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.14, 0.012, 6, 24]} /><meshStandardMaterial color="#aaa" /></mesh>
      <Bx x={-18} y={0.1} z={-17.6} w={1.6} h={2.0} d={0.6} c="#7a5230" />
      <Bx x={-18.4} y={0.1} z={-17.29} w={0.02} h={1.9} d={0.02} c="#3a2614" />
      <Window p={[-15.2, 1.5, -17.78]} w={1.1} h={0.9} />
      <Window p={[-22.78, 1.5, -13.2]} ry={Math.PI / 2} w={1.1} h={0.9} />
      <Sign text="START FROM ZERO" w={0.9} h={1.15} p={[-21.2, 1.75, -17.78]} bg="#1f5e8c" fg="#ffffff" glow={0.2} />
      <Bx x={-18} y={0.1} z={-10.6} w={0.5} h={0.5} d={0.4} c="#44505c" />{/* sepatu rak */}
      <Bulb p={[-18, 2.35, -14]} r={0.09} />
      <Cyl p={[-18, 2.55, -14]} r={0.008} h={0.4} c="#222" />
      <pointLight position={[-18, 2.1, -14]} intensity={14} distance={10} color="#ffe2b0" />

      <group position={[-14, 0, -8.5]} rotation={[0, -Math.PI / 2, 0]}>
        <Humanoid look={{ shirt: '#cdbf9a', pants: '#2d2d2d', skin: '#b98660', hair: '#c9c9c9', elder: true, sandals: true }} />
      </group>
      <Label pos={[-14, 2.4, -8.5]} text="Pak Budi" />
    </group>
  )
}

/** Warung pecel: atap seng, awning belang, etalase, kompor, bangku plastik. */
function Warung() {
  const wall = useMemo(() => plaster('#e3a455'), [])
  const tin = useMemo(() => metal('#8a97a3'), [])
  const woodT = useMemo(() => wood('#8a5a35'), [])
  const awn = useMemo(() => stripes('#c0392b', '#f4efe6'), [])
  return (
    <group>
      <TBox x={0} z={-13} w={7} h={3.2} d={5} tex={wall} mpt={2.2} />
      <TBox x={0} y={3.2} z={-12.95} w={7.6} h={0.14} d={5.3} tex={tin} mpt={1.5} metal={0.5} rough={0.5} />
      
      {/* jendela layan gelap + meja */}
      <Bx x={0} y={1.1} z={-10.47} w={3.5} h={1.15} d={0.05} c="#2a1e16" />
      <TBox x={0} z={-10.2} w={5} h={1.1} d={0.8} tex={woodT} mpt={1} />
      <Bx x={0} y={1.1} z={-10.2} w={5.1} h={0.07} d={0.9} c="#6b4a2f" />
      {/* awning belang */}
      <TBox x={0} y={2.1} z={-9.8} w={6.3} h={0.07} d={1.9} tex={awn} mpt={0.8} rx={0.24} mid />
      <Bx x={-3.1} y={0} z={-9.0} w={0.08} h={1.95} d={0.08} c="#4a3322" />
      <Bx x={3.1} y={0} z={-9.0} w={0.08} h={1.95} d={0.08} c="#4a3322" />
      <Sign text="WARUNG PECEL BU SARI" sub="Nasi · Lauk · Es Teh" w={4.6} h={0.78} p={[0, 2.85, -10.46]} bg="#f4efe6" fg="#8b1a1a" />
      <Sign text="MENU Pecel Rp12.000" w={1.05} h={1.2} p={[2.75, 1.7, -10.44]} bg="#222" fg="#ffe9a8" glow={0.3} />
      {/* di atas meja: etalase kaca, panci, piring, tabung gas */}
      <Bx x={-1.4} y={1.18} z={-10.2} w={1.4} h={0.55} d={0.55} c="#bfe3f0" rough={0.1} />
      {[-1.8, -1.55, -1.3, -1.05].map((x, i) => <Bx key={x} x={x} y={1.2} z={-10.2} w={0.2} h={0.2} d={0.3} c={['#c0392b', '#f1c40f', '#27ae60', '#e67e22'][i]} />)}
      <Cyl p={[1.0, 1.4, -10.2]} r={0.25} h={0.32} c="#c8ccd2" metal={0.7} rough={0.3} />
      <Cyl p={[1.0, 1.58, -10.2]} r={0.26} h={0.04} c="#9aa0a6" metal={0.7} />
      <Cyl p={[1.7, 1.28, -10.15]} r={0.13} h={0.06} c="#f4efe6" />
      <Cyl p={[1.7, 1.32, -10.15]} r={0.13} h={0.06} c="#f4efe6" />
      <Cyl p={[3.0, 0.4, -10.2]} r={0.2} h={0.7} c="#3e9b4f" rough={0.5} metal={0.3} />
      <Cyl p={[3.0, 0.78, -10.2]} r={0.08} h={0.08} c="#333" />
      <Bulb p={[-1.8, 1.9, -10.0]} r={0.09} />
      <Bulb p={[1.8, 1.9, -10.0]} r={0.09} />
      <pointLight position={[0, 2.1, -9.7]} intensity={6} distance={6} color="#ffd9a0" />
      <Stool p={[-3.4, 0, -9.3]} />
      <Stool p={[3.4, 0, -9.3]} c="#2c6fb5" />
      <Bin p={[5.4, 0, -8.8]} />
    </group>
  )
}

/** Gudang logistik: dinding seng, pintu rolling, rambu, palet, truk. */
function Gudang() {
  const wall = useMemo(() => metal('#7e8b98'), [])
  const roller = useMemo(() => rollerDoor(), [])
  const hz = useMemo(() => hazard(), [])
  return (
    <group>
      <TBox x={22} z={-14} w={14} h={7} d={9} tex={wall} mpt={2} metal={0.35} rough={0.6} />
      <Bx x={22} y={7} z={-14} w={14.5} h={0.45} d={9.5} c="#5f6b77" />
      <TBox x={22} z={-9.44} w={6} h={4} d={0.12} tex={roller} mpt={2} metal={0.4} rough={0.5} />
      <TBox x={18.8} z={-9.4} w={0.35} h={4.2} d={0.25} tex={hz} mpt={0.35} />
      <TBox x={25.2} z={-9.4} w={0.35} h={4.2} d={0.25} tex={hz} mpt={0.35} />
      <TBox x={22} y={4.15} z={-9.4} w={6.7} h={0.3} d={0.25} tex={hz} mpt={0.35} />
      <Bx x={16.9} z={-9.42} w={1.2} h={2.3} d={0.1} c="#3d4650" />
      <Bx x={16.9} y={1.5} z={-9.36} w={0.6} h={0.5} d={0.04} c="#8fb3d1" rough={0.2} />
      <Sign text="GUDANG LOGISTIK" sub="PT Harapan Jaya Logistik" w={7} h={1.3} p={[22, 5.7, -9.4]} bg="#1f5e8c" fg="#ffffff" />
      <Sign text="LOADING" w={1.4} h={0.4} p={[22, 4.45, -9.25]} bg="#f1c40f" fg="#111" glow={0.3} />
      <Bulb p={[19.3, 4.7, -9.2]} r={0.14} s={3} />
      <Bulb p={[24.7, 4.7, -9.2]} r={0.14} s={3} />
      <Bx x={28} z={-8.2} w={1.2} h={1.2} d={1.2} c="#b9803f" />
      <Bx x={29.3} z={-8.2} w={1.2} h={1.2} d={1.2} c="#a8722f" />
      <Bx x={28.6} y={1.2} z={-8.2} w={1.1} h={1.0} d={1.1} c="#c99055" />
      <Pallet p={[16.8, 0, -8.2]} h={4} />
      <Barrel p={[26.4, 0, -8.4]} />
      <Barrel p={[26.4, 0, -7.7]} c="#c0392b" />
      <Truck p={[33.5, 0, -7.8]} />
    </group>
  )
}

function Taman() {
  const g = useMemo(() => grass(), [])
  const conc = useMemo(() => pavement(), [])
  const woodT = useMemo(() => wood('#8a5a35'), [])
  return (
    <group>
      <TBox x={0} z={14} w={26} h={0.05} d={10} tex={g} mpt={4} rough={1} shadow={false} />
      <TBox x={4} z={10.8} w={1.8} h={0.06} d={5.6} tex={conc} mpt={1.2} shadow={false} />
      <TBox x={4} z={13.6} w={7} h={0.06} d={1.2} tex={conc} mpt={1.2} shadow={false} />
      <TBox x={4} y={0.4} z={13.2} w={2} h={0.12} d={0.6} tex={woodT} mpt={1} />
      <Bx x={3.2} z={13.2} w={0.12} h={0.4} d={0.5} c="#444" />
      <Bx x={4.8} z={13.2} w={0.12} h={0.4} d={0.5} c="#444" />
      <Bx x={4} y={0.55} z={13.5} w={2} h={0.5} d={0.1} c="#8a5a35" />
      <Bx x={-3} y={0.4} z={15.8} w={2} h={0.12} d={0.6} c="#8a5a35" />
      <Flowers p={[-8, 0.05, 12]} w={4} d={1.4} />
      <Flowers p={[9.5, 0.05, 16.8]} w={3} d={1.2} />
      {[-5, 12].map((x) => (
        <group key={x} position={[x, 0, 11]}>
          <Cyl p={[0, 1.7, 0]} r={0.05} r2={0.07} h={3.4} c="#2b2b2b" />
          <Bulb p={[0, 3.5, 0]} r={0.2} s={2.5} />
        </group>
      ))}
      <Sign text="TAMAN KOTA" w={1.8} h={0.55} p={[-1.5, 1.6, 9.25]} ry={Math.PI} bg="#2e7d4f" fg="#fff" glow={0.25} />
      <Bx x={-1.5} z={9.3} w={0.1} h={1.35} d={0.1} c="#444" />
    </group>
  )
}

function Trees() {
  return <>{TREES.map(([x, z], i) => <Tree key={i} p={[x, 0, z]} seed={i * 1.3} />)}</>
}

/** Cahaya lampu jalan: menyala hanya saat malam. */
function LampLights() {
  const refs = useRef<(PointLight | null)[]>([])
  useFrame(() => {
    const { k } = daylight((useGame.getState().minute % 1440) / 60)
    refs.current.forEach((l) => { if (l) l.intensity = (1 - k) * 30 })
  })
  return (
    <>
      {LAMPS.map(([x, z], i) => (
        <pointLight key={i} ref={(r) => { refs.current[i] = r }} position={[x + 0.7, 3.6, z]} intensity={0} distance={11} decay={2} color="#ffd9a0" />
      ))}
    </>
  )
}

function Lamps() {
  return (
    <>
      {LAMPS.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <Cyl p={[0, 2, 0]} r={0.06} r2={0.09} h={4} c="#333" />
          <Bx x={0.35} y={3.95} z={0} w={0.7} h={0.06} d={0.06} c="#333" />
          <Bulb p={[0.7, 3.9, 0]} r={0.2} s={2.5} />
        </group>
      ))}
    </>
  )
}

function Utilities() {
  return (
    <>
      {[-26, 9, 33].map((x) => <Pole key={x} x={x} z={-4.9} />)}
      {[[-26, 9], [9, 33]].map(([a, b], i) => (
        <group key={i}>
          <Wire a={a} b={b} y={6.8} z={-5.3} />
          <Wire a={a} b={b} y={6.8} z={-4.5} />
          <Wire a={a} b={b} y={6.2} z={-5.0} sag={0.5} />
          <Wire a={a} b={b} y={6.2} z={-4.8} sag={0.55} />
        </group>
      ))}
      <Wire a={-26} b={-37} y={6.8} z={-5.3} /><Wire a={-26} b={-37} y={6.8} z={-4.5} />
    </>
  )
}

/** Gedung-gedung latar kota (jendela bertekstur, menyala di malam hari). */
function Backdrop() {
  const specs = useMemo(() => {
    const cols = ['#c9b79c', '#9aa5b1', '#b8a0a0', '#a7b8a0', '#d7c3a1', '#8f9fb8']
    const north = Array.from({ length: 12 }, (_, i) => ({ x: -44 + i * 8, z: -29 - (i % 3) * 2.5, h: 7 + ((i * 7) % 11), c: cols[i % 6], seed: i + 1, tank: i % 3 === 0 }))
    const south = Array.from({ length: 12 }, (_, i) => ({ x: -44 + i * 8, z: 33 + (i % 3) * 2.5, h: 6 + ((i * 5) % 12), c: cols[(i + 2) % 6], seed: i + 20, tank: i % 4 === 1 }))
    return [...north, ...south]
  }, [])
  const mats = useMemo(() => {
    const m = new Map<string, MeshStandardMaterial>()
    for (const s of specs) {
      const key = s.c + s.seed
      if (m.has(key)) continue
      const t = facade(s.c, s.seed)
      const mat = new MeshStandardMaterial({ map: tiled(t, 1.6, 1.6), emissiveMap: tiled(facadeEmissive(t), 1.6, 1.6), emissive: '#ffffff', emissiveIntensity: 0, roughness: 0.9 })
      registerGlow(mat, 1.1)
      m.set(key, mat)
    }
    return m
  }, [specs])
  const roofMat = useMemo(() => new MeshStandardMaterial({ color: '#59616b', roughness: 0.9 }), [])
  return (
    <>
      {specs.map((b, i) => {
        const m = mats.get(b.c + b.seed)!
        return (
          <group key={i} position={[b.x, 0, b.z]}>
            <mesh position={[0, b.h / 2, 0]} castShadow receiveShadow material={m}><boxGeometry args={[7.2, b.h, 8]} /></mesh>
            <mesh position={[0, b.h + 0.2, 0]} material={roofMat}><boxGeometry args={[7.5, 0.4, 8.3]} /></mesh>
            {b.tank && <Cyl p={[1.5, b.h + 1.1, 1]} r={0.9} h={1.6} c="#3f6f9a" metal={0.3} />}
          </group>
        )
      })}
    </>
  )
}

function Markers() {
  const nearby = useGame((s) => s.nearby)
  return (
    <>
      {ZONES.map((z) => (
        <mesh key={z.id} position={[z.x, 0.08, z.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.55, 0.75, 32]} />
          <meshBasicMaterial color={nearby === z.id ? '#ffd23f' : '#ffffff'} transparent opacity={nearby === z.id ? 0.95 : 0.35} />
        </mesh>
      ))}
    </>
  )
}

function Street() {
  const ground = useMemo(() => grass(), [])
  const road = useMemo(() => asphalt(), [])
  const walk = useMemo(() => pavement(), [])
  const curb = useMemo(() => plaster('#b9b8b0'), [])
  return (
    <>
      <TBox x={0} y={-0.03} z={0} w={170} h={0.06} d={130} tex={ground} mpt={5} rough={1} shadow={false} />
      <TBox x={0} z={-6.7} w={90} h={0.07} d={5.4} tex={walk} mpt={1.5} rough={0.95} shadow={false} />
      <TBox x={0} z={4.6} w={90} h={0.07} d={1.2} tex={walk} mpt={1.5} rough={0.95} shadow={false} />
      <TBox x={0} z={0} w={90} h={0.05} d={8} tex={road} mpt={4} rough={0.95} shadow={false} />
      <TBox x={0} z={-4.05} w={90} h={0.14} d={0.2} tex={curb} mpt={1} />
      <TBox x={0} z={4.05} w={90} h={0.14} d={0.2} tex={curb} mpt={1} />
      {Array.from({ length: 16 }, (_, i) => <Bx key={i} x={-37.5 + i * 5} y={0.06} z={0} w={2} h={0.01} d={0.18} c="#f5f5f5" />)}
      <Bx x={0} y={0.06} z={-3.6} w={90} h={0.01} d={0.1} c="#f5f5f5" />
      <Bx x={0} y={0.06} z={3.6} w={90} h={0.01} d={0.1} c="#f5f5f5" />
      {Array.from({ length: 7 }, (_, i) => <Bx key={i} x={11 + i * 0.9} y={0.06} z={0} w={0.5} h={0.01} d={7.0} c="#f5f5f5" />)}
      {[[-10, -1.8], [20, 1.9], [-28, 1.0]].map(([x, z], i) => <Cyl key={i} p={[x, 0.055, z]} r={0.38} h={0.02} c="#26292d" metal={0.6} rough={0.5} />)}
    </>
  )
}

export function World() {
  return (
    <>
      <DayNight />
      <Clouds />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.2} position={[0, 6, -6]} scale={[14, 8, 1]} color="#fff4e0" />
        <Lightformer form="rect" intensity={1.2} position={[-8, 3, 4]} rotation-y={Math.PI / 2} scale={[8, 4, 1]} color="#cfe4ff" />
        <Lightformer form="rect" intensity={0.8} position={[8, 3, 4]} rotation-y={-Math.PI / 2} scale={[8, 4, 1]} color="#ffe9c7" />
      </Environment>
      <Street />
      <Kos /><Warung /><Gudang /><Taman /><Trees /><Lamps /><LampLights /><Utilities /><Backdrop /><Markers />
      <Cart p={[-7.2, 0, -7.4]} ry={0.1} />
      <group position={[-10.5, 0, -6.2]} rotation={[0, 0.15, 0]}><Motorbike color="#2980b9" /></group>
      <group position={[7.5, 0, -6.3]} rotation={[0, Math.PI - 0.1, 0]}><Motorbike color="#c0392b" /></group>
      <Bin p={[-25, 0, -8.8]} c="#c0392b" />
      <Traffic />
    </>
  )
}
