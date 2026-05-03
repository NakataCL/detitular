// Hook para gestión de inscripciones
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createRegistration,
  getUserRegistrations,
  getEventRegistrations,
  getUserEventRegistration,
  cancelRegistration,
  markAttendance,
  adminAddUserToEvent,
  adminRemoveUserFromEvent,
  subscribeToUserRegistrations,
  getEvent
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
 * Hook para crear inscripción (auto-inscripción del usuario actual, sólo eventos públicos)
 */
export const useCreateRegistration = () => {
  const queryClient = useQueryClient()
  const { user, userData } = useAuth()

  return useMutation({
    mutationFn: (eventId) =>
      createRegistration(user.uid, eventId, userData, { registeredBy: 'self' }),
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] })
      queryClient.invalidateQueries({ queryKey: ['registration', user?.uid, eventId] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
    }
  })
}

/**
 * Hook para cancelar inscripción. Acepta `userId` para mantener sincronía del array en el evento.
 */
export const useCancelRegistration = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: ({ registrationId, eventId, userId }) =>
      cancelRegistration(registrationId, eventId, userId || user?.uid),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] })
      queryClient.invalidateQueries({ queryKey: ['registration', user?.uid, eventId] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
    }
  })
}

/**
 * Hook admin: inscribir a otro usuario en un evento (público o privado).
 */
export const useAdminAddUserToEvent = () => {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuth()

  return useMutation({
    mutationFn: ({ eventId, user }) => adminAddUserToEvent(eventId, user, currentUser?.uid),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] })
      queryClient.invalidateQueries({ queryKey: ['registrations', 'event', eventId] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
    }
  })
}

/**
 * Hook admin: remover a un usuario de un evento.
 */
export const useAdminRemoveUserFromEvent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ registrationId, eventId, userId }) =>
      adminRemoveUserFromEvent(registrationId, eventId, userId),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] })
      queryClient.invalidateQueries({ queryKey: ['registrations', 'event', eventId] })
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
 * Hook para obtener inscripciones del usuario con datos de evento hidratados
 * (un fetch por evento, comparte cache con useEvent).
 */
export const useMyRegistrationsHydrated = () => {
  const { data: regs, isLoading: loadingRegs } = useMyRegistrations()

  const eventQueries = useQueries({
    queries: (regs || []).map(reg => ({
      queryKey: ['event', reg.eventId],
      queryFn: async () => {
        try {
          return await getEvent(reg.eventId)
        } catch (err) {
          if (err?.code === 'permission-denied') return null
          throw err
        }
      },
      enabled: !!reg.eventId,
      staleTime: 1000 * 60 * 2
    }))
  })

  const data = (regs || []).map((reg, i) => ({
    ...reg,
    event: eventQueries[i]?.data || null
  }))

  const isLoading =
    loadingRegs || (regs && regs.length > 0 && eventQueries.some(q => q.isLoading))

  return { data, isLoading }
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
