import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import 'leaflet/dist/leaflet.css'
import App from './App.jsx'
import { prefetchMapBrands } from './api/liveBusinesses'
import { Capacitor } from '@capacitor/core'
import { installNativeShare } from './mobile/lib/nativeShare'

// The App Store app is only the /mobile app: it opens there, whatever
// address the app's web view starts on.
installNativeShare()
// Marks the App Store app, so the desktop "phone frame" preview (index.css)
// never shows inside it — on iPad its screen is wide enough to trigger it.
if (Capacitor.isNativePlatform()) document.documentElement.classList.add('native-app')
if (Capacitor.isNativePlatform() && !window.location.pathname.startsWith('/mobile')) {
  window.history.replaceState(null, '', '/mobile')
}

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

// The map pins load from the very start, alongside the page itself, rather
// than once the map has rendered — on the public site and the app only.
if (!/^\/(admin|business)(\/|$)/.test(window.location.pathname)) prefetchMapBrands()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
