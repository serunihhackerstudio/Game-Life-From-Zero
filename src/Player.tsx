import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Group, MathUtils, Vector3 } from 'three'
import { Character, type Pose } from './Character'
import { resolve, ZONES } from './data'
import { playerPos, useGame } from './store'

const RADIUS = 0.4
const WALK = 3.4, RUN = 6.2

export function Player() {
  const group = useRef<Group>(null)
  const pose = useRef<Pose>('idle')
  const keys = useRef<Record<string, boolean>>({})
  const yaw = useRef(Math.PI)
  const dist = useRef(3.8)
  const camTarget = useRef(new Vector3())
  const gender = useGame((s) => s.gender)
  const { gl } = useThree()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault()
      keys.current[e.code] = true
      if (e.code === 'KeyE' && !e.repeat) useGame.getState().interact()
    }
    const up = (e: KeyboardEvent) => { keys.current[e.code] = false }
    const blur = () => { keys.current = {} }
    let dragging = false
    const pd = () => { dragging = true }
    const pu = () => { dragging = false }
    const pm = (e: PointerEvent) => { if (dragging) yaw.current -= e.movementX * 0.005 }
    const wheel = (e: WheelEvent) => { dist.current = MathUtils.clamp(dist.current + e.deltaY * 0.01, 2.2, 10) }
    const el = gl.domElement
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', blur)
    el.addEventListener('pointerdown', pd); window.addEventListener('pointerup', pu); window.addEventListener('pointermove', pm)
    el.addEventListener('wheel', wheel, { passive: true })
    return () => {
      window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur)
      el.removeEventListener('pointerdown', pd); window.removeEventListener('pointerup', pu); window.removeEventListener('pointermove', pm)
      el.removeEventListener('wheel', wheel)
    }
  }, [gl])

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    const dt = Math.min(delta, 0.05)
    const s = useGame.getState()
    const frozen = s.paused || !!s.busy || !!s.gameOver
    const k = keys.current

    if (k.KeyQ) yaw.current += 1.8 * dt
    if (k.KeyR) yaw.current -= 1.8 * dt

    let speed = 0
    if (!frozen) {
      const fw = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0)
      const rt = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0)
      if (fw || rt) {
        const sy = Math.sin(yaw.current), cy = Math.cos(yaw.current)
        let vx = -sy * fw + cy * rt
        let vz = -cy * fw - sy * rt
        const len = Math.hypot(vx, vz)
        vx /= len; vz /= len
        const running = !!(k.ShiftLeft || k.ShiftRight) && s.energy > 5
        speed = running ? RUN : WALK
        const [nx, nz] = resolve(playerPos.x + vx * speed * dt, playerPos.z + vz * speed * dt, RADIUS)
        playerPos.x = nx; playerPos.z = nz
        const target = Math.atan2(vx, vz)
        let diff = target - playerPos.rot
        diff = Math.atan2(Math.sin(diff), Math.cos(diff))
        playerPos.rot += diff * Math.min(1, dt * 12)
        s.tick(dt, running)
      } else s.tick(dt, false)
    }

    g.position.set(playerPos.x, 0, playerPos.z)
    g.rotation.y = playerPos.rot

    pose.current = speed === 0 ? 'idle' : speed >= RUN ? 'run' : 'walk'

    // zona interaksi terdekat
    let best: (typeof ZONES)[number] | null = null, bd = Infinity
    for (const z of ZONES) {
      const d = Math.hypot(z.x - playerPos.x, z.z - playerPos.z)
      if (d < z.r && d < bd) { best = z; bd = d }
    }
    const id = best ? best.id : null
    if (id !== s.nearby) useGame.setState({ nearby: id })

    // kamera orang ketiga
    const d = dist.current
    camTarget.current.set(playerPos.x + Math.sin(yaw.current) * d, 1.55 + d * 0.3, playerPos.z + Math.cos(yaw.current) * d)
    state.camera.position.lerp(camTarget.current, 1 - Math.exp(-8 * dt))
    state.camera.lookAt(playerPos.x, 1.45, playerPos.z)
  })

  return (
    <group ref={group}>
      <Character kind={gender} poseRef={pose} />
    </group>
  )
}
