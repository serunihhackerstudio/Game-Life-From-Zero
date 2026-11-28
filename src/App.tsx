import { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { HUD } from './HUD'
import { Menu } from './Menu'
import { Player } from './Player'
import { World } from './World'
import { useGame } from './store'
import { AudioDirector, Credits, Settings } from './Settings'
import { QUALITY, useSettings } from './settings'
import { Grading } from './Fx'

export default function App() {
  const screen = useGame((s) => s.screen)
  const quality = useSettings((s) => s.quality)
  const look = useSettings((s) => s.look)
  useEffect(() => { document.documentElement.dataset.look = look }, [look])
  const q = QUALITY[quality]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const g = useGame.getState()
      const st = useSettings.getState()
      if (e.code === 'Escape') { if (st.credits) st.setCredits(false); else if (st.open) st.setOpen(false); else if (g.ui) g.closeUi(); else g.togglePause() }
      if (e.code === 'KeyI' && !e.repeat) { if (g.ui?.kind === 'inv') g.closeUi(); else if (!g.ui) g.openUi({ kind: 'inv' }) }
    }
    const save = () => useGame.getState().saveNow()
    const onVis = () => { if (document.hidden) save() }
    const iv = setInterval(save, 30000)
    window.addEventListener('keydown', onKey)
    document.addEventListener('visibilitychange', onVis)
    return () => { clearInterval(iv); window.removeEventListener('keydown', onKey); document.removeEventListener('visibilitychange', onVis) }
  }, [])

  const overlays = <><Settings /><Credits /><AudioDirector /></>
  if (screen === 'menu') return <><Menu />{overlays}</>
  return (
    <>
      <Canvas key={quality} shadows={q.shadows} dpr={q.dpr} gl={{ antialias: q.aa }} camera={{ fov: 55, near: 0.1, far: 200, position: [-18, 8, -22] }}>
        <World />
        <Player />
      </Canvas>
      <HUD />
      {overlays}
    </>
  )
}
