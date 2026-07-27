// Página de Login
import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { Button, Card, Input, Skeleton } from '../components/ui'
import { APP_NAME } from '../utils/constants'
import { normalizePhone } from '../utils/helpers'
import toast from 'react-hot-toast'

// Los códigos de configuración se muestran tal cual: son errores del proyecto,
// no del jugador, y esconderlos detrás de "inténtalo de nuevo" hace que se
// diagnostiquen a ciegas.
const loginErrorMessage = (error) => {
  switch (error?.code) {
    case 'auth/operation-not-allowed':
    case 'auth/admin-restricted-operation':
      return 'Falta habilitar el acceso por correo/contraseña en Firebase (Authentication → Sign-in method).'
    case 'auth/network-request-failed':
      return 'Sin conexión. Revisa tu internet e inténtalo de nuevo.'
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Espera un momento antes de reintentar.'
    case 'auth/invalid-email':
      return 'Ese número no es válido. Escríbelo como +56 9 1234 5678.'
    case 'permission-denied':
      return 'Tu cuenta se creó pero no pudimos guardar tu perfil. Vuelve a intentarlo.'
    default:
      return `No pudimos entrar con ese número${error?.code ? ` (${error.code})` : ''}.`
  }
}

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, loading, loginWithGoogle, loginWithPhone } = useAuth()

  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)

  useEffect(() => {
    // No redirigir mientras se procesa el login: handlePhoneLogin decide el
    // destino (onboarding o página original) según si la cuenta es nueva.
    if (isAuthenticated && !submitting) {
      const from = location.state?.from?.pathname || '/'
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, submitting, navigate, location])

  const handlePhoneLogin = async (e) => {
    e.preventDefault()
    if (submitting) return

    if (!normalizePhone(phone)) {
      setPhoneError('Escribe un número válido, por ejemplo +56 9 1234 5678')
      return
    }

    setPhoneError('')
    setSubmitting(true)
    try {
      const { isNewUser } = await loginWithPhone(phone)
      if (isNewUser) {
        navigate('/bienvenido', { replace: true })
      } else {
        toast.success('¡Bienvenido de vuelta!')
        navigate(location.state?.from?.pathname || '/', { replace: true })
      }
      // No se resetea `submitting` en el camino feliz: mantenerlo en true deja
      // cerrado el efecto de redirección de arriba, que si no compite con este
      // navigate y se lleva al usuario a "/" en vez de al onboarding.
    } catch (error) {
      console.error('Login por teléfono falló:', error.code, error)
      setPhoneError(loginErrorMessage(error))
      setSubmitting(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle()
      toast.success('¡Bienvenido!')
    } catch (error) {
      if (error.code !== 'auth/popup-closed-by-user') {
        toast.error('Error al iniciar sesión')
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#fafafa] dark:bg-zinc-950">
        <div className="w-full max-w-sm space-y-6">
          <Skeleton variant="avatar" className="w-16 h-16 mx-auto" />
          <Skeleton variant="title" className="w-2/3 mx-auto" />
          <Skeleton variant="text" className="w-1/2 mx-auto" />
          <Skeleton variant="card" className="h-32 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#fafafa] dark:bg-zinc-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-16 h-16 bg-zinc-900 dark:bg-zinc-50 rounded-2xl flex items-center justify-center mx-auto mb-6"
          >
            <span className="text-white dark:text-zinc-900 font-bold text-xl">FA</span>
          </motion.div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight mb-1.5">
            {APP_NAME}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Gestiona tu experiencia futbolística
          </p>
        </div>

        {/* Login card */}
        <Card className="p-8 dark:border-zinc-600 dark:bg-zinc-800/60">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 text-center mb-8">
            Entrar
          </h2>

          <form onSubmit={handlePhoneLogin} className="space-y-4">
            <Input
              label="Tu número de celular"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              autoFocus
              placeholder="+56 9 1234 5678"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value)
                if (phoneError) setPhoneError('')
              }}
              error={phoneError}
              disabled={submitting}
            />

            <Button type="submit" fullWidth size="lg" loading={submitting}>
              Continuar
            </Button>
          </form>

          <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center mt-6">
            Con tu número basta. No necesitas contraseña.
          </p>
        </Card>

        {/* Acceso de administración */}
        <div className="text-center mt-6">
          {showAdmin ? (
            <Button
              size="sm"
              variant="outline"
              onClick={handleGoogleLogin}
              className="inline-flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continuar con Google</span>
            </Button>
          ) : (
            <button
              onClick={() => setShowAdmin(true)}
              className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 text-xs transition-colors"
            >
              Soy administrador
            </button>
          )}
        </div>

        {/* Back link */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/')}
            className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 text-sm transition-colors"
          >
            ← Volver al inicio
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default Login
