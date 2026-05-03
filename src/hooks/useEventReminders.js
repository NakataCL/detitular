// Hook que sincroniza recordatorios locales con las inscripciones futuras.
import { useEffect, useState, useCallback } from 'react'
import {
  isNotificationsSupported,
  supportsTriggers,
  getPermissionState,
  requestNotificationPermission,
  syncEventReminders,
  clearAllReminders
} from '../services/notifications'
import { useMyRegistrationsHydrated } from './useRegistrations'

const STORAGE_KEY = 'reminders.enabled'

const readOptIn = () => {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(STORAGE_KEY) === '1'
}

export const useEventReminders = () => {
  const { data: regs } = useMyRegistrationsHydrated()
  const [enabled, setEnabled] = useState(readOptIn)
  const [permission, setPermission] = useState(getPermissionState())

  // Sincronizar recordatorios al cambiar las inscripciones o el opt-in
  useEffect(() => {
    if (!enabled || permission !== 'granted') return
    const upcoming = (regs || [])
      .filter(r => r.event && !r.canceledAt)
      .map(r => r.event)
      .filter(e => {
        const t = e.date?.toDate?.()?.getTime() || new Date(e.date).getTime()
        return t > Date.now()
      })
    syncEventReminders(upcoming).catch(() => {})
  }, [enabled, permission, regs])

  const enable = useCallback(async () => {
    const result = await requestNotificationPermission()
    setPermission(result)
    if (result === 'granted') {
      window.localStorage.setItem(STORAGE_KEY, '1')
      setEnabled(true)
      return true
    }
    return false
  }, [])

  const disable = useCallback(async () => {
    window.localStorage.setItem(STORAGE_KEY, '0')
    setEnabled(false)
    await clearAllReminders()
  }, [])

  return {
    enabled,
    permission,
    supported: isNotificationsSupported(),
    triggersSupported: supportsTriggers(),
    enable,
    disable
  }
}
