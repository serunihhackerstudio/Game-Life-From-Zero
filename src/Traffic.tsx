import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group } from 'three'
import { Humanoid, type Look } from './Humanoid'
import { Motorbike } from './props'

const EDGE = 42

/** Motor lalu-lalang di jalan (dua arah). */
function Bike({ x0, z, dir, speed, color, riderColor, helmet }: { x0: number; z: number; dir: 1 | -1; speed: number; color: string; riderColor: string; helmet: string }) {
  const g = useRef<Group>(null)
  const x = useRef(x0)
  useFrame((_, dt) => {
    x.current += dir * speed * Math.min(dt, 0.05)
    if (x.current > EDGE) x.current = -EDGE
    if (x.current < -EDGE) x.current = EDGE
    if (g.current) g.current.position.x = x.current
  })
  return (
    <group ref={g} position={[x0, 0, z]} rotation={[0, dir > 0 ? 0 : Math.PI, 0]}>
      <Motorbike color={color} rider riderColor={riderColor} helmet={helmet} />
    </group>
  )
}

/** Pejalan kaki di trotoar, berjalan bolak-balik. */
function Ped({ x0, z, dir, look, pace = 1.5 }: { x0: number; z: number; dir: 1 | -1; look: Look; pace?: number }) {
  const g = useRef<Group>(null)
  const sp = useRef(2.2)
  const st = useRef({ x: x0, d: dir as number })
  useFrame((_, dt) => {
    const s = st.current
    s.x += s.d * pace * Math.min(dt, 0.05)
    if (s.x > 34) s.d = -1
    if (s.x < -34) s.d = 1
    if (g.current) { g.current.position.x = s.x; g.current.rotation.y = s.d > 0 ? Math.PI / 2 : -Math.PI / 2 }
  })
  return (
    <group ref={g} position={[x0, 0, z]}>
      <Humanoid look={look} speedRef={sp} />
    </group>
  )
}

export function Traffic() {
  return (
    <>
      <Bike x0={-30} z={-2.1} dir={1} speed={8} color="#c0392b" riderColor="#3a6ea5" helmet="#f1c40f" />
      <Bike x0={5} z={-1.5} dir={1} speed={10.5} color="#2c3e50" riderColor="#27ae60" helmet="#e74c3c" />
      <Bike x0={25} z={2.1} dir={-1} speed={9} color="#e67e22" riderColor="#8e44ad" helmet="#ecf0f1" />
      <Bike x0={-12} z={1.6} dir={-1} speed={7} color="#16a085" riderColor="#c0392b" helmet="#2c3e50" />
      <Ped x0={-20} z={-5.1} dir={1} look={{ shirt: '#e0b84c', pants: '#2c3e50', skin: '#b98660', hair: '#111', backpack: true }} />
      <Ped x0={12} z={-5.6} dir={-1} pace={1.3} look={{ shirt: '#7f5aa2', pants: '#3a3a3a', skin: '#d0a07a', hair: '#1a0f0a', female: true }} />
      <Ped x0={-5} z={4.7} dir={1} pace={1.7} look={{ shirt: '#c0392b', pants: '#5d6d7e', skin: '#c68e64', hair: '#222', hoodie: true }} />
      <Ped x0={28} z={4.4} dir={-1} pace={1.4} look={{ shirt: '#2e8b6e', pants: '#46607f', skin: '#d9a47a', hair: '#2b1a12', female: true, hoodie: true, backpack: true }} />
    </>
  )
}
