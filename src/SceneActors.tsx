import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group } from 'three'
import { Humanoid, IDLE_ACT, type Act, type Look } from './Humanoid'
import { Bx } from './props'
import { Motorbike } from './props'
import { bikeAt, KURIR_RIDE, routeAt, type Route } from './scenes'
import { useGame } from './store'

const sceneT = () => { const sc = useGame.getState().scene; return sc ? (performance.now() - sc.t0) / 1000 : 0 }

/** Pejalan yang menjalani rute selama adegan (mis. pembeli koran). */
export function PathNpc({ route, speed, delay = 0, look }: { route: Route; speed: number; delay?: number; look: Look }) {
  const g = useRef<Group>(null)
  const sp = useRef(0)
  useFrame(() => {
    const r = routeAt(route, speed, sceneT() - delay)
    if (!g.current) return
    g.current.visible = sceneT() >= delay && !r.end
    g.current.position.set(r.x, 0, r.z)
    // saat menunggu, hadap ke penjual (barat-selatan)
    g.current.rotation.y = r.wait ? -2.0 : r.rot
    sp.current = r.moving ? 2.2 : 0
  })
  return <group ref={g}><Humanoid look={look} speedRef={sp} /></group>
}

/** Pelanggan yang duduk makan di bangku bar. */
export function SeatedNpc({ p, look, phase = 0 }: { p: [number, number, number]; look: Look; phase?: number }) {
  const act = useRef<Act>({ ...IDLE_ACT, pose: 'eat', hold: 'spoon', sitY: 0.29 })
  useFrame(() => { act.current.t = sceneT() + phase })
  return <group position={p} rotation={[0, Math.PI, 0]}><Humanoid look={look} actRef={act} /></group>
}

/** Motor adegan: parkir (pengendara datang) dan kurir (motor kantor + paket). */
export function SceneBike({ kind }: { kind: 'parkir' | 'kurir' }) {
  const g = useRef<Group>(null)
  const [rider, setRider] = useState(true)
  useFrame(() => {
    const t = sceneT(), b = bikeAt(kind, t)
    if (g.current) { g.current.position.set(b.x, 0, b.z); g.current.rotation.y = b.rotY }
    const want = kind === 'parkir' ? true : t < KURIR_RIDE + 0.2
    if (want !== rider) setRider(want)
  })
  return (
    <group ref={g}>
      <Motorbike color={kind === 'kurir' ? '#e67e22' : '#2980b9'} rider={rider} riderColor={kind === 'kurir' ? '#3a6ea5' : '#27ae60'} helmet={kind === 'kurir' ? '#e67e22' : '#f1c40f'} />
      {kind === 'kurir' && (
        <group position={[-0.78, 0.82, 0]}>
          <Bx x={0} z={0} w={0.5} h={0.34} d={0.5} c="#c99055" mid />
          <Bx x={0} y={0.0} z={0} w={0.52} h={0.04} d={0.52} c="#a8722f" mid />
        </group>
      )}
    </group>
  )
}
