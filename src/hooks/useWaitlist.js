// Hook para la lista de espera de eventos llenos
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  addToWaitlist,
  removeFromWaitlist,
  getMyWaitlistEntries,
  getEventWaitlist
} from '../firebase/firestore'
import { useAuth } from '../context/AuthContext'

const FIVE_MIN = 1000 * 60 * 5

/**
 * Entradas en lista de espera del usuario actual.
 */
export const useMyWaitlist = () => {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['waitlist', 'mine', user?.uid],
    queryFn: () => getMyWaitlistEntries(user.uid),
    enabled: !!user?.uid,
    staleTime: FIVE_MIN
  })
}

/**
 * Lista de espera de un evento (admin).
 */
export const useEventWaitlist = (eventId) => {
  return useQuery({
    queryKey: ['waitlist', 'event', eventId],
    queryFn: () => getEventWaitlist(eventId),
    enabled: !!eventId,
    staleTime: FIVE_MIN
  })
}

/**
 * Posición del usuario actual en la lista de espera de un evento.
 * Devuelve { entry, position } o null.
 */
export const useMyWaitlistPosition = (eventId) => {
  const { user } = useAuth()
  const { data: list, isLoading } = useEventWaitlist(eventId)

  if (isLoading || !list || !user?.uid) {
    return { entry: null, position: null, isLoading }
  }

  const idx = list.findIndex(e => e.userId === user.uid)
  if (idx === -1) return { entry: null, position: null, isLoading: false }

  return { entry: list[idx], position: idx + 1, isLoading: false }
}

/**
 * Apuntar al usuario actual a la lista de espera.
 */
export const useJoinWaitlist = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: (eventId) => addToWaitlist(eventId, user.uid),
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: ['waitlist', 'mine', user?.uid] })
      queryClient.invalidateQueries({ queryKey: ['waitlist', 'event', eventId] })
    }
  })
}

/**
 * Sacarse de la lista de espera.
 */
export const useLeaveWaitlist = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: ({ entryId }) => removeFromWaitlist(entryId),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['waitlist', 'mine', user?.uid] })
      if (eventId) {
        queryClient.invalidateQueries({ queryKey: ['waitlist', 'event', eventId] })
      }
    }
  })
}
