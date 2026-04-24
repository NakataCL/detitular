// Hook para gestión de eventos
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useEffect, useState } from 'react'
import {
  getAllActiveEvents,
  getPublicActiveEvents,
  getMyAccessibleActiveEvents,
  getAllEvents,
  getEvent,
  getEventsByMonthPublic,
  getEventsByMonthForUser,
  getEventsByMonthAdmin,
  getNextPublicEvent,
  getNextEventForUser,
  getNextEventAdmin,
  createEvent,
  updateEvent,
  deleteEvent,
  subscribeToPublicActiveEvents,
  subscribeToUserActiveEvents,
  subscribeToEvent
} from '../firebase/firestore'
import { useAuth } from '../context/AuthContext'

const FIVE_MIN = 1000 * 60 * 5
const TWO_MIN = 1000 * 60 * 2
const THIRTY_MIN = 1000 * 60 * 30

/**
 * Hook principal de eventos activos: ramifica por rol.
 * - admin → todos los activos (con privados)
 * - usuario autenticado → públicos + privados en los que está invitado (merge/dedup)
 * - anónimo → sólo públicos
 */
export const useVisibleActiveEvents = () => {
  const { user, isAdmin } = useAuth()
  const uid = user?.uid

  const adminQ = useQuery({
    queryKey: ['events', 'admin-active'],
    queryFn: getAllActiveEvents,
    enabled: !!isAdmin,
    staleTime: FIVE_MIN,
    gcTime: THIRTY_MIN
  })

  const publicQ = useQuery({
    queryKey: ['events', 'public-active'],
    queryFn: getPublicActiveEvents,
    enabled: !isAdmin,
    staleTime: FIVE_MIN,
    gcTime: THIRTY_MIN
  })

  const accessibleQ = useQuery({
    queryKey: ['events', 'accessible-active', uid],
    queryFn: () => getMyAccessibleActiveEvents(uid),
    enabled: !!uid && !isAdmin,
    staleTime: FIVE_MIN,
    gcTime: THIRTY_MIN
  })

  return useMemo(() => {
    if (isAdmin) {
      return {
        data: adminQ.data || [],
        isLoading: adminQ.isLoading,
        error: adminQ.error
      }
    }

    const byId = new Map()
    ;[...(publicQ.data || []), ...(accessibleQ.data || [])].forEach(e => byId.set(e.id, e))
    const merged = [...byId.values()].sort((a, b) => {
      const aDate = a.date?.toDate?.() || new Date(a.date)
      const bDate = b.date?.toDate?.() || new Date(b.date)
      return aDate - bDate
    })

    return {
      data: merged,
      isLoading: publicQ.isLoading || (!!uid && accessibleQ.isLoading),
      error: publicQ.error || accessibleQ.error
    }
  }, [isAdmin, uid, adminQ.data, adminQ.isLoading, adminQ.error,
      publicQ.data, publicQ.isLoading, publicQ.error,
      accessibleQ.data, accessibleQ.isLoading, accessibleQ.error])
}

/**
 * Alias de compatibilidad — delega en useVisibleActiveEvents.
 */
export const useActiveEvents = useVisibleActiveEvents

/**
 * Hook para obtener todos los eventos (admin).
 */
export const useAllEvents = () => {
  return useQuery({
    queryKey: ['events', 'all'],
    queryFn: getAllEvents,
    staleTime: TWO_MIN
  })
}

/**
 * Hook para obtener un evento específico. Mapea permission-denied a null
 * para que el branch de "Evento no encontrado" cubra también eventos privados
 * a los que el usuario no tiene acceso.
 */
export const useEvent = (eventId) => {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      try {
        return await getEvent(eventId)
      } catch (err) {
        if (err?.code === 'permission-denied') return null
        throw err
      }
    },
    enabled: !!eventId,
    staleTime: TWO_MIN
  })
}

/**
 * Hook para obtener eventos por mes — auth-aware.
 */
export const useEventsByMonth = (year, month) => {
  const { user, isAdmin } = useAuth()
  const uid = user?.uid

  const adminQ = useQuery({
    queryKey: ['events', 'month-admin', year, month],
    queryFn: () => getEventsByMonthAdmin(year, month),
    enabled: year !== undefined && month !== undefined && !!isAdmin,
    staleTime: FIVE_MIN
  })

  const publicQ = useQuery({
    queryKey: ['events', 'month-public', year, month],
    queryFn: () => getEventsByMonthPublic(year, month),
    enabled: year !== undefined && month !== undefined && !isAdmin,
    staleTime: FIVE_MIN
  })

  const accessibleQ = useQuery({
    queryKey: ['events', 'month-accessible', year, month, uid],
    queryFn: () => getEventsByMonthForUser(year, month, uid),
    enabled: year !== undefined && month !== undefined && !!uid && !isAdmin,
    staleTime: FIVE_MIN
  })

  return useMemo(() => {
    if (isAdmin) {
      return {
        data: adminQ.data || [],
        isLoading: adminQ.isLoading,
        error: adminQ.error
      }
    }

    const byId = new Map()
    ;[...(publicQ.data || []), ...(accessibleQ.data || [])].forEach(e => byId.set(e.id, e))
    const merged = [...byId.values()].sort((a, b) => {
      const aDate = a.date?.toDate?.() || new Date(a.date)
      const bDate = b.date?.toDate?.() || new Date(b.date)
      return aDate - bDate
    })

    return {
      data: merged,
      isLoading: publicQ.isLoading || (!!uid && accessibleQ.isLoading),
      error: publicQ.error || accessibleQ.error
    }
  }, [isAdmin, uid, year, month, adminQ.data, adminQ.isLoading, adminQ.error,
      publicQ.data, publicQ.isLoading, publicQ.error,
      accessibleQ.data, accessibleQ.isLoading, accessibleQ.error])
}

/**
 * Próximo evento — auth-aware.
 */
export const useNextEvent = () => {
  const { user, isAdmin } = useAuth()
  const uid = user?.uid

  return useQuery({
    queryKey: ['events', 'next', isAdmin ? 'admin' : (uid || 'anon')],
    queryFn: () => {
      if (isAdmin) return getNextEventAdmin()
      if (uid) return getNextEventForUser(uid)
      return getNextPublicEvent()
    },
    staleTime: TWO_MIN
  })
}

/**
 * Hook para crear evento
 */
export const useCreateEvent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ eventData, userId }) => createEvent(eventData, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
    }
  })
}

/**
 * Hook para actualizar evento
 */
export const useUpdateEvent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ eventId, data }) => updateEvent(eventId, data),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
    }
  })
}

/**
 * Hook para eliminar evento
 */
export const useDeleteEvent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
    }
  })
}

/**
 * Hook para suscripción en tiempo real a eventos activos — auth-aware.
 */
export const useEventsRealtime = () => {
  const { user, isAdmin } = useAuth()
  const uid = user?.uid
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)

    // Admin usa la misma lógica de user-scoped (que para admin incluye sus propios registros).
    // Para ver TODO en tiempo real, la admin page usa useAllEvents (no real-time).
    const unsubscribe = isAdmin
      ? subscribeToPublicActiveEvents((data) => { setEvents(data); setLoading(false) })
      : subscribeToUserActiveEvents(uid, (data) => { setEvents(data); setLoading(false) })

    return () => unsubscribe()
  }, [uid, isAdmin])

  return { events, loading, error }
}

/**
 * Hook para suscripción en tiempo real a un evento específico
 */
export const useEventRealtime = (eventId) => {
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!eventId) {
      setLoading(false)
      return
    }

    setLoading(true)

    const unsubscribe = subscribeToEvent(eventId, (data) => {
      setEvent(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [eventId])

  return { event, loading, error }
}

export default useActiveEvents
