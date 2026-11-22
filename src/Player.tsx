import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Group, MathUtils, Vector3 } from 'three'
import { Humanoid, type Look } from './Humanoid'
import { resolve, ZONES } from './data'
import { playerPos, useGame } from './store'

const RADIUS = 0.4
const WALK = 3.4, RUN = 6.2

export function Player() {
  const group = useRef<Group>(null)
  const speedRef = useRef(0)
  const keys = useRef<Record<string, boolean>>({})
  const yaw = useRef(Math.PI)
  const dist = useRef(9)
  const camTarget = useRef(new Vector3())
  const gender = useGame((s) => s.gender)
  const { gl } = useThree()

  // hook debug (hanya aktif dengan ?debug) untuk uji visual
  useEffect(() => {
    if (!new URLSearchParams(location.search).has('debug')) return
    ;(window as unknown as Record<string, unknown>).__lfz = {
      tp: (x: number, z: number, y = 0, d = 8) => { playerPos.x = x; playerPos.z = z; yaw.current = y; dist.current = d },
      set: (p: Record<string, unknown>) => useGame.setState(p),
    }
  }, [])

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
    const wheel = (e: WheelEvent) => { dist.current = MathUtils.clamp(dist.current + e.deltaY * 0.01, 3, 14) }
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
    const frozen = s.paused || !!s.ui || !!s.busy || !!s.gameOver
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

    speedRef.current = speed

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
    camTarget.current.set(playerPos.x + Math.sin(yaw.current) * d, 1.9 + d * 0.5, playerPos.z + Math.cos(yaw.current) * d)
    state.camera.position.lerp(camTarget.current, 1 - Math.exp(-8 * dt))
    state.camera.lookAt(playerPos.x, 1.3, playerPos.z)
  })

  const look: Look = gender === 'male'
    ? { shirt: '#3a6ea5', pants: '#3b4d66', skin: '#c68e64', hair: '#17110d', hoodie: true, backpack: true }
    : { shirt: '#b5496b', pants: '#46607f', skin: '#d9a47a', hair: '#2b1a12', female: true, hoodie: true, backpack: true }

  return (
    <group ref={group}>
      <Humanoid look={look} speedRef={speedRef} />
    </group>
  )
}
