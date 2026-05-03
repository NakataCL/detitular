// Funciones de utilidad
import { format, formatDistanceToNow, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds, isToday, isTomorrow, isPast, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

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

  if (event.currentSlots >= event.maxSlots) {
    return 'lleno'
  }

  return 'abierto'
}

/**
 * Calcula cupos disponibles
 */
export const getAvailableSlots = (event) => {
  return Math.max(0, event.maxSlots - (event.currentSlots || 0))
}

/**
 * Formatea cupos como string
 */
export const formatSlots = (event) => {
  return `${event.currentSlots || 0}/${event.maxSlots}`
}

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

  // Cupos llenos
  if (event.currentSlots >= event.maxSlots) {
    return { canRegister: false, reason: 'No hay cupos disponibles' }
  }

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
 * Comparte un evento usando Web Share API
 */
export const shareEvent = async (event) => {
  const eventDate = formatDateTime(event.date)

  const shareData = {
    title: event.title,
    text: `${event.title}\n📅 ${eventDate}\n📍 ${event.location || 'Por confirmar'}`,
    url: window.location.href
  }

  if (navigator.share) {
    try {
      await navigator.share(shareData)
      return true
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error al compartir:', err)
      }
      return false
    }
  } else {
    // Fallback: copiar al portapapeles
    const text = `${shareData.title}\n${shareData.text}\n${shareData.url}`
    await navigator.clipboard.writeText(text)
    return true
  }
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
 * Valida teléfono
 */
export const isValidPhone = (phone) => {
  const regex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/
  return phone.length >= 8 && regex.test(phone)
}

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
