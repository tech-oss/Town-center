import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import 'leaflet/dist/leaflet.css'
import App from './App.jsx'

// Pages load as they're visited. A tab opened before a new deploy asks for
// page files that deploy replaced; reload it (at most once a minute) so it
// picks up the new ones instead of showing a broken page.
window.addEventListener('vite:preloadError', (event) => {
  const KEY = 'mh_reloaded_for_update'
  let last = 0
  try { last = Number(sessionStorage.getItem(KEY)) || 0 } catch { /* storage blocked */ }
  if (Date.now() - last < 60_000) return
  try { sessionStorage.setItem(KEY, String(Date.now())) } catch { /* storage blocked */ }
  event.preventDefault()
  window.location.reload()
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
