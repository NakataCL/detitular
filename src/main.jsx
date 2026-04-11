// Punto de entrada de la aplicación
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'

// Registrar Service Worker para PWA
const updateSW = registerSW({
  onNeedRefresh() {
    // Mostrar prompt de actualización si es necesario
    if (confirm('Nueva versión disponible. ¿Actualizar?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('La aplicación está lista para funcionar offline')
  },
  onRegistered(r) {
    console.log('Service Worker registrado:', r)
  },
  onRegisterError(error) {
    console.error('Error al registrar Service Worker:', error)
  }
})

// Renderizar aplicación
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
