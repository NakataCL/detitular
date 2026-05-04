// Hooks de TanStack Query para la galería de álbumes
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAlbums,
  getAlbumById,
  getAlbumExperiences,
  getUnclassifiedExperiences,
  createAlbum,
  updateAlbum,
  deleteAlbum,
  setAlbumCover,
  moveExperiencesToAlbum
} from '../firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { UNCLASSIFIED_ALBUM_ID } from '../utils/constants'

const FIVE_MIN = 1000 * 60 * 5

const isRealAlbumId = (id) =>
  typeof id === 'string' && id.length > 0 && id !== UNCLASSIFIED_ALBUM_ID

/**
 * Lista de álbumes filtrable por categoría / año / eventId.
 */
export const useAlbums = ({ category = null, year = null, eventId = null } = {}) => {
  return useQuery({
    queryKey: ['albums', { category: category || 'all', year: year || null, eventId: eventId || null }],
    queryFn: () => getAlbums({ category, year, eventId }),
    staleTime: FIVE_MIN
  })
}

/**
 * Detalle de un álbum. No se ejecuta para el centinela __unclassified__.
 */
export const useAlbum = (albumId) => {
  return useQuery({
    queryKey: ['album', albumId],
    queryFn: () => getAlbumById(albumId),
    enabled: isRealAlbumId(albumId),
    staleTime: FIVE_MIN
  })
}

/**
 * Lista de experiencias dentro de un álbum, ordenadas por createdAt desc.
 */
export const useAlbumExperiences = (albumId) => {
  return useQuery({
    queryKey: ['album', albumId, 'experiences'],
    queryFn: () => getAlbumExperiences(albumId),
    enabled: isRealAlbumId(albumId),
    staleTime: FIVE_MIN
  })
}

/**
 * Experiencias sin álbum (albumId == null). Solo se ejecuta para admins.
 */
export const useUnclassifiedExperiences = () => {
  const { isAdmin } = useAuth()
  return useQuery({
    queryKey: ['unclassified-experiences'],
    queryFn: () => getUnclassifiedExperiences(),
    enabled: isAdmin === true,
    staleTime: FIVE_MIN
  })
}

export const useCreateAlbum = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: (albumData) => createAlbum(albumData, user.uid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] })
    }
  })
}

export const useUpdateAlbum = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ albumId, updates }) => updateAlbum(albumId, updates),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['albums'] })
      queryClient.invalidateQueries({ queryKey: ['album', variables.albumId] })
    }
  })
}

export const useDeleteAlbum = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (albumId) => deleteAlbum(albumId),
    onSuccess: (_data, albumId) => {
      queryClient.invalidateQueries({ queryKey: ['albums'] })
      queryClient.removeQueries({ queryKey: ['album', albumId] })
    }
  })
}

export const useSetAlbumCover = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ albumId, experienceId }) => setAlbumCover(albumId, experienceId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['albums'] })
      queryClient.invalidateQueries({ queryKey: ['album', variables.albumId] })
    }
  })
}

export const useMoveExperiencesToAlbum = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ experienceIds, targetAlbumId }) =>
      moveExperiencesToAlbum(experienceIds, targetAlbumId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['albums'] })
      queryClient.invalidateQueries({ queryKey: ['unclassified-experiences'] })
      if (variables.targetAlbumId) {
        queryClient.invalidateQueries({ queryKey: ['album', variables.targetAlbumId] })
        queryClient.invalidateQueries({ queryKey: ['album', variables.targetAlbumId, 'experiences'] })
      }
    }
  })
}

export default useAlbums
