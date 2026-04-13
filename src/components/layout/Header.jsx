// Header para móvil
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, LogIn } from '../../utils/icons'
import { useAuth } from '../../context/AuthContext'
import { APP_NAME } from '../../utils/constants'
import Avatar from '../ui/Avatar'
import logo from '../../assets/logo.png'

const Header = ({
  title = null,
  showBack = false,
  onBack = null,
  rightContent = null,
  transparent = false
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, userData, isAuthenticated, login } = useAuth()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate(-1)
    }
  }

  const handleLogin = async () => {
    try {
      await login()
    } catch (error) {
      console.error('Error al iniciar sesión:', error)
    }
  }

  const getDefaultTitle = () => {
    const paths = {
      '/': APP_NAME,
      '/registros': 'Mis Registros',
      '/eventos': 'Eventos',
      '/experiencias': 'Experiencias',
      '/perfil': 'Mi Perfil',
      '/admin': 'Panel Admin'
    }
    return paths[location.pathname] || APP_NAME
  }

  return (
    <header
      className={`sticky top-0 z-30 md:hidden ${
        transparent
          ? ''
          : 'bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200/40 dark:border-zinc-800/40'
      }`}
    >
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left */}
        <div className="flex items-center gap-2.5">
          {showBack ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleBack}
              className="p-1.5 -ml-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <ArrowLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
            </motion.button>
          ) : (
            <img src={logo} alt={APP_NAME} className="w-9 h-9 rounded-lg object-cover" />
          )}

          <h1 className="font-semibold text-zinc-900 dark:text-zinc-50 text-[15px] tracking-tight">
            {title || getDefaultTitle()}
          </h1>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1.5">
          {rightContent}

          {isAuthenticated ? (
            <button
              onClick={() => navigate('/perfil')}
              className="rounded-full"
            >
              <Avatar
                src={user?.photoURL}
                name={userData?.nombre || user?.displayName}
                size="sm"
              />
            </button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 rounded-lg text-sm font-medium"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Entrar</span>
            </motion.button>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
