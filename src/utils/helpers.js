// Funciones de utilidad
import { format, formatDistanceToNow, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds, isToday, isTomorrow, isPast, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { GOALKEEPER_SLOTS, GOALKEEPER_POSITION } from './constants.js'

/**
 * Formatea una fecha de Firestore Timestamp a string legible
 */
export const formatDate = (timestamp, formatStr = 'dd/MM/yyyy') => {
  if (!timestamp) return ''

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return format(date, formatStr, { locale: es })
}

/**
 * Formatea fecha con hora
 */
export const formatDateTime = (timestamp) => {
  return formatDate(timestamp, "EEEE d 'de' MMMM, HH:mm'h'")
}

/**
 * Formatea fecha corta para cards
 */
export const formatShortDate = (timestamp) => {
  if (!timestamp) return ''

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)

  if (isToday(date)) {
    return 'Hoy, ' + format(date, 'HH:mm', { locale: es })
  }

  if (isTomorrow(date)) {
    return 'Mañana, ' + format(date, 'HH:mm', { locale: es })
  }

  return format(date, 'd MMM, HH:mm', { locale: es })
}

/**
 * Calcula el tiempo restante para un evento (countdown)
 */
export const getTimeRemaining = (timestamp) => {
  if (!timestamp) return null

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  const now = new Date()

  if (isPast(date)) {
    return { expired: true, text: 'Evento pasado' }
  }

  const days = differenceInDays(date, now)
  const hours = differenceInHours(date, now) % 24
  const minutes = differenceInMinutes(date, now) % 60
  const seconds = differenceInSeconds(date, now) % 60

  return {
    expired: false,
    days,
    hours,
    minutes,
    seconds,
    text: days > 0
      ? `${days}d ${hours}h ${minutes}m`
      : hours > 0
        ? `${hours}h ${minutes}m ${seconds}s`
        : `${minutes}m ${seconds}s`
  }
}

/**
 * Formatea tiempo relativo (hace X tiempo)
 */
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return ''

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return formatDistanceToNow(date, { addSuffix: true, locale: es })
}

/**
 * ¿La convocatoria de este evento se publicó por entrenamientos?
 * El criterio lo escribe `publishConvocatoria`, no el formulario de creación.
 */
export const isPriorityMode = (event) => event?.selectionMode === 'entrenamiento'

/**
 * ¿Se puede seguir inscribiendo? Siempre: los cupos son plazas de convocatoria,
 * no un tope de inscritos. Sólo cierra la fecha del evento (ver `canRegister`).
 */
export const isRegistrationOpen = (event) => !!event

/**
 * Plazas del grupo al que pertenece una inscripción publicada.
 */
export const groupCap = (event, registration) =>
  registration?.isGoalkeeper ? GOALKEEPER_SLOTS : (event?.maxSlots || 0)

/**
 * Clasifica las inscripciones de un evento al cerrar la lista.
 * Dos grupos independientes: arqueros (`GOALKEEPER_SLOTS` plazas) y jugadores de
 * campo (`maxSlots` plazas). Dentro de cada grupo ordena según `mode`:
 *  - 'orden': por hora de inscripción.
 *  - 'entrenamiento': más entrenamientos en la ventana; empate por hora de inscripción.
 * Devuelve arqueros primero, cada inscripción con `trainingCount`, `isGoalkeeper`,
 * `selectionRank` (1-based dentro de su grupo) y `selected`.
 */
export const rankRegistrations = (
  registrations = [],
  { mode = 'orden', trainingCounts = {}, maxSlots = 0, positions = {} } = {}
) => {
  const ms = (t) => t?.toDate?.().getTime() ?? new Date(t || 0).getTime()
  const byOrder = (a, b) => ms(a.registeredAt) - ms(b.registeredAt)
  const compare =
    mode === 'entrenamiento'
      ? (a, b) =>
          (trainingCounts[b.userId] || 0) - (trainingCounts[a.userId] || 0) || byOrder(a, b)
      : byOrder

  const isGk = (reg) => positions[reg.userId] === GOALKEEPER_POSITION

  const rank = (list, cap) =>
    [...list].sort(compare).map((reg, i) => ({
      ...reg,
      trainingCount: trainingCounts[reg.userId] || 0,
      isGoalkeeper: isGk(reg),
      selectionRank: i + 1,
      selected: i < cap
    }))

  return [
    ...rank(registrations.filter(isGk), GOALKEEPER_SLOTS),
    ...rank(registrations.filter(reg => !isGk(reg)), maxSlots)
  ]
}

/**
 * Obtiene el estado de un evento según cupos
 */
export const getEventStatus = (event, userRegistration = null) => {
  if (userRegistration) {
    return 'inscrito'
  }

  const eventDate = event.date?.toDate ? event.date.toDate() : new Date(event.date)

  if (isPast(eventDate)) {
    return 'cerrado'
  }

  // La inscripción nunca se cierra por cupos: `maxSlots` son plazas de convocatoria
  // y el profesor decide después. El estado 'lleno' ya no se alcanza.
  return 'abierto'
}

/**
 * Inscritos vs. plazas de convocatoria (campo + arqueros)
 */
export const formatSlots = (event) =>
  `${event.currentSlots || 0}/${(event.maxSlots || 0) + GOALKEEPER_SLOTS}`

/**
 * Valida si el usuario puede inscribirse
 */
export const canRegister = (event, user, userPlan, existingRegistration) => {
  // Usuario no autenticado
  if (!user) {
    return { canRegister: false, reason: 'Debes iniciar sesión' }
  }

  // Ya está inscrito
  if (existingRegistration) {
    return { canRegister: false, reason: 'Ya estás inscrito' }
  }

  // Evento pasado
  const eventDate = event.date?.toDate ? event.date.toDate() : new Date(event.date)
  if (isPast(eventDate)) {
    return { canRegister: false, reason: 'El evento ya pasó' }
  }

  // Sin tope de inscritos: la lista queda abierta hasta la fecha del evento.

  // Sin plan activo (comentado por si se quiere requerir plan)
  // if (!userPlan || !userPlan.active) {
  //   return { canRegister: false, reason: 'No tienes un plan activo' }
  // }

  // Sin sesiones disponibles
  // if (userPlan && userPlan.sessionsUsed >= userPlan.totalSessions) {
  //   return { canRegister: false, reason: 'Has agotado tus sesiones del mes' }
  // }

  return { canRegister: true, reason: null }
}

/**
 * Genera las iniciales de un nombre
 */
export const getInitials = (name) => {
  if (!name) return '?'

  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Trunca un texto a una longitud máxima
 */
export const truncate = (text, maxLength = 100) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Extrae ID de video de YouTube o Vimeo
 */
export const getVideoId = (url) => {
  // YouTube
  const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  const ytMatch = url.match(ytRegex)
  if (ytMatch) {
    return { platform: 'youtube', id: ytMatch[1] }
  }

  // Vimeo
  const vimeoRegex = /(?:vimeo\.com\/)(\d+)/
  const vimeoMatch = url.match(vimeoRegex)
  if (vimeoMatch) {
    return { platform: 'vimeo', id: vimeoMatch[1] }
  }

  return null
}

/**
 * Genera URL de embed para videos
 */
export const getEmbedUrl = (url) => {
  const videoInfo = getVideoId(url)
  if (!videoInfo) return null

  if (videoInfo.platform === 'youtube') {
    return `https://www.youtube.com/embed/${videoInfo.id}`
  }

  if (videoInfo.platform === 'vimeo') {
    return `https://player.vimeo.com/video/${videoInfo.id}`
  }

  return null
}

/**
 * Valida email
 */
export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

/**
 * Normaliza un teléfono a formato E.164 (+56912345678). Devuelve null si no es válido.
 * ponytail: prefijo país fijo +56, sin libphonenumber-js. Cambiar si la academia
 * se abre a otros países.
 */
export const normalizePhone = (input) => {
  const raw = String(input || '').trim()
  const digits = raw.replace(/\D/g, '')
  if (!digits) return null

  const e164 = raw.startsWith('+') ? `+${digits}` : `+56${digits.replace(/^56/, '')}`
  return /^\+[1-9]\d{7,14}$/.test(e164) ? e164 : null
}

/**
 * Correo interno derivado del número, usado como credencial de Firebase.
 * El jugador nunca lo ve.
 */
export const phoneToAuthEmail = (e164) => `${e164.slice(1)}@detitular.app`

/**
 * Formatea un E.164 chileno para mostrar: +56912345678 → +56 9 1234 5678
 */
export const formatPhone = (e164) => {
  const match = /^\+56(\d)(\d{4})(\d{4})$/.exec(e164 || '')
  return match ? `+56 ${match[1]} ${match[2]} ${match[3]}` : e164 || ''
}

/**
 * Dato de contacto visible de un usuario. Prefiere el teléfono sobre el
 * correo sintético de las cuentas creadas por número.
 */
export const userContact = (u) => formatPhone(u?.telefono) || u?.email || ''

/**
 * Genera color único basado en un string (para avatars)
 */
export const stringToColor = (str) => {
  if (!str) return '#6366f1'

  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }

  const hue = Math.abs(hash % 360)
  return `hsl(${hue}, 65%, 45%)`
}

/**
 * Formatea número con separador de miles
 */
export const formatNumber = (num) => {
  return new Intl.NumberFormat('es-ES').format(num)
}

/**
 * Descarga una imagen desde una URL
 */
export const downloadImage = async (url, filename = 'imagen.jpg') => {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const downloadUrl = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(downloadUrl)
  } catch (error) {
    console.error('Error al descargar imagen:', error)
    throw error
  }
}

/**
 * Detecta si el dispositivo es móvil
 */
export const isMobile = () => {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
}

/**
 * Detecta si la app está instalada como PWA
 */
export const isPWA = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
}

/**
 * Verifica si está online
 */
export const isOnline = () => {
  return navigator.onLine
}
