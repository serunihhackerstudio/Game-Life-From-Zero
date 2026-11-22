import { useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { clone as cloneSkinned, retargetClip } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { AnimationClip, AnimationMixer, Box3, Material, Mesh, Object3D, SkinnedMesh, Vector3, type AnimationAction } from 'three'

export type Pose = 'idle' | 'walk' | 'run'
const URL = { male: '/models/male.glb', female: '/models/female.glb', anims: '/models/anims.glb' }
const HEIGHT = { male: 1.76, female: 1.68 }
const CLIP: Record<Pose, string> = { idle: 'Idle', walk: 'Walk', run: 'Run' }

Object.values(URL).forEach((u) => useGLTF.preload(u))

const clipCache = new Map<string, Record<Pose, AnimationClip>>()

function firstSkinned(o: Object3D): SkinnedMesh | null {
  let best: SkinnedMesh | null = null
  o.traverse((c) => {
    const m = c as SkinnedMesh
    if (m.isSkinnedMesh && (!best || m.skeleton.bones.length > best.skeleton.bones.length)) best = m
  })
  return best
}

/** Retarget klip Mixamo (Soldier) ke rig target. Rest-pose tiap model berbeda, jadi dihitung di ruang dunia. */
function buildClips(kind: string, root: Object3D, animsScene: Object3D, animClips: AnimationClip[]): Record<Pose, AnimationClip> {
  const hit = clipCache.get(kind)
  if (hit) return hit
  const target = firstSkinned(root)!
  const source = animsScene.getObjectByName('vanguard_Mesh') as SkinnedMesh
  root.updateMatrixWorld(true); animsScene.updateMatrixWorld(true)

  const hasPrefix = target.skeleton.bones.some((b) => b.name === 'mixamorigHips')
  const names: Record<string, string> = {}
  for (const b of target.skeleton.bones) names[b.name] = hasPrefix ? b.name : 'mixamorig' + b.name
  const tHips = target.skeleton.bones.find((b) => b.name === (hasPrefix ? 'mixamorigHips' : 'Hips'))!
  const sHips = source.skeleton.bones.find((b) => b.name === 'mixamorigHips')!
  const tY = new Vector3().setFromMatrixPosition(tHips.matrixWorld).y
  const sY = new Vector3().setFromMatrixPosition(sHips.matrixWorld).y
  const vAxis = ['x', 'y', 'z'].reduce((m, k) => (Math.abs(tHips.position[k as 'x']) > Math.abs(tHips.position[m as 'x']) ? k : m), 'x') as 'x' | 'y' | 'z'

  // retargetClip mengubah transform tulang (termasuk skala); simpan lalu pulihkan agar rig tetap utuh
  const snap = target.skeleton.bones.map((b) => ({ b, p: b.position.clone(), q: b.quaternion.clone(), s: b.scale.clone() }))
  const out = {} as Record<Pose, AnimationClip>
  ;(Object.keys(CLIP) as Pose[]).forEach((p) => {
    const src = animClips.find((a) => a.name === CLIP[p])!
    const clip = retargetClip(target, source, src, { names, hip: 'mixamorigHips', scale: tY / sY })
    // gerak di tempat: kunci sumbu horizontal pinggul ke frame pertama
    const hp = clip.tracks.find((t) => t.name === `.bones[${tHips.name}].position`)
    if (hp) {
      const v = hp.values
      const x0 = v[0], y0 = v[1], z0 = v[2]
      for (let i = 0; i < v.length; i += 3) {
        if (vAxis !== 'x') v[i] = x0
        if (vAxis !== 'y') v[i + 1] = y0
        if (vAxis !== 'z') v[i + 2] = z0
      }
    }
    out[p] = clip
  })
  for (const { b, p, q, s } of snap) { b.position.copy(p); b.quaternion.copy(q); b.scale.copy(s) }
  root.updateMatrixWorld(true)
  clipCache.set(kind, out)
  return out
}

interface Props {
  kind: 'male' | 'female'
  poseRef?: MutableRefObject<Pose>
  npc?: { beard?: boolean; top?: string; scale?: number }
}

export function Character({ kind, poseRef, npc }: Props) {
  const model = useGLTF(URL[kind])
  const anims = useGLTF(URL.anims)

  const { root, actions, mixer, scale, offsetY } = useMemo(() => {
    const root = cloneSkinned(model.scene)
    root.traverse((o) => {
      const m = o as Mesh
      if (!m.isMesh) return
      m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false
      if (m.name === 'Wolf3D_Beard') m.visible = !!npc?.beard
      if (npc?.top && m.name === 'Wolf3D_Outfit_Top') {
        m.material = (m.material as Material).clone()
        ;(m.material as unknown as { color: { set: (c: string) => void } }).color.set(npc.top)
      }
    })
    root.updateMatrixWorld(true)
    root.traverse((o) => { if ((o as SkinnedMesh).isSkinnedMesh) (o as SkinnedMesh).skeleton.update() })
    // presisi: pakai posisi vertex setelah skinning (bounding box bawaan mengabaikan skala tulang)
    const box = new Box3().setFromObject(root, true)
    const h = box.max.y - box.min.y || 1
    const scale = (HEIGHT[kind] * (npc?.scale ?? 1)) / h
    const offsetY = -box.min.y * scale
    const mixer = new AnimationMixer(firstSkinned(root)!) // track '.bones[..]' butuh root SkinnedMesh
    const clips = buildClips(kind, root, anims.scene, anims.animations)
    const actions = {} as Record<Pose, AnimationAction>
    ;(Object.keys(clips) as Pose[]).forEach((p) => { actions[p] = mixer.clipAction(clips[p]) })
    return { root, actions, mixer, scale, offsetY }
  }, [model, anims, kind, npc?.beard, npc?.top, npc?.scale])

  const cur = useRef<Pose | null>(null)
  useEffect(() => () => { mixer.stopAllAction() }, [mixer])

  useFrame((_, dt) => {
    const want = poseRef?.current ?? 'idle'
    if (want !== cur.current) {
      const next = actions[want]
      const prev = cur.current ? actions[cur.current] : null
      if (next) {
        next.reset().play()
        if (prev) prev.crossFadeTo(next, 0.2, false)
        else next.fadeIn(0.2)
        next.timeScale = want === 'run' ? 1 : 1
      }
      cur.current = want
    }
    mixer.update(Math.min(dt, 0.05))
  })

  return (
    <group>
      <primitive object={root} scale={scale} position={[0, offsetY, 0]} />
    </group>
  )
}
