// Navegación inferior para móvil
import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Home,
  ClipboardList,
  Calendar,
  Film,
  User,
  Shield
} from '../../utils/icons'
import { useAuth } from '../../context/AuthContext'

const BottomNav = () => {
  const location = useLocation()
  const { isAuthenticated, isAdmin } = useAuth()

  const navItems = [
    { path: '/', icon: Home, label: 'Inicio', public: true },
    { path: '/registros', icon: ClipboardList, label: 'Registros', public: false },
    { path: '/eventos', icon: Calendar, label: 'Eventos', public: true },
    { path: '/experiencias', icon: Film, label: 'Galería', public: true },
    {
      path: isAdmin ? '/admin' : '/perfil',
      icon: isAdmin ? Shield : User,
      label: isAdmin ? 'Admin' : 'Perfil',
      public: false
    }
  ]

  const visibleItems = navItems.filter(
    item => item.public || isAuthenticated
  )

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-200/40 dark:border-zinc-800/40 safe-area-bottom md:hidden">
      <div className="flex items-center justify-around h-[60px]">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path))

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center justify-center w-full h-full"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`flex flex-col items-center gap-0.5 ${
                  isActive
                    ? 'text-zinc-900 dark:text-zinc-50'
                    : 'text-zinc-400 dark:text-zinc-500'
                }`}
              >
                <div className={`p-1 rounded-lg ${isActive ? 'bg-zinc-100 dark:bg-zinc-800' : ''}`}>
                  <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.2 : 1.8} />
                </div>
                <span className={`text-xs ${isActive ? 'font-semibold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </motion.div>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNav
