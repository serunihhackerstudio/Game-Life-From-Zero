import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

const root = createRoot(document.getElementById('root')!)
if (new URLSearchParams(location.search).has('preview')) {
  // halaman uji visual mini-game (tanpa dunia 3D)
  void import('./minigames/Preview').then((m) => root.render(<m.Preview />))
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
