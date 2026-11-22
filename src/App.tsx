import { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { HUD } from './HUD'
import { Menu } from './Menu'
import { Player } from './Player'
import { World } from './World'
import { useGame } from './store'

export default function App() {
  const screen = useGame((s) => s.screen)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const g = useGame.getState()
      if (e.code === 'Escape') { if (g.ui) g.closeUi(); else g.togglePause() }
      if (e.code === 'KeyI' && !e.repeat) { if (g.ui?.kind === 'inv') g.closeUi(); else if (!g.ui) g.openUi({ kind: 'inv' }) }
    }
    const save = () => useGame.getState().saveNow()
    const onVis = () => { if (document.hidden) save() }
    const iv = setInterval(save, 30000)
    window.addEventListener('keydown', onKey)
    document.addEventListener('visibilitychange', onVis)
    return () => { clearInterval(iv); window.removeEventListener('keydown', onKey); document.removeEventListener('visibilitychange', onVis) }
  }, [])

  if (screen === 'menu') return <Menu />
  return (
    <>
      <Canvas shadows camera={{ fov: 55, near: 0.1, far: 200, position: [-18, 8, -22] }}>
        <World />
        <Player />
      </Canvas>
      <HUD />
    </>
  )
}
