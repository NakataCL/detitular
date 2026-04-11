// Hook para estadísticas del dashboard
import { useQuery } from '@tanstack/react-query'
import { getStats } from '../firebase/firestore'

/**
 * Hook para obtener estadísticas generales
 */
export const useStats = (options = {}) => {
  return useQuery({
    queryKey: ['stats', 'dashboard'],
    queryFn: getStats,
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchInterval: 1000 * 60 * 5, // Refrescar cada 5 minutos
    ...options
  })
}

export default useStats
