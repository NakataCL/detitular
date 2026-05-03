// Topbar persistente para escritorio (>=md) — logo + breadcrumbs + búsqueda global + avatar
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronRight } from '../../utils/icons'
import { Avatar } from '../ui'
import { useAuth } from '../../context/AuthContext'
import { APP_NAME } from '../../utils/constants'
import GlobalSearch from './GlobalSearch'

const ROUTE_LABELS = {
  '/': 'Inicio',
  '/eventos': 'Eventos',
  '/registros': 'Mis convocatorias',
  '/experiencias': 'Galería',
  '/perfil': 'Perfil',
  '/admin': 'Admin',
  '/admin/eventos': 'Eventos',
  '/admin/usuarios': 'Usuarios'
}

const buildCrumbs = (pathname) => {
  if (pathname === '/') return [{ label: 'Inicio', path: '/' }]
  const segments = pathname.split('/').filter(Boolean)
  const crumbs = [{ label: 'Inicio', path: '/' }]
  let acc = ''
  for (const seg of segments) {
    acc += `/${seg}`
    crumbs.push({
      label: ROUTE_LABELS[acc] || decodeURIComponent(seg),
      path: acc
    })
  }
  return crumbs
}

const Topbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, userData, isAuthenticated } = useAuth()

  const crumbs = buildCrumbs(location.pathname)

  return (
    <header
      className="hidden md:flex sticky top-0 z-30 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200/40 dark:border-zinc-800/40"
      aria-label="Barra superior"
    >
      <div className="flex items-center justify-between gap-6 w-full px-6 lg:px-10 h-14">
        {/* Breadcrumbs */}
        <nav aria-label="Migas de pan" className="flex items-center gap-1.5 text-sm min-w-0">
          {crumbs.map((c, idx) => {
            const isLast = idx === crumbs.length - 1
            return (
              <span key={c.path} className="inline-flex items-center gap-1.5 min-w-0">
                {idx > 0 && (
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" aria-hidden="true" />
                )}
                {isLast ? (
                  <span className="font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                    {c.label}
                  </span>
                ) : (
                  <button
                    onClick={() => navigate(c.path)}
                    className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors truncate"
                  >
                    {c.label}
                  </button>
                )}
              </span>
            )
          })}
        </nav>

        {/* Búsqueda global */}
        <div className="flex-1 max-w-md">
          <GlobalSearch />
        </div>

        {/* Avatar */}
        {isAuthenticated ? (
          <button
            onClick={() => navigate('/perfil')}
            aria-label="Mi perfil"
            className="rounded-full"
          >
            <Avatar
              src={user?.photoURL}
              name={userData?.nombre || user?.displayName}
              size="sm"
            />
          </button>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
          >
            Iniciar sesión
          </button>
        )}
      </div>

      {/* Logo / nombre app oculto pero accesible — APP_NAME no se renderiza para no duplicar el sidebar */}
      <span className="sr-only">{APP_NAME}</span>
    </header>
  )
}

export default Topbar
