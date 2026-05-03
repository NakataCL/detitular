// Navegación inferior para móvil — 4 ítems + FAB central
import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, ClipboardList, Calendar, User, Shield, Plus } from '../../utils/icons'
import { useAuth } from '../../context/AuthContext'
import { useMyRegistrationsHydrated } from '../../hooks/useRegistrations'
import { RegistrationConfirmSheet } from '../events'
import QuickRegisterSheet from './QuickRegisterSheet'

const ONE_DAY_MS = 24 * 60 * 60 * 1000

const computeImminent = (regs, isAuthenticated) => {
  if (!isAuthenticated || !regs?.length) return false
  const now = Date.now()
  return regs.some(reg => {
    if (!reg.event || reg.canceledAt) return false
    const ts = reg.event.date?.toDate?.()?.getTime() ||
      new Date(reg.event.date).getTime()
    return ts > now && ts - now < ONE_DAY_MS
  })
}

const BottomNav = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, isAdmin } = useAuth()
  const [quickOpen, setQuickOpen] = useState(false)
  const [confirmedEvent, setConfirmedEvent] = useState(null)

  // Solo cargamos las inscripciones si el usuario está autenticado;
  // useMyRegistrations dentro del hook ya está condicionado por user.uid.
  const { data: hydratedRegs } = useMyRegistrationsHydrated()

  const hasImminent = computeImminent(hydratedRegs, isAuthenticated)

  const items = [
    { path: '/', icon: Home, label: 'Inicio', public: true },
    { path: '/eventos', icon: Calendar, label: 'Eventos', public: true },
    {
      path: '/registros',
      icon: ClipboardList,
      label: 'Convocatorias',
      public: false,
      badge: hasImminent
    },
    {
      path: isAdmin ? '/admin' : '/perfil',
      icon: isAdmin ? Shield : User,
      label: isAdmin ? 'Admin' : 'Perfil',
      public: false
    }
  ]

  const visibleItems = items.filter(item => item.public || isAuthenticated)

  // Insertar el slot del FAB exactamente en el medio
  const half = Math.ceil(visibleItems.length / 2)
  const leftItems = visibleItems.slice(0, half)
  const rightItems = visibleItems.slice(half)

  const handleFabClick = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } })
      return
    }
    setQuickOpen(true)
  }

  return (
    <>
      <nav
        aria-label="Navegación principal"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-xl border-t border-zinc-200/40 dark:border-zinc-800/40 safe-area-bottom md:hidden"
      >
        <div className="flex items-stretch h-[60px]">
          {leftItems.map(item => (
            <NavItem key={item.path} item={item} location={location} />
          ))}

          {/* Hueco del FAB */}
          <div className="w-16 flex-shrink-0" aria-hidden="true" />

          {rightItems.map(item => (
            <NavItem key={item.path} item={item} location={location} />
          ))}
        </div>

        {/* FAB */}
        <button
          onClick={handleFabClick}
          aria-label="Inscripción rápida"
          className="absolute left-1/2 -translate-x-1/2 -top-5 w-14 h-14 rounded-full bg-red-700 hover:bg-red-800 active:bg-red-800 text-white shadow-lg shadow-red-700/30 flex items-center justify-center transition-colors focus:outline-none focus:ring-4 focus:ring-red-700/30"
        >
          <Plus className="w-6 h-6" aria-hidden="true" />
        </button>
      </nav>

      <QuickRegisterSheet
        isOpen={quickOpen}
        onClose={() => setQuickOpen(false)}
        onRegistered={(event) => {
          setQuickOpen(false)
          setConfirmedEvent(event)
        }}
      />

      <RegistrationConfirmSheet
        event={confirmedEvent}
        isOpen={!!confirmedEvent}
        onClose={() => setConfirmedEvent(null)}
      />
    </>
  )
}

const NavItem = ({ item, location }) => {
  const isActive = location.pathname === item.path ||
    (item.path !== '/' && location.pathname.startsWith(item.path))

  return (
    <NavLink
      to={item.path}
      aria-current={isActive ? 'page' : undefined}
      className="flex-1 relative flex items-center justify-center"
    >
      <motion.div
        whileTap={{ scale: 0.92 }}
        className={`relative flex flex-col items-center gap-0.5 ${
          isActive
            ? 'text-zinc-900 dark:text-zinc-50'
            : 'text-zinc-500 dark:text-zinc-400'
        }`}
      >
        <div className={`p-1 rounded-lg ${isActive ? 'bg-zinc-100 dark:bg-zinc-800' : ''}`}>
          <item.icon className="w-5 h-5" aria-hidden="true" />
          {item.badge && (
            <span
              aria-label="Eventos próximos en menos de 24 horas"
              className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-600 rounded-full ring-2 ring-white dark:ring-zinc-950"
            />
          )}
        </div>
        <span className={`text-[11px] ${isActive ? 'font-bold' : 'font-semibold'}`}>
          {item.label}
        </span>
      </motion.div>
    </NavLink>
  )
}

export default BottomNav
