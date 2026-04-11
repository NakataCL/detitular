// Hook para gestión de inscripciones
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createRegistration,
  getUserRegistrations,
  getEventRegistrations,
  getUserEventRegistration,
  cancelRegistration,
  markAttendance,
  subscribeToUserRegistrations
} from '../firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { useEffect, useState } from 'react'

/**
 * Hook para obtener inscripciones del usuario actual
 */
export const useMyRegistrations = () => {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['registrations', 'user', user?.uid],
    queryFn: () => getUserRegistrations(user.uid),
    enabled: !!user?.uid,
    staleTime: 1000 * 60 * 2
  })
}

/**
 * Hook para obtener inscripciones de un evento (admin)
 */
export const useEventRegistrations = (eventId) => {
  return useQuery({
    queryKey: ['registrations', 'event', eventId],
    queryFn: () => getEventRegistrations(eventId),
    enabled: !!eventId,
    staleTime: 1000 * 60 * 1
  })
}

/**
 * Hook para verificar si el usuario está inscrito en un evento
 */
export const useUserEventRegistration = (eventId) => {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['registration', user?.uid, eventId],
    queryFn: () => getUserEventRegistration(user.uid, eventId),
    enabled: !!user?.uid && !!eventId,
    staleTime: 1000 * 60 * 1
  })
}

/**
 * Hook para crear inscripción
 */
export const useCreateRegistration = () => {
  const queryClient = useQueryClient()
  const { user, userData } = useAuth()

  return useMutation({
    mutationFn: (eventId) => createRegistration(user.uid, eventId, userData),
    onSuccess: (_, eventId) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['registrations'] })
      queryClient.invalidateQueries({ queryKey: ['registration', user?.uid, eventId] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
    }
  })
}

/**
 * Hook para cancelar inscripción
 */
export const useCancelRegistration = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: ({ registrationId, eventId }) => cancelRegistration(registrationId, eventId),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] })
      queryClient.invalidateQueries({ queryKey: ['registration', user?.uid, eventId] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
    }
  })
}

/**
 * Hook para marcar asistencia (admin)
 */
export const useMarkAttendance = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ registrationId, attended }) => markAttendance(registrationId, attended),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['registrations', 'event', eventId] })
    }
  })
}

/**
 * Hook para suscripción en tiempo real a inscripciones del usuario
 */
export const useMyRegistrationsRealtime = () => {
  const { user } = useAuth()
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false)
      setRegistrations([])
      return
    }

    setLoading(true)

    const unsubscribe = subscribeToUserRegistrations(user.uid, (data) => {
      setRegistrations(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user?.uid])

  return { registrations, loading }
}

/**
 * Hook para obtener todas las inscripciones con datos de evento
 */
export const useMyRegistrationsWithEvents = () => {
  const { data: registrations, isLoading: loadingRegistrations } = useMyRegistrations()
  const queryClient = useQueryClient()

  // Obtener datos de eventos para cada inscripción
  const registrationsWithEvents = registrations?.map(reg => {
    const eventData = queryClient.getQueryData(['event', reg.eventId])
    return {
      ...reg,
      event: eventData || null
    }
  })

  return {
    registrations: registrationsWithEvents || [],
    loading: loadingRegistrations
  }
}

export default useMyRegistrations
