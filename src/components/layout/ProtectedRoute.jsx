// Componente para proteger rutas según autenticación y roles
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Spinner } from '../ui'

const ProtectedRoute = ({
  children,
  requireAuth = true,
  requireAdmin = false,
  redirectTo = '/login'
}) => {
  const { isAuthenticated, isAdmin, loading } = useAuth()
  const location = useLocation()

  // Mostrar spinner mientras carga
  if (loading) {
    return <Spinner fullScreen />
  }

  // Si requiere autenticación y no está autenticado
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  // Si requiere admin y no es admin
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute
