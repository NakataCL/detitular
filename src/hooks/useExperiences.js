// Hook para gestión de experiencias/galería
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import {
  getExperiences,
  getExperiencesPaginated,
  createExperience,
  deleteExperience
} from '../firebase/firestore'
import { uploadExperienceImage, deleteFile } from '../services/cloudinary'
import { useAuth } from '../context/AuthContext'

/**
 * Hook para obtener todas las experiencias con filtro de categoría
 */
export const useExperiences = (category = null) => {
  return useQuery({
    queryKey: ['experiences', category || 'all'],
    queryFn: () => getExperiences(category),
    staleTime: 1000 * 60 * 5
  })
}

/**
 * Hook para obtener experiencias con paginación infinita
 */
export const useInfiniteExperiences = (category = null, pageSize = 12) => {
  return useInfiniteQuery({
    queryKey: ['experiences', 'infinite', category || 'all'],
    queryFn: ({ pageParam }) => getExperiencesPaginated(pageSize, pageParam, category),
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.lastDoc : undefined,
    initialPageParam: null,
    staleTime: 1000 * 60 * 5
  })
}

/**
 * Hook para crear una experiencia con imagen
 */
export const useCreateExperience = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ experienceData, imageFile, onProgress }) => {
      let imageUrl = experienceData.mediaUrl || null

      // Si hay archivo de imagen, subirlo primero
      if (imageFile) {
        imageUrl = await uploadExperienceImage(
          imageFile,
          experienceData.category,
          onProgress
        )
      }

      // Crear la experiencia en Firestore
      return createExperience(
        {
          ...experienceData,
          mediaUrl: imageUrl,
          mediaType: imageFile ? 'image' : experienceData.mediaType || 'video'
        },
        user.uid
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] })
    }
  })
}

/**
 * Hook para eliminar una experiencia
 */
export const useDeleteExperience = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (experience) => {
      // Si la experiencia tiene una imagen en Storage, eliminarla
      if (experience.mediaUrl && experience.mediaType === 'image') {
        try {
          await deleteFile(experience.mediaUrl)
        } catch {
          // Ignorar error si el archivo no existe
        }
      }

      // Eliminar documento de Firestore
      await deleteExperience(experience.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] })
    }
  })
}

/**
 * Hook para subir múltiples imágenes a la galería
 */
export const useBulkUploadExperiences = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ files, category, onProgress }) => {
      const results = []
      let completed = 0

      for (const file of files) {
        try {
          // Subir imagen
          const imageUrl = await uploadExperienceImage(file, category)

          // Crear experiencia
          const experience = await createExperience(
            {
              title: file.name.replace(/\.[^/.]+$/, ''), // Nombre sin extensión
              description: '',
              category,
              mediaUrl: imageUrl,
              mediaType: 'image'
            },
            user.uid
          )

          results.push({ success: true, experience })
        } catch (error) {
          results.push({ success: false, error: error.message, fileName: file.name })
        }

        completed++
        if (onProgress) {
          onProgress((completed / files.length) * 100)
        }
      }

      return results
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] })
    }
  })
}

/**
 * Hook para obtener experiencias por categoría con conteo
 */
export const useExperiencesByCategory = () => {
  const { data: allExperiences, isLoading } = useExperiences()

  if (isLoading || !allExperiences) {
    return { categoryCounts: {}, loading: true }
  }

  const categoryCounts = allExperiences.reduce((acc, exp) => {
    const cat = exp.category || 'otros'
    acc[cat] = (acc[cat] || 0) + 1
    return acc
  }, {})

  return { categoryCounts, loading: false }
}

export default useExperiences
