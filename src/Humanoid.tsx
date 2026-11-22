import { useMemo, useRef, useState, type MutableRefObject, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, RoundedBox } from '@react-three/drei'
import { Color, type Group } from 'three'

export type PoseName = 'stand' | 'sit' | 'carry' | 'eat' | 'cook' | 'browse' | 'sleep' | 'sell' | 'signal' | 'tray' | 'talk' | 'patrol'
export type Hold = 'none' | 'crate' | 'spoon' | 'spatula' | 'basket' | 'paper' | 'tray' | 'torch'
/** Perintah adegan: pose khusus + benda di tangan. t = detik sejak adegan mulai. */
export interface Act { pose: PoseName; hold: Hold; t: number; reach: number; fill: number; sitY: number }
/** Kondisi tubuh (0-100) yang memengaruhi tampilan & gerak karakter. */
export interface Cond { hunger: number; energy: number; health: number; mood: number }
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
function Ball({ r, p, s, c, rough = 0.6, seg = 16, cast = true }: { r: number; p?: V3; s?: V3; c: string; rough?: number; seg?: number; cast?: boolean }) {
  return (
    <mesh position={p} scale={s} castShadow={cast} receiveShadow={false}>
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

export function Humanoid({ look, speedRef, actRef, condRef }: { look: Look; speedRef?: MutableRefObject<number>; actRef?: MutableRefObject<Act>; condRef?: MutableRefObject<Cond> }) {
  const { shirt, pants, skin: skinBase, hair, female, hoodie, backpack, elder, sandals } = look
  const [pale, setPale] = useState(0)
  const palRef = useRef(0)
  const skin = useMemo(() => '#' + new Color(skinBase).lerp(new Color('#b6b3a0'), pale * 0.55).getHexString(), [skinBase, pale])
  const browRefs = useRef<(Group | null)[]>([])
  const mouthG = useRef<Group>(null), bags = useRef<Group>(null), bubble = useRef<HTMLDivElement>(null)
  const hipL = useRef<Group>(null), hipR = useRef<Group>(null)
  const kneeL = useRef<Group>(null), kneeR = useRef<Group>(null)
  const shL = useRef<Group>(null), shR = useRef<Group>(null)
  const elL = useRef<Group>(null), elR = useRef<Group>(null)
  const torso = useRef<Group>(null), head = useRef<Group>(null)
  const st = useRef({ t: 0, phase: 0, k: 0 })
  const rootG = useRef<Group>(null)
  const crate = useRef<Group>(null), spoon = useRef<Group>(null), spatula = useRef<Group>(null), basket = useRef<Group>(null)
  const fillRefs = useRef<(Group | null)[]>([])
  const packRef = useRef<Group>(null), lids = useRef<Group>(null)
  const paper = useRef<Group>(null), tray = useRef<Group>(null), torch = useRef<Group>(null)
  const shoeRefs = useRef<(Group | null)[]>([])

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

    // ---- kondisi tubuh: lapar, lelah, sakit, murung tampak pada karakter ----
    const cd = condRef?.current
    const lv = (v: number, th: number) => Math.min(1, Math.max(0, (th - v) / th))
    const hL = cd ? lv(cd.hunger, 35) : 0, eL = cd ? lv(cd.energy, 35) : 0, sL = cd ? lv(cd.health, 60) : 0, mL = cd ? lv(cd.mood, 35) : 0
    const worst = Math.max(hL, eL * 0.9, sL * 0.7, mL * 0.6)
    const act0 = actRef?.current
    const sleeping = act0?.pose === 'sleep'
    const standing = !act0 || act0.pose === 'stand'
    const T = s.t
    if (cd) {
      const pl = Math.round(Math.max(sL * 0.9, hL * 0.7, eL * 0.4) * 10) / 10
      if (pl !== palRef.current) { palRef.current = pl; setPale(pl) }
    }
    // mata sayu / kantung mata / alis sedih / mulut
    const closure = sleeping ? 1 : eL * 0.75
    if (lids.current) { lids.current.visible = sleeping || closure > 0.15; lids.current.position.y = sleeping ? 0 : (1 - closure) * 0.035 }
    if (bags.current) bags.current.visible = eL > 0.3 || sL > 0.5
    browRefs.current.forEach((g, i) => { if (g) g.rotation.z = (i === 0 ? 1 : -1) * (-0.12 - 0.5 * mL - 0.2 * eL) })
    // gelembung ucapan + gerak tubuh bergantung kondisi terparah
    let msg = ''
    if (cd) {
      if (hL > 0.5 && T % 11 < 2.4) msg = 'krucuk… krucuk…'
      else if (eL > 0.5 && (T + 4) % 13 < 2.4) msg = 'huaaam…'
      else if (sL > 0.5 && (T + 7) % 10 < 2.0) msg = 'uhuk! uhuk!'
      else if (mL > 0.6 && (T + 2) % 14 < 2.0) msg = 'huft…'
    }
    if (bubble.current) { if (bubble.current.textContent !== msg) bubble.current.textContent = msg; bubble.current.style.opacity = msg ? '1' : '0' }
    const growl = msg.startsWith('kru'), yawn = msg.startsWith('hua'), cough = msg.startsWith('uhu'), sigh = msg.startsWith('huf')
    if (mouthG.current) { const open = yawn ? 7 : 1; mouthG.current.scale.y += (open - mouthG.current.scale.y) * 0.25; mouthG.current.position.y = -mL * 0.006 }
    if (rootG.current) rootG.current.rotation.z = standing && (eL > 0.7 || hL > 0.85) ? Math.sin(T * 1.1) * 0.04 : 0
    if (standing && worst > 0) {
      const bl = (g: Group | null, x: number, y: number, z: number, b: number) => {
        if (!g || b <= 0) return
        g.rotation.x += (x - g.rotation.x) * b; g.rotation.y += (y - g.rotation.y) * b; g.rotation.z += (z - g.rotation.z) * b
      }
      if (torso.current) torso.current.rotation.x += 0.22 * worst + (cough ? 0.14 * Math.abs(Math.sin(T * 13)) : 0) + (growl ? 0.08 : 0)
      if (head.current) head.current.rotation.x += 0.28 * eL + 0.2 * mL + 0.15 * hL + (sigh ? 0.12 : 0)
      if (shL.current) shL.current.rotation.x += 0.1 * worst
      if (shR.current) shR.current.rotation.x += 0.1 * worst
      // tangan memegang perut saat lapar
      const cyc = (T / 9) % 1
      let belly = hL > 0.35 && cyc < 0.4 ? Math.sin((cyc / 0.4) * Math.PI) : 0
      if (growl) belly = 1
      if (hL > 0.8) belly = Math.max(belly, 0.85)
      bl(shR.current, -0.55, 0, 0.5, belly); bl(elR.current, -1.75, 0, 0, belly)
      // tangan ke mulut saat menguap / batuk
      if (yawn) { bl(shR.current, -1.75, 0, 0.2, 0.9); bl(elR.current, -2.3, 0, 0, 0.9) }
      if (cough) { bl(shR.current, -1.55, 0, 0.25, 0.9); bl(elR.current, -2.2, 0, 0, 0.9) }
    }

    // ---- pose adegan (aktivitas) ----
    const a = actRef?.current
    const pose = a?.pose ?? 'stand'
    const hold = a?.hold ?? 'none'
    if (crate.current) crate.current.visible = hold === 'crate'
    if (spoon.current) spoon.current.visible = hold === 'spoon'
    if (spatula.current) spatula.current.visible = hold === 'spatula'
    if (basket.current) basket.current.visible = hold === 'basket'
    if (paper.current) paper.current.visible = hold === 'paper'
    if (tray.current) tray.current.visible = hold === 'tray'
    if (torch.current) torch.current.visible = hold === 'torch'
    fillRefs.current.forEach((g, i) => { if (g) g.visible = i < (a?.fill ?? 0) })
    const asleep = pose === 'sleep'
    if (packRef.current) packRef.current.visible = !asleep
    shoeRefs.current.forEach((g) => { if (g) g.visible = !asleep })
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
      case 'patrol': { // satpam: senter diarahkan ke depan, menyapu kiri-kanan
        set(shR.current, -1.25, Math.sin(t * 0.9) * 0.35, -0.15); set(elR.current, -0.35)
        set(shL.current, -0.2 + Math.sin(t * 2) * 0.1, 0, 0.12); set(elL.current, -0.3)
        torsoRot(0.03, Math.sin(t * 0.9) * 0.12); headRot(0.02, Math.sin(t * 0.9) * 0.4)
        break
      }
      case 'talk': { // bergesture saat bicara
        const k = (Math.sin(t * 1.3) + 1) / 2
        set(shR.current, -0.8 - 0.5 * Math.sin(t * 2.6) ** 2, 0, -0.25 - 0.15 * k); set(elR.current, -1.0 - 0.5 * Math.sin(t * 2.6))
        set(shL.current, -0.4 - 0.25 * Math.sin(t * 1.7 + 1) ** 2, 0, 0.2); set(elL.current, -0.8 - 0.3 * Math.sin(t * 1.7 + 1))
        torsoRot(0.03, Math.sin(t * 0.7) * 0.06); headRot(Math.sin(t * 2.2) * 0.05, Math.sin(t * 0.6) * 0.12)
        break
      }
      case 'sell': // menjajakan koran: satu tangan terangkat melambai memegang koran
        set(shR.current, -2.7 + Math.sin(t * 5) * 0.25, 0, -0.1); set(elR.current, -0.25)
        set(shL.current, -0.5, 0, 0.1); set(elL.current, -1.4)
        torsoRot(-0.04); headRot(-0.08, Math.sin(t * 0.9) * 0.3)
        break
      case 'signal': { // tukang parkir mengarahkan motor
        const wv = Math.sin(t * 4)
        set(shR.current, -1.45 + wv * 0.35, 0, -0.35); set(elR.current, -0.5 - wv * 0.3)
        set(shL.current, 0.1, 0, 0.55); set(elL.current, -1.7)
        torsoRot(0.02, 0.15); headRot(0, 0.3 + Math.sin(t * 0.6) * 0.15)
        break
      }
      case 'tray': { // pelayan membawa nampan; reach = menyodorkan pesanan
        const r = a.reach
        set(shL.current, -0.95 - 0.35 * r, 0, -0.1); set(shR.current, -0.95 - 0.35 * r, 0, 0.1)
        set(elL.current, -1.25 + 0.5 * r); set(elR.current, -1.25 + 0.5 * r)
        torsoRot(0.02 + 0.06 * r)
        break
      }
      case 'sleep': // berbaring telentang: tangan di sisi badan, kepala menoleh sedikit
        set(shL.current, 0.05, 0, -0.2); set(shR.current, 0.05, 0, 0.2); set(elL.current, -0.2); set(elR.current, -0.2)
        set(hipL.current, 0, 0, 0.03); set(hipR.current, 0, 0, -0.03); set(kneeL.current, 0.03); set(kneeR.current, 0.03)
        headRot(0.1, 0.5 + Math.sin(t * 0.3) * 0.03)
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
        <group ref={(g) => { shoeRefs.current[side === 1 ? 0 : 1] = g }} position={[0, -0.43, 0]}>
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
            <group ref={paper} position={[0, -0.3, 0.02]} rotation={[0, 0, 0]} visible={false}>
              <Blk w={0.24} h={0.32} d={0.02} p={[0, -0.06, 0]} c="#e9e4d6" rough={0.9} />
              <Blk w={0.2} h={0.05} d={0.025} p={[0, 0.05, 0]} c="#2a2a2a" />
              {[-0.01, -0.06, -0.11].map((y) => <Blk key={y} w={0.18} h={0.012} d={0.025} p={[0, y, 0]} c="#9a958a" />)}
            </group>
            <group ref={torch} position={[0, -0.3, 0.06]} visible={false}>
              <Blk w={0.05} h={0.2} d={0.05} p={[0, -0.04, 0]} c="#2a2a2a" rough={0.4} />
              <Blk w={0.07} h={0.07} d={0.07} p={[0, -0.16, 0]} c="#555" rough={0.3} />
              <mesh position={[0, -0.2, 0]}><cylinderGeometry args={[0.04, 0.04, 0.012, 12]} /><meshBasicMaterial color="#fff6c8" /></mesh>
              <mesh position={[0, -0.8, 0]}><coneGeometry args={[0.45, 1.2, 14, 1, true]} /><meshBasicMaterial color="#fff2b0" transparent opacity={0.14} depthWrite={false} side={2} /></mesh>
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
      {condRef && (
        <Html position={[0, 2.05, 0]} center distanceFactor={9} style={{ pointerEvents: 'none' }}>
          <div ref={bubble} className="bubble" style={{ opacity: 0 }} />
        </Html>
      )}
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
          <Ball r={0.105} s={[0.92, 1.15, 1.0]} c={skin} seg={24} cast={false} />
          <Ball r={0.07} p={[0, -0.07, 0.025]} s={[1, 0.8, 0.9]} c={skin} cast={false} />
          <Ball r={0.024} p={[0.096, 0, 0]} s={[0.55, 1, 0.8]} c={skinDark} seg={10} />
          <Ball r={0.024} p={[-0.096, 0, 0]} s={[0.55, 1, 0.8]} c={skinDark} seg={10} />
          {[1, -1].map((sd) => (
            <group key={sd}>
              <Ball r={0.02} p={[sd * 0.04, 0.012, 0.094]} s={[1.25, 0.85, 0.5]} c="#f6f4ee" rough={0.3} seg={12} />
              <Ball r={0.0115} p={[sd * 0.04, 0.012, 0.102]} s={[1, 1, 0.6]} c="#1a1210" rough={0.2} seg={10} />
              <group ref={(g) => { browRefs.current[sd === 1 ? 0 : 1] = g }} position={[sd * 0.042, 0.048, 0.098]}><Blk w={0.042} h={0.008} d={0.01} c={elder ? '#bdbdbd' : hairCol} /></group>
            </group>
          ))}
          <group ref={bags} visible={false}>
            {[1, -1].map((sd) => <Ball key={sd} r={0.02} p={[sd * 0.04, -0.014, 0.097]} s={[1.3, 0.45, 0.4]} c={shade(skin, 0.68)} seg={8} />)}
          </group>
          <group ref={lids} visible={false}>
            {[1, -1].map((sd) => (
              <group key={sd}>
                <Ball r={0.024} p={[sd * 0.04, 0.013, 0.096]} s={[1.4, 0.85, 0.6]} c={skin} seg={10} />
                <Blk w={0.036} h={0.005} d={0.006} p={[sd * 0.04, 0.003, 0.108]} c="#2a1810" />
              </group>
            ))}
          </group>
          <Ball r={0.019} p={[0, -0.018, 0.106]} s={[1, 1.25, 1.2]} c={skinDark} rough={0.6} seg={12} />
          <group ref={mouthG} position={[0, -0.062, 0.098]}><Blk w={0.042} h={0.007} d={0.008} c={female ? '#a23d4a' : '#6e2f2f'} rough={0.5} /></group>
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

        <group ref={tray} visible={false}>
          <Blk w={0.56} h={0.025} d={0.36} p={[0, 0.2, 0.4]} c="#c9ccd1" rough={0.4} />
          {[-0.14, 0.14].map((x) => (
            <group key={x}>
              <Ball p={[x, 0.235, 0.4]} r={0.095} s={[1, 0.18, 1]} c="#ffffff" rough={0.3} seg={12} />
              <Ball p={[x, 0.26, 0.4]} r={0.06} s={[1, 0.55, 1]} c="#f6f1e4" seg={10} />
              <Ball p={[x + 0.03, 0.275, 0.38]} r={0.022} c="#c0392b" seg={8} />
            </group>
          ))}
          <Blk w={0.07} h={0.13} d={0.07} p={[0.02, 0.28, 0.48]} c="#d98a2d" />
        </group>
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
          <group ref={packRef}>
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
