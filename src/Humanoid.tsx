import { useRef, type MutableRefObject, type RefObject } from 'react'
import type { Group } from 'three'

export interface Parts { legL: RefObject<Group>; legR: RefObject<Group>; armL: RefObject<Group>; armR: RefObject<Group> }
export interface Look { shirt: string; pants: string; skin: string; hair: string; female?: boolean }

export function Humanoid({ look, partsRef }: { look: Look; partsRef?: MutableRefObject<Parts | null> }) {
  const legL = useRef<Group>(null), legR = useRef<Group>(null)
  const armL = useRef<Group>(null), armR = useRef<Group>(null)
  if (partsRef) partsRef.current = { legL, legR, armL, armR }
  const { shirt, pants, skin, hair, female } = look
  const leg = (x: number, ref: RefObject<Group>) => (
    <group ref={ref} position={[x, 0.85, 0]}>
      <mesh position={[0, -0.425, 0]} castShadow><boxGeometry args={[0.17, 0.85, 0.19]} /><meshStandardMaterial color={pants} /></mesh>
      <mesh position={[0, -0.8, 0.04]} castShadow><boxGeometry args={[0.19, 0.1, 0.28]} /><meshStandardMaterial color="#222" /></mesh>
    </group>
  )
  const arm = (x: number, ref: RefObject<Group>) => (
    <group ref={ref} position={[x, 1.42, 0]}>
      <mesh position={[0, -0.2, 0]} castShadow><boxGeometry args={[0.13, 0.4, 0.15]} /><meshStandardMaterial color={shirt} /></mesh>
      <mesh position={[0, -0.46, 0]} castShadow><sphereGeometry args={[0.07, 10, 8]} /><meshStandardMaterial color={skin} /></mesh>
    </group>
  )
  return (
    <group scale={0.95}>
      {leg(-0.12, legL)}{leg(0.12, legR)}
      <mesh position={[0, 1.16, 0]} castShadow><boxGeometry args={[0.5, 0.62, 0.28]} /><meshStandardMaterial color={shirt} /></mesh>
      {arm(-0.33, armL)}{arm(0.33, armR)}
      <mesh position={[0, 1.66, 0]} castShadow><sphereGeometry args={[0.17, 16, 12]} /><meshStandardMaterial color={skin} /></mesh>
      <mesh position={[0, 1.74, -0.01]} scale={[1, 0.6, 1]} castShadow><sphereGeometry args={[0.185, 16, 10]} /><meshStandardMaterial color={hair} /></mesh>
      {female && <mesh position={[0, 1.52, -0.14]} castShadow><boxGeometry args={[0.3, 0.38, 0.1]} /><meshStandardMaterial color={hair} /></mesh>}
      <mesh position={[-0.06, 1.68, 0.155]}><sphereGeometry args={[0.02, 8, 6]} /><meshStandardMaterial color="#111" /></mesh>
      <mesh position={[0.06, 1.68, 0.155]}><sphereGeometry args={[0.02, 8, 6]} /><meshStandardMaterial color="#111" /></mesh>
    </group>
  )
}
