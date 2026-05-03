// Servicio de notificaciones locales para recordatorios de eventos
// Estrategia:
//   1. Notification Triggers API (Chromium) — programa la notificación
//      directamente al SW para que dispare aunque la app esté cerrada.
//   2. Fallback setTimeout — sólo dispara mientras la app está abierta;
//      útil para recordatorios cercanos cuando hay sesión activa.

const REMINDER_OFFSET_MS = 60 * 60 * 1000 // 1h antes

export const isNotificationsSupported = () =>
  typeof window !== 'undefined' && 'Notification' in window

export const supportsTriggers = () =>
  isNotificationsSupported() &&
  'serviceWorker' in navigator &&
  'showTrigger' in Notification.prototype

export const getPermissionState = () =>
  isNotificationsSupported() ? Notification.permission : 'denied'

export const requestNotificationPermission = async () => {
  if (!isNotificationsSupported()) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  return Notification.requestPermission()
}

const eventToTime = (event) => {
  const d = event.date?.toDate ? event.date.toDate() : new Date(event.date)
  return d.getTime() - REMINDER_OFFSET_MS
}

const buildPayload = (event) => ({
  title: '⚽ Empieza pronto',
  body: `${event.title} · en 1 hora${event.location ? ` · ${event.location}` : ''}`,
  tag: `event-${event.id}`,
  data: { eventId: event.id, url: `/eventos/${event.id}` },
  badge: '/icons/icon-96x96.svg',
  icon: '/icons/icon-192x192.svg'
})

const fallbackTimers = new Map()

const clearFallback = (eventId) => {
  const id = fallbackTimers.get(eventId)
  if (id) {
    clearTimeout(id)
    fallbackTimers.delete(eventId)
  }
}

/**
 * Programa un recordatorio para un evento. Devuelve la estrategia usada.
 */
export const scheduleEventReminder = async (event) => {
  if (Notification.permission !== 'granted') return 'no-permission'

  const fireAt = eventToTime(event)
  if (fireAt <= Date.now()) return 'too-late'

  const payload = buildPayload(event)

  if (supportsTriggers()) {
    try {
      const reg = await navigator.serviceWorker.ready
      // showTrigger es propiedad experimental; lo asignamos por descriptor
      // para evitar warnings de TypeScript/ESLint en navegadores que no lo conozcan.
      await reg.showNotification(payload.title, {
        ...payload,
        showTrigger: new window.TimestampTrigger(fireAt)
      })
      return 'scheduled-trigger'
    } catch (err) {
      console.warn('Notification Triggers failed, falling back', err)
    }
  }

  // Fallback: setTimeout en memoria. Sólo sirve si la pestaña sigue abierta.
  clearFallback(event.id)
  const delay = fireAt - Date.now()
  // Limitar el delay a ~24h para evitar timeouts gigantes (setTimeout int32 max)
  if (delay > 24 * 60 * 60 * 1000) return 'too-far'

  const id = setTimeout(() => {
    try {
      new Notification(payload.title, { body: payload.body, tag: payload.tag, data: payload.data })
    } catch (err) {
      console.warn('Notification fire failed', err)
    } finally {
      fallbackTimers.delete(event.id)
    }
  }, delay)
  fallbackTimers.set(event.id, id)
  return 'scheduled-fallback'
}

/**
 * Cancela un recordatorio previo de un evento.
 */
export const cancelEventReminder = async (eventId) => {
  clearFallback(eventId)

  if (!('serviceWorker' in navigator)) return
  try {
    const reg = await navigator.serviceWorker.ready
    const notifications = await reg.getNotifications({
      tag: `event-${eventId}`,
      includeTriggered: true
    })
    notifications.forEach(n => n.close())
  } catch {
    // ignorar
  }
}

/**
 * Reprograma recordatorios para una lista de eventos. Cancela primero los
 * que ya no estén en la lista.
 */
export const syncEventReminders = async (events) => {
  const ids = new Set(events.map(e => e.id))

  // Cancelar fallbacks de eventos que ya no estén en la lista
  for (const [eventId] of fallbackTimers) {
    if (!ids.has(eventId)) clearFallback(eventId)
  }

  // Programar/Reprogramar
  const results = []
  for (const event of events) {
    results.push({ eventId: event.id, status: await scheduleEventReminder(event) })
  }
  return results
}

/**
 * Borra todos los recordatorios programados (uso al desactivar el opt-in).
 */
export const clearAllReminders = async () => {
  for (const [eventId] of fallbackTimers) clearFallback(eventId)

  if (!('serviceWorker' in navigator)) return
  try {
    const reg = await navigator.serviceWorker.ready
    const notifications = await reg.getNotifications({ includeTriggered: true })
    notifications
      .filter(n => n.tag && n.tag.startsWith('event-'))
      .forEach(n => n.close())
  } catch {
    // ignorar
  }
}
