// Única puerta de entrada a la sesión: siempre /login (teléfono).
// El popup de Google vive sólo dentro de /login, detrás de "Soy administrador".
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Devuelve un guard: `true` si ya hay sesión; si no, manda a /login
 * recordando de dónde venía el usuario y devuelve `false`.
 *
 * Uso: `if (!requireAuth()) return`
 */
export const useRequireAuth = () => {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  return () => {
    if (isAuthenticated) return true
    navigate('/login', { state: { from: location } })
    return false
  }
}

export default useRequireAuth
