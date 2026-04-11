// Hook para gestión de perfil de jugador
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getUser,
  updateUser,
  updateUserPlan,
  getAllUsers,
  getPlayerStats
} from '../firebase/firestore'
import { uploadProfileImage } from '../firebase/storage'
import { useAuth } from '../context/AuthContext'

/**
 * Hook para obtener datos del jugador actual
 */
export const usePlayer = () => {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['player', user?.uid],
    queryFn: () => getUser(user.uid),
    enabled: !!user?.uid,
    staleTime: 1000 * 60 * 5
  })
}

/**
 * Hook para obtener datos de un usuario específico (admin)
 */
export const useUserById = (userId) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUser(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5
  })
}

/**
 * Hook para obtener todos los usuarios (admin)
 */
export const useAllUsers = () => {
  return useQuery({
    queryKey: ['users', 'all'],
    queryFn: getAllUsers,
    staleTime: 1000 * 60 * 5
  })
}

/**
 * Hook para actualizar perfil del jugador
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient()
  const { user, refreshUserData } = useAuth()

  return useMutation({
    mutationFn: (data) => updateUser(user.uid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player', user?.uid] })
      refreshUserData()
    }
  })
}

/**
 * Hook para subir foto de perfil
 */
export const useUploadProfilePhoto = () => {
  const queryClient = useQueryClient()
  const { user, refreshUserData } = useAuth()

  return useMutation({
    mutationFn: async (file) => {
      const photoURL = await uploadProfileImage(user.uid, file)
      await updateUser(user.uid, { photoURL })
      return photoURL
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player', user?.uid] })
      refreshUserData()
    }
  })
}

/**
 * Hook para actualizar plan del usuario (admin)
 */
export const useUpdateUserPlan = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, planData }) => updateUserPlan(userId, planData),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] })
      queryClient.invalidateQueries({ queryKey: ['player', userId] })
      queryClient.invalidateQueries({ queryKey: ['users', 'all'] })
    }
  })
}

/**
 * Hook para actualizar rol del usuario (admin)
 */
export const useUpdateUserRole = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, role }) => updateUser(userId, { role }),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] })
      queryClient.invalidateQueries({ queryKey: ['users', 'all'] })
    }
  })
}

/**
 * Hook para obtener estadísticas del jugador
 */
export const usePlayerStats = (userId = null) => {
  const { user } = useAuth()
  const targetUserId = userId || user?.uid

  return useQuery({
    queryKey: ['playerStats', targetUserId],
    queryFn: () => getPlayerStats(targetUserId),
    enabled: !!targetUserId,
    staleTime: 1000 * 60 * 5
  })
}

/**
 * Hook para verificar si el plan del usuario está activo
 */
export const usePlanStatus = () => {
  const { data: player, isLoading } = usePlayer()

  if (isLoading || !player) {
    return { loading: true, hasPlan: false, planDetails: null }
  }

  const plan = player.plan

  if (!plan || !plan.active) {
    return {
      loading: false,
      hasPlan: false,
      planDetails: null
    }
  }

  // Verificar si el plan ha expirado
  const now = new Date()
  const expiresAt = plan.expiresAt?.toDate ? plan.expiresAt.toDate() : new Date(plan.expiresAt)
  const isExpired = now > expiresAt

  // Verificar sesiones disponibles
  const sessionsRemaining = plan.totalSessions - (plan.sessionsUsed || 0)
  const hasSessionsLeft = sessionsRemaining > 0

  // Notificación de pocas sesiones
  const lowSessions = sessionsRemaining <= 2 && sessionsRemaining > 0

  return {
    loading: false,
    hasPlan: plan.active && !isExpired && hasSessionsLeft,
    planDetails: {
      ...plan,
      isExpired,
      sessionsRemaining,
      lowSessions
    }
  }
}

/**
 * Hook para buscar usuarios por nombre o email
 */
export const useSearchUsers = (searchTerm) => {
  const { data: allUsers } = useAllUsers()

  if (!searchTerm || !allUsers) {
    return { users: allUsers || [], loading: false }
  }

  const term = searchTerm.toLowerCase()
  const filteredUsers = allUsers.filter(user =>
    user.nombre?.toLowerCase().includes(term) ||
    user.displayName?.toLowerCase().includes(term) ||
    user.email?.toLowerCase().includes(term)
  )

  return { users: filteredUsers, loading: false }
}

export default usePlayer
