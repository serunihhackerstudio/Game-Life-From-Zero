import { useRef, type MutableRefObject, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { Color, type Group } from 'three'

export type PoseName = 'stand' | 'sit' | 'carry' | 'eat' | 'cook' | 'browse' | 'sleep'
export type Hold = 'none' | 'crate' | 'spoon' | 'spatula' | 'basket'
/** Perintah adegan: pose khusus + benda di tangan. t = detik sejak adegan mulai. */
export interface Act { pose: PoseName; hold: Hold; t: number; reach: number; fill: number; sitY: number }
export const IDLE_ACT: Act = { pose: 'stand', hold: 'none', t: 0, reach: 0, fill: 0, sitY: 0.29 }

export interface Look {
  shirt: string; pants: string; skin: string; hair: string
  female?: boolean
  hoodie?: boolean     // hoodie berkerudung + kantong, lengan bawah terbuka
  backpack?: boolean
  elder?: boolean      // kumis + rambut pendek
  sandals?: boolean
}

const shade = (c: string, f: number) => '#' + new Color(c).multiplyScalar(f).getHexString()
const tint = (c: string, x: number) => '#' + new Color(c).lerp(new Color('#ffffff'), x).getHexString()

type V3 = [number, number, number]
function Cap({ r, l, p, s, rot, c, rough = 0.85 }: { r: number; l: number; p?: V3; s?: V3; rot?: V3; c: string; rough?: number }) {
  return (
    <mesh position={p} scale={s} rotation={rot} castShadow>
      <capsuleGeometry args={[r, l, 6, 14]} />
      <meshStandardMaterial color={c} roughness={rough} />
    </mesh>
  )
}
function Ball({ r, p, s, c, rough = 0.6, seg = 16 }: { r: number; p?: V3; s?: V3; c: string; rough?: number; seg?: number }) {
  return (
    <mesh position={p} scale={s} castShadow>
      <sphereGeometry args={[r, seg, Math.max(8, seg - 4)]} />
      <meshStandardMaterial color={c} roughness={rough} />
    </mesh>
  )
}
function Blk({ w, h, d, p, rot, c, rough = 0.85 }: { w: number; h: number; d: number; p?: V3; rot?: V3; c: string; rough?: number }) {
  return (
    <mesh position={p} rotation={rot} castShadow>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color={c} roughness={rough} />
    </mesh>
  )
}
const G = ({ r, children, p }: { r: React.RefObject<Group>; children?: ReactNode; p?: V3 }) => <group ref={r} position={p}>{children}</group>

export function Humanoid({ look, speedRef, actRef }: { look: Look; speedRef?: MutableRefObject<number>; actRef?: MutableRefObject<Act> }) {
  const { shirt, pants, skin, hair, female, hoodie, backpack, elder, sandals } = look
  const hipL = useRef<Group>(null), hipR = useRef<Group>(null)
  const kneeL = useRef<Group>(null), kneeR = useRef<Group>(null)
  const shL = useRef<Group>(null), shR = useRef<Group>(null)
  const elL = useRef<Group>(null), elR = useRef<Group>(null)
  const torso = useRef<Group>(null), head = useRef<Group>(null)
  const st = useRef({ t: 0, phase: 0, k: 0 })
  const rootG = useRef<Group>(null)
  const crate = useRef<Group>(null), spoon = useRef<Group>(null), spatula = useRef<Group>(null), basket = useRef<Group>(null)
  const fillRefs = useRef<(Group | null)[]>([])

  useFrame((_, dt0) => {
    const dt = Math.min(dt0, 0.05)
    const sp = speedRef?.current ?? 0
    const s = st.current
    const target = sp === 0 ? 0 : Math.min(1.8, sp / 3.4)
    s.k += (target - s.k) * Math.min(1, dt * 10)
    s.t += dt
    if (s.k > 0.01) s.phase += dt * (4.4 + s.k * 2.4)
    const w = Math.min(s.k, 1)                 // faktor jalan
    const run = Math.max(0, s.k - 1) / 0.8     // faktor lari
    const A = 0.5 * w + 0.4 * run
    const sn = Math.sin(s.phase), cs = Math.cos(s.phase)
    const idle = 1 - w

    const set = (g: Group | null, x: number, y = 0, z = 0) => { if (g) g.rotation.set(x, y, z) }
    set(hipL.current, sn * A); set(hipR.current, -sn * A)
    set(kneeL.current, Math.max(0, -cs) * (0.85 * w + 0.5 * run) + 0.03)
    set(kneeR.current, Math.max(0, cs) * (0.85 * w + 0.5 * run) + 0.03)
    const breathe = Math.sin(s.t * 1.7) * idle
    set(shL.current, -sn * A * 0.9 + breathe * 0.015, 0, 0.07 + breathe * 0.01)
    set(shR.current, sn * A * 0.9 - breathe * 0.015, 0, -0.07 - breathe * 0.01)
    const bend = 0.18 + 0.5 * w + 0.8 * run
    set(elL.current, -bend); set(elR.current, -bend)
    if (torso.current) {
      torso.current.position.y = 0.92 + Math.abs(cs) * (0.02 * w + 0.025 * run)
      torso.current.rotation.set(0.03 * w + 0.2 * run, sn * 0.1 * w, 0)
      torso.current.scale.set(1 + breathe * 0.004, 1 + breathe * 0.008, 1 + breathe * 0.006)
    }
    if (head.current) {
      head.current.rotation.set(-0.03 * w - 0.12 * run + Math.sin(s.t * 0.9) * 0.015 * idle, Math.sin(s.t * 0.5) * 0.18 * idle - sn * 0.05 * w, 0)
    }

    // ---- pose adegan (aktivitas) ----
    const a = actRef?.current
    const pose = a?.pose ?? 'stand'
    const hold = a?.hold ?? 'none'
    if (crate.current) crate.current.visible = hold === 'crate'
    if (spoon.current) spoon.current.visible = hold === 'spoon'
    if (spatula.current) spatula.current.visible = hold === 'spatula'
    if (basket.current) basket.current.visible = hold === 'basket'
    fillRefs.current.forEach((g, i) => { if (g) g.visible = i < (a?.fill ?? 0) })
    const sitting = pose === 'sit' || pose === 'eat'
    if (rootG.current) rootG.current.position.y = sitting ? -(a?.sitY ?? 0.29) : 0
    if (!a || pose === 'stand') return
    const t = a.t
    if (sitting) { set(hipL.current, -1.25); set(hipR.current, -1.25); set(kneeL.current, 1.25); set(kneeR.current, 1.25) }
    const torsoRot = (x: number, y = 0) => { if (torso.current) torso.current.rotation.set(x, y, 0) }
    const headRot = (x: number, y = 0) => { if (head.current) head.current.rotation.set(x, y, 0) }
    switch (pose) {
      case 'carry':
        set(shL.current, -1.2, 0, -0.1); set(shR.current, -1.2, 0, 0.1); set(elL.current, -0.45); set(elR.current, -0.45)
        torsoRot(-0.1 + sn * 0.0)
        break
      case 'sit':
        set(shL.current, -0.35, 0, 0.12); set(shR.current, -0.35, 0, -0.12); set(elL.current, -0.9); set(elR.current, -0.9)
        torsoRot(0.02); headRot(Math.sin(t * 0.8) * 0.03, Math.sin(t * 0.4) * 0.25)
        break
      case 'eat': {
        const feed = (Math.sin(t * 3.2) + 1) / 2
        set(shR.current, -0.85 - 0.45 * feed, 0, -0.05); set(elR.current, -0.95 - 1.15 * feed)
        set(shL.current, -0.95, 0, 0.05); set(elL.current, -0.45)
        torsoRot(0.1 - 0.05 * feed); headRot(0.18 - 0.1 * feed, 0)
        break
      }
      case 'cook':
        set(shR.current, -0.95 + Math.sin(t * 5) * 0.1, 0, -0.1 + Math.cos(t * 5) * 0.1); set(elR.current, -0.9)
        set(shL.current, -0.8, 0, 0.1); set(elL.current, -0.7)
        torsoRot(0.1); headRot(0.25, 0)
        break
      case 'browse': {
        const r = a.reach
        set(shL.current, -0.3, 0, 0.12); set(elL.current, -1.25)
        set(shR.current, -1.35 * r, 0, -0.08 - 0.05 * r); set(elR.current, -0.25 * r - 0.1)
        torsoRot(0.12 * r); headRot(0.05, Math.sin(t * 0.9) * 0.45 * (1 - r))
        break
      }
      case 'sleep':
        headRot(0, 0)
        break
    }
    if (basket.current) basket.current.rotation.x = pose === 'browse' ? 1.25 + 0.3 : 0
  })

  const shoe = sandals ? '#6b4a2f' : '#f2f2f2'
  const sole = sandals ? '#3a2a1c' : '#d9d9d9'
  const shirtDark = shade(shirt, 0.82)
  const skinDark = shade(skin, 0.86)
  const hairCol = hair
  const sleeveSkin = hoodie && !female // lengan bawah digulung (cowok)

  const leg = (side: 1 | -1, hip: React.RefObject<Group>, knee: React.RefObject<Group>) => (
    <G r={hip} p={[side * 0.095, 0.93, 0]}>
      <Cap r={0.078} l={0.3} p={[0, -0.2, 0]} c={pants} />
      <G r={knee} p={[0, -0.43, 0]}>
        <Cap r={0.06} l={0.3} p={[0, -0.2, 0]} c={pants} />
        {/* sepatu: grup kaki di pergelangan (0.43 m di bawah lutut) */}
        <group position={[0, -0.43, 0]}>
        <RoundedBox args={[0.108, 0.04, 0.28]} radius={0.018} smoothness={3} position={[0, -0.052, 0.04]} castShadow>
          <meshStandardMaterial color={sole} roughness={0.7} />
        </RoundedBox>
        <RoundedBox args={[0.1, 0.055, 0.2]} radius={0.025} smoothness={3} position={[0, -0.012, 0.03]} castShadow>
          <meshStandardMaterial color={shoe} roughness={0.55} />
        </RoundedBox>
        <Ball r={0.052} p={[0, -0.025, 0.125]} s={[0.95, 0.6, 1.2]} c={shoe} rough={0.55} />
        {!sandals && <Blk w={0.05} h={0.012} d={0.07} p={[0, 0.02, 0.09]} c="#cfcfcf" rough={0.9} />}
        {sandals && <Blk w={0.09} h={0.014} d={0.05} p={[0, 0.012, 0.06]} c="#4a3322" />}
        </group>
      </G>
    </G>
  )

  const arm = (side: 1 | -1, sh: React.RefObject<Group>, el: React.RefObject<Group>) => (
    <G r={sh} p={[side * 0.2, 0.5, 0]}>
      <Ball r={0.055} c={shirt} s={[1, 1, 1]} />
      <Cap r={0.047} l={0.2} p={[0, -0.15, 0]} c={shirt} />
      <G r={el} p={[0, -0.3, 0]}>
        <Cap r={0.041} l={0.19} p={[0, -0.12, 0]} c={sleeveSkin ? skin : shirt} rough={sleeveSkin ? 0.6 : 0.85} />
        {sleeveSkin && <Cap r={0.046} l={0.025} p={[0, -0.01, 0]} c={shirtDark} />}
        {/* tangan */}
        <Ball r={0.044} p={[0, -0.275, 0.005]} s={[0.85, 1.25, 0.7]} c={skin} rough={0.6} />
        <Ball r={0.017} p={[side * -0.03, -0.25, 0.025]} s={[1, 1.5, 1]} c={skin} rough={0.6} seg={10} />
        {side === 1 && (
          <group ref={basket} position={[0, -0.34, 0.09]} visible={false}>
            <Blk w={0.3} h={0.03} d={0.2} p={[0, -0.07, 0]} c="#c0392b" rough={0.6} />
            <Blk w={0.3} h={0.14} d={0.015} p={[0, 0, 0.1]} c="#c0392b" rough={0.6} />
            <Blk w={0.3} h={0.14} d={0.015} p={[0, 0, -0.1]} c="#c0392b" rough={0.6} />
            <Blk w={0.015} h={0.14} d={0.2} p={[0.15, 0, 0]} c="#c0392b" rough={0.6} />
            <Blk w={0.015} h={0.14} d={0.2} p={[-0.15, 0, 0]} c="#c0392b" rough={0.6} />
            <mesh position={[0, 0.07, 0]} rotation={[0, 0, 0]}><torusGeometry args={[0.1, 0.01, 6, 16, Math.PI]} /><meshStandardMaterial color="#8a1f17" /></mesh>
            {['#f1c40f', '#27ae60', '#e67e22', '#3498db', '#e74c3c', '#9b59b6'].map((c, i) => (
              <group key={i} ref={(g) => { fillRefs.current[i] = g }} visible={false}>
                <Blk w={0.08} h={0.09} d={0.07} p={[-0.1 + (i % 3) * 0.1, -0.02, i < 3 ? 0.04 : -0.04]} c={c} />
              </group>
            ))}
          </group>
        )}
        {side === -1 && (
          <>
            <group ref={spoon} position={[0, -0.3, 0.05]} rotation={[-0.5, 0, 0]} visible={false}>
              <Blk w={0.018} h={0.14} d={0.018} p={[0, -0.03, 0]} c="#cfd3d8" />
              <Ball r={0.03} p={[0, -0.1, 0]} s={[1, 0.5, 1.3]} c="#cfd3d8" seg={8} />
              <Ball r={0.022} p={[0, -0.098, 0.005]} s={[1, 0.5, 1.2]} c="#f6f1e4" seg={8} />
            </group>
            <group ref={spatula} position={[0, -0.3, 0.05]} rotation={[-0.6, 0, 0]} visible={false}>
              <Blk w={0.02} h={0.26} d={0.02} p={[0, -0.05, 0]} c="#6b4a2f" />
              <Blk w={0.09} h={0.1} d={0.012} p={[0, -0.2, 0]} c="#8a5a35" />
            </group>
          </>
        )}
        {side === 1 && sleeveSkin && (
          <mesh position={[0, -0.2, 0]} castShadow>
            <cylinderGeometry args={[0.044, 0.044, 0.022, 16]} />
            <meshStandardMaterial color="#222" metalness={0.5} roughness={0.3} />
          </mesh>
        )}
      </G>
    </G>
  )

  return (
    <group scale={0.97}>
      <group ref={rootG}>
      {leg(1, hipL, kneeL)}
      {leg(-1, hipR, kneeR)}
      <Ball r={0.13} p={[0, 0.95, 0]} s={[1.2, 0.75, 0.85]} c={pants} rough={0.9} />

      <G r={torso} p={[0, 0.92, 0]}>
        {/* badan */}
        <Cap r={0.13} l={0.3} p={[0, 0.25, 0]} s={[1.38, 1, 0.82]} c={shirt} />
        <Ball r={0.1} p={[0, 0.05, 0]} s={[1.5, 0.9, 1]} c={shirt} rough={0.9} />
        {hoodie && (
          <>
            <Blk w={0.24} h={0.1} d={0.02} p={[0, 0.1, 0.112]} c={shirtDark} />
            <mesh position={[0, 0.55, -0.05]} rotation={[0.35, 0, 0]} castShadow>
              <torusGeometry args={[0.085, 0.04, 10, 20]} />
              <meshStandardMaterial color={shirt} roughness={0.9} />
            </mesh>
            <Cap r={0.007} l={0.1} p={[0.04, 0.42, 0.118]} c="#e8e8e8" />
            <Cap r={0.007} l={0.1} p={[-0.04, 0.42, 0.118]} c="#e8e8e8" />
          </>
        )}
        {!hoodie && (
          <>
            {/* kerah + kancing */}
            <Blk w={0.1} h={0.03} d={0.03} p={[0, 0.53, 0.085]} c={tint(shirt, 0.25)} />
            {[0.38, 0.28, 0.18].map((y) => <Ball key={y} r={0.01} p={[0, y, 0.118]} c="#e9e4d8" seg={8} />)}
            <Blk w={0.07} h={0.07} d={0.015} p={[0.07, 0.36, 0.114]} c={shirtDark} />
          </>
        )}
        {/* leher */}
        <Cap r={0.045} l={0.06} p={[0, 0.58, 0]} c={skin} rough={0.6} />

        {/* kepala */}
        <G r={head} p={[0, 0.72, 0]}>
          <Ball r={0.105} s={[0.92, 1.15, 1.0]} c={skin} seg={24} />
          <Ball r={0.07} p={[0, -0.07, 0.025]} s={[1, 0.8, 0.9]} c={skin} />
          <Ball r={0.024} p={[0.096, 0, 0]} s={[0.55, 1, 0.8]} c={skinDark} seg={10} />
          <Ball r={0.024} p={[-0.096, 0, 0]} s={[0.55, 1, 0.8]} c={skinDark} seg={10} />
          {[1, -1].map((sd) => (
            <group key={sd}>
              <Ball r={0.02} p={[sd * 0.04, 0.012, 0.094]} s={[1.25, 0.85, 0.5]} c="#f6f4ee" rough={0.3} seg={12} />
              <Ball r={0.0115} p={[sd * 0.04, 0.012, 0.102]} s={[1, 1, 0.6]} c="#1a1210" rough={0.2} seg={10} />
              <Blk w={0.042} h={0.008} d={0.01} p={[sd * 0.042, 0.048, 0.098]} rot={[0, 0, sd * -0.12]} c={elder ? '#bdbdbd' : hairCol} />
            </group>
          ))}
          <Ball r={0.019} p={[0, -0.018, 0.106]} s={[1, 1.25, 1.2]} c={skinDark} rough={0.6} seg={12} />
          <Blk w={0.042} h={0.007} d={0.008} p={[0, -0.062, 0.098]} c={female ? '#a23d4a' : '#8c4a44'} rough={0.5} />
          {elder && <Blk w={0.06} h={0.014} d={0.012} p={[0, -0.047, 0.1]} c="#cfcfcf" />}

          {/* rambut */}
          <mesh position={[0, 0.012, -0.006]} rotation={[-0.5, 0, 0]} scale={[0.95, 1.18, 1.05]} castShadow>
            <sphereGeometry args={[0.113, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            <meshStandardMaterial color={hairCol} roughness={0.8} />
          </mesh>
          <Blk w={0.15} h={0.022} d={0.03} p={[0, 0.088, 0.082]} rot={[-0.2, 0, 0]} c={hairCol} rough={0.8} />
          {!elder && <Blk w={0.02} h={0.07} d={0.05} p={[0.1, 0.03, 0.0]} c={hairCol} rough={0.8} />}
          {!elder && <Blk w={0.02} h={0.07} d={0.05} p={[-0.1, 0.03, 0.0]} c={hairCol} rough={0.8} />}
          {female && (
            <>
              <Ball r={0.05} p={[0, 0.06, -0.115]} c={hairCol} rough={0.8} />
              <Cap r={0.032} l={0.17} p={[0, -0.04, -0.15]} rot={[-0.35, 0, 0]} c={hairCol} rough={0.8} />
              <Blk w={0.1} h={0.12} d={0.03} p={[0, -0.01, -0.095]} c={hairCol} rough={0.8} />
            </>
          )}
        </G>

        <group ref={crate} visible={false}>
          <Blk w={0.44} h={0.3} d={0.36} p={[0, 0.2, 0.34]} c="#c99055" />
          <Blk w={0.46} h={0.04} d={0.38} p={[0, 0.2, 0.34]} c="#a8722f" />
          <Blk w={0.04} h={0.31} d={0.37} p={[0, 0.2, 0.34]} c="#a8722f" />
        </group>

        {/* lengan */}
        {arm(1, shL, elL)}
        {arm(-1, shR, elR)}

        {/* tas punggung */}
        {backpack && (
          <group>
            <RoundedBox args={[0.3, 0.42, 0.15]} radius={0.04} smoothness={4} position={[0, 0.3, -0.2]} castShadow>
              <meshStandardMaterial color="#1c1c21" roughness={0.75} />
            </RoundedBox>
            <RoundedBox args={[0.24, 0.17, 0.05]} radius={0.02} smoothness={3} position={[0, 0.2, -0.285]} castShadow>
              <meshStandardMaterial color="#26262c" roughness={0.75} />
            </RoundedBox>
            <Blk w={0.04} h={0.015} d={0.22} p={[0.085, 0.5, -0.09]} c="#16161a" />
            <Blk w={0.04} h={0.015} d={0.22} p={[-0.085, 0.5, -0.09]} c="#16161a" />
            <Blk w={0.04} h={0.34} d={0.02} p={[0.085, 0.33, 0.11]} c="#16161a" />
            <Blk w={0.04} h={0.34} d={0.02} p={[-0.085, 0.33, 0.11]} c="#16161a" />
          </group>
        )}
      </G>
      </group>
    </group>
  )
}
