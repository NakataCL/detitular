// Sidebar para desktop
import { NavLink, useLocation } from 'react-router-dom'
import {
  Home,
  ClipboardList,
  Calendar,
  Film,
  User,
  Users,
  Shield,
  ChevronLeft,
  LogOut
} from '../../utils/icons'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { APP_NAME } from '../../utils/constants'
import Avatar from '../ui/Avatar'
import logo from '../../assets/logo.png'

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const { user, userData, isAuthenticated, isAdmin, logout } = useAuth()

  const navItems = [
    { path: '/', icon: Home, label: 'Inicio', public: true },
    { path: '/registros', icon: ClipboardList, label: 'Registros', public: false },
    { path: '/eventos', icon: Calendar, label: 'Eventos', public: true },
    { path: '/experiencias', icon: Film, label: 'Experiencias', public: true }
  ]

  const visibleItems = navItems.filter(
    item => item.public || isAuthenticated
  )

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  return (
    <aside
      className={`hidden md:flex flex-col bg-white dark:bg-zinc-900 border-r border-zinc-200/80 dark:border-zinc-800 transition-all duration-300 ${
        collapsed ? 'w-[72px]' : 'w-60'
      }`}
    >
      <div className="sticky top-0 h-screen flex flex-col">
      {/* Header */}
      <div className={`flex flex-col items-center px-4 ${collapsed ? 'py-4' : 'pt-6 pb-4'}`}>
        {collapsed ? (
          <img src={logo} alt={APP_NAME} className="w-10 h-10 rounded-lg object-cover mb-2" />
        ) : (
          <>
            <img src={logo} alt={APP_NAME} className="w-32 h-32 rounded-2xl object-cover mb-2" />
            <div className="flex items-center justify-center gap-1.5 w-full">
              <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-50 tracking-tight">
                {APP_NAME}
              </span>
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {collapsed && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 rotate-180" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pt-4 space-y-1.5">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path))

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-colors ${
                isActive
                  ? 'bg-zinc-100 text-zinc-900 font-semibold dark:bg-zinc-800 dark:text-zinc-50'
                  : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-900'
              }`}
            >
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={isActive ? 2.2 : 1.8} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          )
        })}

        {isAuthenticated && (
          <>
            <div className="my-4 border-t border-zinc-100 dark:border-zinc-800" />

            <NavLink
              to="/perfil"
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-colors ${
                location.pathname === '/perfil'
                  ? 'bg-zinc-100 text-zinc-900 font-semibold dark:bg-zinc-800 dark:text-zinc-50'
                  : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-900'
              }`}
            >
              <User className="w-[18px] h-[18px] flex-shrink-0" />
              {!collapsed && <span>Mi Perfil</span>}
            </NavLink>

            {isAdmin && (
              <>
                <NavLink
                  to="/admin"
                  end
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-colors ${
                    location.pathname === '/admin'
                      ? 'bg-zinc-100 text-zinc-900 font-semibold dark:bg-zinc-800 dark:text-zinc-50'
                      : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-900'
                  }`}
                >
                  <Shield className="w-[18px] h-[18px] flex-shrink-0" />
                  {!collapsed && <span>Admin</span>}
                </NavLink>

                <NavLink
                  to="/admin/usuarios"
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-colors ${
                    location.pathname.startsWith('/admin/usuarios')
                      ? 'bg-zinc-100 text-zinc-900 font-semibold dark:bg-zinc-800 dark:text-zinc-50'
                      : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-900'
                  }`}
                >
                  <Users className="w-[18px] h-[18px] flex-shrink-0" />
                  {!collapsed && <span>Usuarios</span>}
                </NavLink>
              </>
            )}
          </>
        )}
      </nav>

      {/* Footer */}
      {isAuthenticated && (
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
            <Avatar
              src={user?.photoURL}
              name={userData?.nombre || user?.displayName}
              size="sm"
            />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">
                  {userData?.nombre || user?.displayName}
                </p>
                <p className="text-xs text-zinc-400 truncate">
                  {userData?.role === 'admin' ? 'Admin' : 'Jugador'}
                </p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
      </div>
    </aside>
  )
}

export default Sidebar
