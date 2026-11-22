import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment, Html, Lightformer } from '@react-three/drei'
import { Color, DirectionalLight, DoubleSide, Fog, Group, HemisphereLight, Mesh, MeshStandardMaterial, PointLight, Sprite } from 'three'
import { KOS_WALL_H, KOS_WALLS, LAMPS, TREES, ZONES } from './data'
import { daylight, registerGlow, updateGlow } from './glow'
import { Humanoid } from './Humanoid'
import { Ball, Barrel, Bin, Bulb, Bx, Cart, Cyl, Flowers, Motorbike, Pallet, Plant, Pole, Sign, Stool, TBox, Tree, Truck, Window, Wire } from './props'
import { asphalt, cloudTex, facade, facadeEmissive, grass, hazard, metal, pavement, plaster, roofTile, rollerDoor, stripes, tiled, wood } from './textures'
import { Traffic } from './Traffic'
import { PathNpc, SceneBike, SeatedNpc } from './SceneActors'
import { KORAN_CUSTOMER } from './scenes'
import { useGame, visMinute } from './store'

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
    const { ang, sun, k, dusk } = daylight((visMinute() % 1440) / 60)
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
    const { k } = daylight((visMinute() % 1440) / 60)
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
      <Ball p={[-21.2, 0.76, -17.38]} r={0.3} s={[1.55, 0.3, 1.0]} c="#f4f0e8" rough={1} seg={20} />
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
      {/* dapur kecil: meja kompor */}
      <Bx x={-16.25} y={0.1} z={-17.75} w={1.1} h={0.85} d={0.5} c="#d8d4c8" rough={0.6} />
      <Bx x={-16.25} y={0.95} z={-17.75} w={1.14} h={0.04} d={0.54} c="#9aa0a6" metal={0.6} rough={0.35} />
      {[-0.22, 0.22].map((dx) => <Cyl key={dx} p={[-16.25 + dx, 1.0, -17.75]} r={0.12} h={0.03} c="#1a1a1a" metal={0.5} />)}
      <Cyl p={[-16.47, 1.12, -17.75]} r={0.12} h={0.2} c="#c8ccd2" metal={0.7} rough={0.3} />
      <Cyl p={[-16.47, 1.23, -17.75]} r={0.125} h={0.03} c="#9aa0a6" metal={0.7} />
      <Bx x={-16.25} y={1.7} z={-17.9} w={1.0} h={0.45} d={0.28} c="#8a5a35" />
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


/** Warung kelontong Bu Rina: kios terbuka, rak dinding penuh barang, jajanan renceng, kulkas minuman, ada penjualnya. */
function Kelontong() {
  const wall = useMemo(() => plaster('#ead9a6'), [])
  const tin = useMemo(() => metal('#9aa5b0'), [])
  const woodT = useMemo(() => wood('#8a5a35'), [])
  const fridgeGlass = useMemo(() => registerGlow(new MeshStandardMaterial({ color: '#cfe9f5', roughness: 0.1, transparent: true, opacity: 0.5, emissive: '#dff6ff', emissiveIntensity: 0 }), 1.3), [])
  const goods = ['#e74c3c', '#f1c40f', '#27ae60', '#3498db', '#e67e22', '#9b59b6', '#1abc9c', '#ecf0f1', '#c0392b', '#f39c12']
  const racks = [7.15, 8.45, 9.75, 11.05]
  const rows = [0.45, 0.88, 1.31, 1.74]
  return (
    <group>
      <TBox x={9.6} z={-13} w={6.8} h={3.4} d={5} tex={wall} mpt={2.2} />
      <TBox x={9.6} y={3.4} z={-12.9} w={7.6} h={0.12} d={5.4} tex={tin} mpt={1.5} metal={0.5} rough={0.5} />
      {/* rak dinding berisi barang dagangan */}
      {racks.map((x, ri) => (
        <group key={x}>
          <Bx x={x} y={0.1} z={-10.38} w={1.2} h={2.0} d={0.2} c="#7a5230" />
          {rows.map((y, j) => (
            <group key={y}>
              <Bx x={x} y={y - 0.03} z={-10.33} w={1.2} h={0.03} d={0.22} c="#5b3a22" />
              {[0, 1, 2, 3].map((k) => {
                const c = goods[(ri * 4 + j * 3 + k) % goods.length]
                const px = x - 0.45 + k * 0.3
                return (j + k) % 3 === 0
                  ? <Cyl key={k} p={[px, y + 0.13, -10.33]} r={0.055} h={0.26} c={c} rough={0.4} seg={10} />
                  : <Bx key={k} x={px} y={y} z={-10.33} w={0.22} h={0.26} d={0.12} c={c} />
              })}
            </group>
          ))}
        </group>
      ))}
      {/* tiang kios + papan nama */}
      <Bx x={6.2} z={-8.6} w={0.14} h={2.15} d={0.14} c="#5b3a22" />
      <Bx x={13.0} z={-8.6} w={0.14} h={2.15} d={0.14} c="#5b3a22" />
      <Sign text="WARUNG KELONTONG" sub="Sembako · Jajanan · Minuman Dingin" w={5.0} h={0.85} p={[9.6, 3.0, -10.47]} bg="#f2e6c8" fg="#7a1f1f" />
      {/* atap seng miring */}
      <TBox x={9.6} y={2.2} z={-8.55} w={7.4} h={0.07} d={0.65} tex={tin} mpt={1.4} rx={0.1} metal={0.5} rough={0.5} mid />
      {/* jajanan renceng digantung di tepi atap */}
      <Bx x={9.6} y={2.1} z={-8.62} w={6.6} h={0.015} d={0.015} c="#444" />
      {Array.from({ length: 15 }, (_, i) => <Bx key={i} x={6.5 + i * 0.44} y={1.84} z={-8.62} w={0.11} h={0.24} d={0.015} c={goods[i % goods.length]} />)}
      {/* meja kasir + toples + timbangan */}
      <TBox x={9.6} z={-9.3} w={4.6} h={1.0} d={0.6} tex={woodT} mpt={1} />
      <Bx x={9.6} y={1.0} z={-9.3} w={4.7} h={0.06} d={0.7} c="#6b4a2f" />
      {[8.0, 8.5, 9.0].map((x, i) => (
        <group key={x}>
          <Cyl p={[x, 1.2, -9.3]} r={0.13} h={0.3} c="#d9eef5" rough={0.1} />
          <Cyl p={[x, 1.18, -9.3]} r={0.115} h={0.24} c={['#e74c3c', '#f1c40f', '#27ae60'][i]} rough={0.5} />
          <Cyl p={[x, 1.37, -9.3]} r={0.14} h={0.03} c="#c0392b" />
        </group>
      ))}
      <Bx x={10.4} y={1.06} z={-9.35} w={0.35} h={0.2} d={0.25} c="#2c3e50" metal={0.3} />
      <Bx x={11.0} y={1.06} z={-9.3} w={0.3} h={0.14} d={0.4} c="#c9b99a" />
      {[0, 1, 2, 3, 4, 5].map((k) => <Ball key={k} p={[11.0 - 0.1 + (k % 3) * 0.1, 1.17, -9.4 + Math.floor(k / 3) * 0.12]} r={0.045} c="#f1e4c8" s={[0.8, 1, 0.8]} seg={8} />)}
      {/* kulkas minuman */}
      <Bx x={12.55} y={0.1} z={-10.05} w={0.9} h={1.8} d={0.8} c="#f2f4f6" rough={0.4} />
      <mesh position={[12.55, 0.95, -9.64]} material={fridgeGlass}><planeGeometry args={[0.72, 1.5]} /></mesh>
      {[0.35, 0.75, 1.15, 1.55].map((y, j) => [0, 1, 2].map((k) => <Cyl key={j + ':' + k} p={[12.3 + k * 0.25, y + 0.12, -9.92]} r={0.05} h={0.22} c={goods[(j + k * 2) % goods.length]} seg={8} />))}
      <Sign text="DINGIN" w={0.7} h={0.22} p={[12.55, 1.95, -9.63]} bg="#1f5e8c" fg="#fff" glow={0.5} />
      {/* galon air, tabung gas, karung beras di sisi kios */}
      {[6.55, 6.95].map((x) => <Cyl key={x} p={[x, 0.45, -9.95]} r={0.19} h={0.9} c="#4aa3df" rough={0.2} />)}
      <mesh position={[6.75, 1.0, -9.95]} castShadow><capsuleGeometry args={[0.1, 0.1, 4, 8]} /><meshStandardMaterial color="#d9eef5" /></mesh>
      <mesh position={[13.4, 0.35, -10.1]} castShadow><capsuleGeometry args={[0.28, 0.25, 5, 10]} /><meshStandardMaterial color="#d9c9a3" roughness={1} /></mesh>
      <Cyl p={[13.0, 0.35, -9.8]} r={0.17} h={0.6} c="#3e9b4f" rough={0.5} metal={0.3} />
      <Bulb p={[8.1, 2.0, -9.4]} r={0.09} />
      <Bulb p={[11.1, 2.0, -9.4]} r={0.09} />
      <pointLight position={[9.6, 1.9, -9.6]} intensity={9} distance={7} color="#ffe2b0" />
      {/* penjual */}
      <group position={[9.6, 0, -9.9]}>
        <Humanoid look={{ shirt: '#e07a9a', pants: '#5b4a8a', skin: '#d4a07a', hair: '#241510', female: true }} />
      </group>
      <Label pos={[9.6, 2.15, -9.9]} text="Bu Rina" />
      {/* ATM */}
      <group position={[14.0, 0, -10.2]}>
        <Bx x={0} z={0} w={0.9} h={2.0} d={0.8} c="#2c3e50" metal={0.3} />
        <Bx x={0} y={1.3} z={0.41} w={0.6} h={0.4} d={0.03} c="#8fd3f4" rough={0.2} />
        <Bx x={0} y={1.0} z={0.41} w={0.5} h={0.12} d={0.03} c="#c0392b" />
        <Sign text="ATM" w={0.7} h={0.25} p={[0, 1.85, 0.42]} bg="#1f5e8c" fg="#fff" glow={0.5} />
      </group>
    </group>
  )
}

/** Pasar tradisional: lapak berterpal belang dengan sayur, telur, dan karung beras. */
function Pasar() {
  const walk = useMemo(() => pavement(), [])
  const woodT = useMemo(() => wood('#8a5a35'), [])
  const t1 = useMemo(() => stripes('#27ae60', '#f4efe6'), [])
  const t2 = useMemo(() => stripes('#2c6fb5', '#f4efe6'), [])
  const t3 = useMemo(() => stripes('#e67e22', '#f4efe6'), [])
  const stalls: { x: number; tex: typeof t1 }[] = [{ x: 18, tex: t1 }, { x: 22.5, tex: t2 }, { x: 27, tex: t3 }]
  const veg = ['#2f9e44', '#c0392b', '#e67e22', '#7cb342', '#8e44ad']
  return (
    <group>
      <TBox x={23} z={9.6} w={17} h={0.06} d={8.2} tex={walk} mpt={1.5} shadow={false} />
      {/* gapura */}
      <Bx x={14.9} z={5.9} w={0.14} h={3.4} d={0.14} c="#5b3a22" />
      <Bx x={18.1} z={5.9} w={0.14} h={3.4} d={0.14} c="#5b3a22" />
      <Sign text="PASAR HARAPAN" sub="Buka 05.00–14.00" w={3.4} h={0.95} p={[16.5, 3.0, 5.9]} ry={Math.PI} bg="#2e7d4f" fg="#fff" />
      {stalls.map(({ x, tex }, i) => (
        <group key={x}>
          <TBox x={x} z={11.2} w={3} h={0.95} d={1.1} tex={woodT} mpt={1} />
          {[-1.4, 1.4].map((dx) => [-0.5, 0.5].map((dz) => <Bx key={dx + ':' + dz} x={x + dx} z={11.2 + dz} w={0.07} h={2.5} d={0.07} c="#4a3322" />))}
          <TBox x={x} y={2.55} z={11.2} w={3.4} h={0.06} d={1.8} tex={tex} mpt={0.8} rx={0.2} mid />
          {/* dagangan */}
          {i === 0 && Array.from({ length: 10 }, (_, k) => <Ball key={k} p={[x - 1.2 + (k % 5) * 0.55, 1.1, 11.0 + (k < 5 ? 0 : 0.35)]} r={0.2} c={veg[k % 5]} />)}
          {i === 1 && (
            <>
              {[-1.0, -0.3].map((dx) => <Bx key={dx} x={x + dx} y={0.95} z={11.1} w={0.6} h={0.12} d={0.4} c="#c9b99a" />)}
              {[-1.0, -0.3].map((dx) => Array.from({ length: 6 }, (_, k) => <Ball key={dx + ':' + k} p={[x + dx - 0.2 + (k % 3) * 0.2, 1.1, 10.98 + Math.floor(k / 3) * 0.2]} r={0.07} c="#f1e4c8" s={[0.8, 1, 0.8]} seg={8} />))}
              {[0.5, 1.15].map((dx) => <mesh key={dx} position={[x + dx, 1.2, 11.1]} castShadow><capsuleGeometry args={[0.3, 0.45, 5, 10]} /><meshStandardMaterial color="#d9c9a3" roughness={1} /></mesh>)}
            </>
          )}
          {i === 2 && Array.from({ length: 12 }, (_, k) => <Ball key={k} p={[x - 1.2 + (k % 6) * 0.45, 1.08, 11.0 + (k < 6 ? 0 : 0.32)]} r={0.17} c={['#f1c40f', '#e74c3c', '#e67e22', '#27ae60'][k % 4]} />)}
          <Bulb p={[x, 2.25, 11.7]} r={0.08} />
        </group>
      ))}
      <Bin p={[31.2, 0, 7]} />
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
      <Stool p={[-1.2, 0, -9.25]} h={0.58} />
      <Stool p={[1.2, 0, -9.25]} h={0.58} c="#2c6fb5" />
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
    const { k } = daylight((visMinute() % 1440) / 60)
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

/** Properti yang muncul hanya saat adegan: piring makan, uap masakan, selimut tidur. */
function SceneProps() {
  const kind = useGame((s) => s.scene?.kind)
  const steam = useRef<(Group | null)[]>([])
  useFrame(() => {
    const t = performance.now() / 1000
    steam.current.forEach((g, i) => {
      if (!g) return
      const u = (t * 0.45 + i * 0.25) % 1
      g.position.set(-16.47 + Math.sin(t + i) * 0.05, 1.35 + u * 0.7, -17.75)
      g.scale.setScalar(0.5 + u * 1.2)
      ;((g.children[0] as Mesh).material as MeshStandardMaterial).opacity = 0.5 * (1 - u)
    })
  })
  if (kind === 'koran') return <PathNpc route={KORAN_CUSTOMER} speed={1.5} delay={0.8} look={{ shirt: '#8e44ad', pants: '#34495e', skin: '#c68e64', hair: '#222' }} />
  if (kind === 'parkir') return <SceneBike kind="parkir" />
  if (kind === 'kurir') return <SceneBike kind="kurir" />
  if (kind === 'pelayan') return (
    <group>
      <SeatedNpc p={[-1.2, 0, -9.28]} look={{ shirt: '#c0392b', pants: '#2c3e50', skin: '#b98660', hair: '#111' }} />
      <SeatedNpc p={[1.2, 0, -9.28]} phase={1.3} look={{ shirt: '#2e8b6e', pants: '#5d6d7e', skin: '#d4a07a', hair: '#241510', female: true }} />
    </group>
  )
  if (kind === 'eat') return (
    <group>
      <Cyl p={[1.25, 1.2, -10.0]} r={0.17} h={0.02} c="#ffffff" rough={0.3} />
      <Ball p={[1.25, 1.25, -10.0]} r={0.1} s={[1, 0.55, 1]} c="#f6f1e4" />
      <Ball p={[1.33, 1.27, -9.96]} r={0.035} c="#c0392b" seg={8} />
      <Ball p={[1.17, 1.27, -10.05]} r={0.045} c="#5aa05a" s={[1.3, 0.6, 1]} seg={8} />
      <Cyl p={[0.78, 1.29, -10.05]} r={0.055} h={0.2} c="#d98a2d" rough={0.2} />
    </group>
  )
  if (kind === 'cook') return (
    <group>
      {[0, 1, 2, 3].map((i) => (
        <group key={i} ref={(g) => { steam.current[i] = g }}>
          <mesh><sphereGeometry args={[0.12, 10, 8]} /><meshStandardMaterial color="#ffffff" transparent opacity={0.4} depthWrite={false} /></mesh>
        </group>
      ))}
      <Bulb p={[-16.25, 2.2, -17.0]} r={0.06} s={0} />
    </group>
  )
  if (kind === 'sleep') return (
    <group>
      {/* selimut: menutup dari dada ke kaki, dengan gundukan tubuh di bawahnya */}
      <Bx x={-21.2} y={0.72} z={-16.25} w={1.46} h={0.17} d={1.4} c="#5b8fd0" rough={1} />
      {[-0.11, 0.11].map((dx) => (
        <mesh key={dx} position={[-21.2 + dx, 0.88, -16.1]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <capsuleGeometry args={[0.085, 0.75, 6, 12]} /><meshStandardMaterial color="#5b8fd0" roughness={1} />
        </mesh>
      ))}
      <Ball p={[-21.2, 0.9, -16.72]} r={0.2} s={[1.5, 0.55, 1.3]} c="#5b8fd0" rough={1} seg={16} />
      <Bx x={-21.2} y={0.76} z={-16.97} w={1.44} h={0.13} d={0.12} c="#e8eef8" rough={1} />
      <Bx x={-21.95} y={0.5} z={-16.25} w={0.05} h={0.35} d={1.4} c="#5b8fd0" rough={1} />
      <Bx x={-20.45} y={0.5} z={-16.25} w={0.05} h={0.35} d={1.4} c="#5b8fd0" rough={1} />
      {/* cahaya bulan dari jendela */}
      <pointLight position={[-22.4, 1.9, -13.4]} intensity={7} distance={8} color="#9fb8ff" />
      <Html position={[-21.2, 1.7, -17.3]} center style={{ pointerEvents: 'none' }}><div className="zzz">Z z z</div></Html>
    </group>
  )
  return null
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

/** Job Center: kantor lowongan kerja dengan papan pengumuman di dinding. */
function JobCenter() {
  const wall = useMemo(() => plaster('#dfe7ee'), [])
  const tin = useMemo(() => metal('#9aa5b0'), [])
  const glass = useMemo(() => registerGlow(new MeshStandardMaterial({ color: '#a9d2ea', roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.5, emissive: '#fff0c8', emissiveIntensity: 0 }), 1.0), [])
  const papers = ['#f1c40f', '#ecf0f1', '#e74c3c', '#3498db', '#2ecc71', '#f39c12']
  return (
    <group>
      <TBox x={-8.3} z={-13} w={6} h={3.4} d={5} tex={wall} mpt={2.2} />
      <Bx x={-8.3} y={3.4} z={-13} w={6.3} h={0.3} d={5.3} c="#0f6b4f" />
      <TBox x={-8.3} y={3.7} z={-13} w={5.8} h={0.1} d={4.8} tex={tin} mpt={1.5} metal={0.4} rough={0.6} />
      <Bx x={-8.3} y={0} z={-10.46} w={6} h={0.5} d={0.06} c="#0f6b4f" />
      {/* pintu kaca + bingkai */}
      <mesh position={[-8.3, 1.2, -10.47]} material={glass}><planeGeometry args={[1.5, 2.2]} /></mesh>
      {[-9.07, -7.53].map((x) => <Bx key={x} x={x} y={0.1} z={-10.5} w={0.08} h={2.3} d={0.1} c="#0f6b4f" />)}
      <Bx x={-8.3} y={2.3} z={-10.5} w={1.6} h={0.1} d={0.1} c="#0f6b4f" />
      <Bx x={-8.3} y={0.1} z={-10.5} w={0.04} h={2.2} d={0.06} c="#0f6b4f" />
      <Bx x={-8.55} y={1.0} z={-10.42} w={0.04} h={0.4} d={0.05} c="#cfd6dc" metal={0.6} />
      <Bx x={-8.05} y={1.0} z={-10.42} w={0.04} h={0.4} d={0.05} c="#cfd6dc" metal={0.6} />
      <Window p={[-10.5, 1.5, -10.45]} w={1.3} h={1.0} frame="#0f6b4f" />
      {/* papan nama */}
      <Sign text="JOB CENTER" sub="Lowongan Kerja · Pelatihan · Pelamar Umum" w={4.6} h={0.95} p={[-8.3, 2.95, -10.47]} bg="#0f6b4f" fg="#ffffff" />
      {/* papan lowongan di dinding */}
      <Bx x={-5.95} y={0.55} z={-10.45} w={1.5} h={1.35} d={0.06} c="#6b4a2f" />
      <Sign text="LOWONGAN" w={1.3} h={0.24} p={[-5.95, 1.78, -10.4]} bg="#c0392b" fg="#fff" glow={0.3} />
      {papers.map((c, i) => <Bx key={i} x={-6.4 + (i % 3) * 0.45} y={0.75 + Math.floor(i / 3) * 0.55} z={-10.4} w={0.34} h={0.45} d={0.015} c={c} rough={0.9} />)}
      <Plant p={[-10.7, 0.0, -9.85]} s={1.1} />
      <Bx x={-6.0} y={0} z={-9.8} w={1.5} h={0.05} d={0.5} c="#b9b8b0" />
      <Bulb p={[-10.9, 2.7, -10.2]} r={0.09} />
      <Bulb p={[-5.7, 2.7, -10.2]} r={0.09} />
      <pointLight position={[-8.3, 1.8, -9.4]} intensity={6} distance={6} color="#ffe9c0" />
    </group>
  )
}

/** Lapak koran & majalah di pojok barat jalan. */
function KoranStand() {
  const woodT = useMemo(() => wood('#8a5a35'), [])
  const st = useMemo(() => stripes('#2c6fb5', '#f4efe6'), [])
  const mags = ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71', '#9b59b6', '#e67e22']
  return (
    <group>
      <TBox x={-30.2} z={-9.2} w={2.2} h={1.0} d={0.8} tex={woodT} mpt={1} />
      <Bx x={-30.2} y={1.0} z={-9.2} w={2.3} h={0.05} d={0.9} c="#6b4a2f" />
      {[0, 1, 2].map((i) => <Bx key={i} x={-30.9 + i * 0.05} y={1.05 + i * 0.05} z={-9.1} w={0.7} h={0.05} d={0.5} c={i % 2 ? '#d9d4c5' : '#ece8da'} />)}
      {[0, 1, 2, 3].map((i) => <Bx key={i} x={-29.5 + (i % 2) * 0.05} y={1.05 + Math.floor(i / 2) * 0.06} z={-9.1} w={0.6} h={0.05} d={0.45} c="#e4dfd0" />)}
      <Bx x={-30.2} y={0.1} z={-9.78} w={2.4} h={2.0} d={0.08} c="#7a5230" />
      {mags.map((c, i) => <Bx key={i} x={-31.0 + (i % 3) * 0.8} y={1.2 + Math.floor(i / 3) * 0.55} z={-9.7} w={0.55} h={0.45} d={0.02} c={c} rough={0.8} />)}
      <Bx x={-31.4} y={0} z={-8.7} w={0.08} h={2.3} d={0.08} c="#4a3322" />
      <Bx x={-29.0} y={0} z={-8.7} w={0.08} h={2.3} d={0.08} c="#4a3322" />
      <mesh position={[-30.2, 2.5, -9.1]} castShadow><coneGeometry args={[1.6, 0.45, 16]} /><meshStandardMaterial map={tiled(st, 3, 1)} roughness={0.8} side={DoubleSide} /></mesh>
      <Sign text="KORAN & MAJALAH" w={1.9} h={0.38} p={[-30.2, 0.62, -8.78]} bg="#f4efe6" fg="#1f3f6e" glow={0.2} />
    </group>
  )
}

/** Kios ekspedisi "Kilat Ekspres": tempat kurir mengambil paket. */
function Ekspedisi() {
  const wall = useMemo(() => plaster('#f4efe6'), [])
  const tin = useMemo(() => metal('#9aa5b0'), [])
  return (
    <group>
      <TBox x={-34.5} z={-9.9} w={4} h={3.0} d={2.2} tex={wall} mpt={2} />
      <TBox x={-34.5} y={3.0} z={-9.9} w={4.4} h={0.1} d={2.6} tex={tin} mpt={1.5} metal={0.4} rough={0.6} />
      <Bx x={-34.5} y={0} z={-8.78} w={4} h={0.5} d={0.05} c="#c0392b" />
      <Bx x={-34.5} y={1.0} z={-8.78} w={2.4} h={1.1} d={0.05} c="#2a1e16" />
      <Bx x={-34.5} y={0.9} z={-8.45} w={2.6} h={0.08} d={0.6} c="#6b4a2f" />
      <Sign text="KILAT EKSPRES" sub="Antar Paket Cepat & Aman" w={3.4} h={0.8} p={[-34.5, 2.45, -8.77]} bg="#c0392b" fg="#ffffff" />
      {[[-36.1, -8.4, 0.5], [-35.5, -8.3, 0.4], [-36.0, -8.4, 0.9]].map(([x, z, y], i) => <Bx key={i} x={x} y={y - 0.5} z={z} w={0.55} h={0.4} d={0.5} c={['#c99055', '#d4a066', '#b9803f'][i]} />)}
      <Bx x={-32.9} y={0} z={-8.4} w={0.6} h={0.45} d={0.5} c="#c99055" />
      <Bx x={-32.9} y={0.45} z={-8.4} w={0.5} h={0.35} d={0.45} c="#d4a066" />
      <Bulb p={[-33.0, 2.3, -8.7]} r={0.09} />
    </group>
  )
}

/** Rambu & kerucut parkir di depan warung. */
function ParkirProps() {
  return (
    <group>
      <Cyl p={[1.8, 1.0, -5.6]} r={0.04} h={2.0} c="#333" />
      <Sign text="PARKIR MOTOR" sub="Rp2.000" w={0.9} h={0.62} p={[1.8, 2.2, -5.54]} bg="#1f5e8c" fg="#fff" glow={0.4} />
      <Sign text="PARKIR MOTOR" sub="Rp2.000" w={0.9} h={0.62} p={[1.8, 2.2, -5.66]} ry={Math.PI} bg="#1f5e8c" fg="#fff" glow={0.4} />
      {[[4.9, -4.5], [6.0, -4.5], [3.9, -4.5]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <Bx x={0} z={0} w={0.34} h={0.03} d={0.34} c="#2a2a2a" />
          <mesh position={[0, 0.25, 0]} castShadow><coneGeometry args={[0.15, 0.42, 12]} /><meshStandardMaterial color="#e8601a" roughness={0.6} /></mesh>
          <mesh position={[0, 0.27, 0]}><cylinderGeometry args={[0.095, 0.105, 0.06, 12]} /><meshStandardMaterial color="#ffffff" /></mesh>
        </group>
      ))}
    </group>
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
      <Kos /><Warung /><JobCenter /><KoranStand /><Ekspedisi /><ParkirProps /><Kelontong /><Pasar /><Gudang /><Taman /><Trees /><Lamps /><LampLights /><Utilities /><Backdrop /><Markers />
      <Cart p={[-7.2, 0, -7.4]} ry={0.1} />
      <SceneProps />
      <group position={[-10.5, 0, -6.2]} rotation={[0, 0.15, 0]}><Motorbike color="#2980b9" /></group>
      <group position={[7.5, 0, -6.3]} rotation={[0, Math.PI - 0.1, 0]}><Motorbike color="#c0392b" /></group>
      <Bin p={[-25, 0, -8.8]} c="#c0392b" />
      <Traffic />
    </>
  )
}
