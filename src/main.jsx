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
if (Capacitor.isNativePlatform() && !window.location.pathname.startsWith('/mobile')) {
  window.history.replaceState(null, '', '/mobile')
}

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
