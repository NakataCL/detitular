// Hook para funcionalidades PWA
import { useState, useEffect } from 'react'

/**
 * Hook para manejar la instalación de la PWA
 */
export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [canInstall, setCanInstall] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Verificar si ya está instalada
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isIOSStandalone = window.navigator.standalone === true
      setIsInstalled(isStandalone || isIOSStandalone)
    }

    checkInstalled()

    // Escuchar evento de instalación disponible
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setCanInstall(true)
    }

    // Escuchar cuando se instala la app
    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setCanInstall(false)
      setIsInstalled(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const installPWA = async () => {
    if (!deferredPrompt) return false

    try {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        setDeferredPrompt(null)
        setCanInstall(false)
        return true
      }

      return false
    } catch (error) {
      console.error('Error al instalar PWA:', error)
      return false
    }
  }

  return { canInstall, isInstalled, installPWA }
}

/**
 * Hook para detectar actualizaciones del service worker
 */
export const usePWAUpdate = () => {
  const [needsUpdate, setNeedsUpdate] = useState(false)
  const [registration, setRegistration] = useState(null)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg)

        // Escuchar actualizaciones
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing

          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setNeedsUpdate(true)
              }
            })
          }
        })
      })
    }
  }, [])

  const updateApp = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
    window.location.reload()
  }

  return { needsUpdate, updateApp }
}

/**
 * Hook para manejar notificaciones push (FCM)
 */
export const usePushNotifications = () => {
  const [permission, setPermission] = useState(Notification.permission)
  const [token, setToken] = useState(null)

  useEffect(() => {
    setPermission(Notification.permission)
  }, [])

  const requestPermission = async () => {
    try {
      const result = await Notification.requestPermission()
      setPermission(result)

      if (result === 'granted') {
        // Aquí se obtendría el token de FCM
        // const messaging = getMessaging()
        // const fcmToken = await getToken(messaging, { vapidKey: '...' })
        // setToken(fcmToken)
        return true
      }

      return false
    } catch (error) {
      console.error('Error al solicitar permisos de notificación:', error)
      return false
    }
  }

  return { permission, token, requestPermission }
}

export default usePWAInstall
