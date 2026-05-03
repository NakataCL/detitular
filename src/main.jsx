// Punto de entrada de la aplicación
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import toast from 'react-hot-toast'
import './index.css'
import App from './App.jsx'

window.__APP_VERSION__ = __APP_VERSION__
window.__BUILD_TIME__ = __BUILD_TIME__
console.info(`[detitular] v${__APP_VERSION__} (${__BUILD_TIME__})`)

const UPDATE_CHECK_INTERVAL_MS = 30 * 60 * 1000
const FOREGROUND_GRACE_MS = 60 * 1000

// Si ya había un SW controlando al cargar, un futuro controllerchange = nueva versión.
// Si no había, el primer claim es la instalación inicial: la página ya muestra el código actual.
const hadController = !!navigator.serviceWorker?.controller
let swRegistration = null
let lastUpdateCheck = Date.now()
let reloading = false

registerSW({
  immediate: true,
  onRegisteredSW(swUrl, registration) {
    swRegistration = registration
    if (registration) {
      setInterval(() => {
        if (navigator.onLine) {
          registration.update().catch(() => {})
          lastUpdateCheck = Date.now()
        }
      }, UPDATE_CHECK_INTERVAL_MS)
      if (navigator.onLine) checkVersionJson()
    }
  },
  onNeedRefresh() {
    notifyAndReload()
  },
  onOfflineReady() {
    console.info('[detitular] offline ready')
  },
  onRegisterError(err) {
    console.error('[detitular] SW error:', err)
  }
})

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return
    if (!hadController) return
    reloading = true
    notifyAndReload()
  })
}

function notifyAndReload() {
  const isTyping = () => {
    const el = document.activeElement
    if (!el) return false
    return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable
  }

  const doReload = () => {
    toast.success('Actualizando a la última versión...', { duration: 1800 })
    setTimeout(() => window.location.reload(), 1800)
  }

  if (!isTyping()) {
    doReload()
    return
  }

  toast('Nueva versión lista. Se aplicará cuando termines de escribir.', {
    icon: 'ℹ️',
    duration: 4000
  })

  const cleanup = () => {
    clearTimeout(timer)
    document.removeEventListener('focusout', onBlur, true)
  }
  const onBlur = () => { cleanup(); doReload() }
  const timer = setTimeout(() => { cleanup(); doReload() }, 30000)
  document.addEventListener('focusout', onBlur, true)
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return
  if (Date.now() - lastUpdateCheck < FOREGROUND_GRACE_MS) return
  lastUpdateCheck = Date.now()
  swRegistration?.update().catch(() => {})
  checkVersionJson()
})

window.addEventListener('online', () => {
  swRegistration?.update().catch(() => {})
  checkVersionJson()
})

async function checkVersionJson() {
  try {
    const res = await fetch(
      `${import.meta.env.BASE_URL}version.json?t=${Date.now()}`,
      { cache: 'no-store' }
    )
    if (!res.ok) return
    const { version } = await res.json()
    if (version && version !== __APP_VERSION__) {
      console.info('[detitular] nueva versión detectada:', version)
      // Solo nudge al SW: cuando termine de instalar y activar el nuevo,
      // el listener de controllerchange se encarga del reload.
      swRegistration?.update().catch(() => {})
    }
  } catch {
    // offline u otro fallo: ignorar
  }
}

// Renderizar aplicación
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
