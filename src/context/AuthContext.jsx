// Contexto de autenticación para toda la aplicación
import { createContext, useContext, useState, useEffect } from 'react'
import {
  signInWithGoogle,
  signInWithPhone,
  signOut,
  onAuthChange,
  getCurrentUserData
} from '../firebase/auth'

// Crear el contexto
const AuthContext = createContext(null)

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider')
  }
  return context
}

// Proveedor del contexto
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Efecto para manejar el estado de autenticación
  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser)
          // Obtener datos adicionales del usuario desde Firestore
          const data = await getCurrentUserData(firebaseUser.uid, firebaseUser.email)
          setUserData(data)
        } else {
          setUser(null)
          setUserData(null)
        }
      } catch (err) {
        console.error('Error al obtener datos del usuario:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  // Login con Google — SÓLO administración, expuesto únicamente en /login.
  // Nombre explícito a propósito: un `login()` genérico invita a llamarlo desde
  // cualquier pantalla y abrir el popup de Google a jugadores.
  const loginWithGoogle = async () => {
    setError(null)
    try {
      return await signInWithGoogle()
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  // Login de jugadores: sólo el número de teléfono
  const loginWithPhone = async (phone) => {
    setError(null)
    try {
      const result = await signInWithPhone(phone)
      // No esperar al listener de onAuthChange: si llega tarde, ProtectedRoute
      // vería la sesión como anónima y rebotaría el onboarding a /login.
      setUser(result.user)
      setUserData(await getCurrentUserData(result.user.uid, result.user.email))
      return result
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  // Función de logout
  const logout = async () => {
    setError(null)
    try {
      await signOut()
      setUser(null)
      setUserData(null)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  // Actualizar datos del usuario en el contexto
  const refreshUserData = async () => {
    if (user) {
      const data = await getCurrentUserData(user.uid, user.email)
      setUserData(data)
    }
  }

  // Verificar roles - chequear tanto Firestore como el email configurado en .env
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL
  const isAdmin = userData?.role === 'admin' || (!!adminEmail && user?.email === adminEmail)
  const isPlayer = userData?.role === 'jugador'
  const isAuthenticated = !!user
  // Cuenta creada por teléfono a la que todavía le falta el nombre.
  // userData === null significa "cargando", no "sin nombre".
  const needsOnboarding = !!user && !!userData && !userData.nombre

  const value = {
    user,
    userData,
    loading,
    error,
    loginWithGoogle,
    loginWithPhone,
    logout,
    refreshUserData,
    isAdmin,
    isPlayer,
    isAuthenticated,
    needsOnboarding
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
