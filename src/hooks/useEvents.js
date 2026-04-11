// Hook para gestión de eventos
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getActiveEvents,
  getAllEvents,
  getEvent,
  getEventsByMonth,
  getNextEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  subscribeToActiveEvents,
  subscribeToEvent
} from '../firebase/firestore'
import { useEffect, useState } from 'react'

/**
 * Hook para obtener eventos activos
 */
export const useActiveEvents = () => {
  return useQuery({
    queryKey: ['events', 'active'],
    queryFn: getActiveEvents,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30 // 30 minutos (antes cacheTime)
  })
}

/**
 * Hook para obtener todos los eventos (admin)
 */
export const useAllEvents = () => {
  return useQuery({
    queryKey: ['events', 'all'],
    queryFn: getAllEvents,
    staleTime: 1000 * 60 * 2
  })
}

/**
 * Hook para obtener un evento específico
 */
export const useEvent = (eventId) => {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: () => getEvent(eventId),
    enabled: !!eventId,
    staleTime: 1000 * 60 * 2
  })
}

/**
 * Hook para obtener eventos por mes
 */
export const useEventsByMonth = (year, month) => {
  return useQuery({
    queryKey: ['events', 'month', year, month],
    queryFn: () => getEventsByMonth(year, month),
    enabled: year !== undefined && month !== undefined,
    staleTime: 1000 * 60 * 5
  })
}

/**
 * Hook para obtener el próximo evento
 */
export const useNextEvent = () => {
  return useQuery({
    queryKey: ['events', 'next'],
    queryFn: getNextEvent,
    staleTime: 1000 * 60 * 2
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
      // Invalidar queries relacionadas
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
 * Hook para suscripción en tiempo real a eventos activos
 */
export const useEventsRealtime = () => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)

    const unsubscribe = subscribeToActiveEvents((data) => {
      setEvents(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

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
