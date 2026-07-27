// Layout principal de la aplicación
import { Outlet, Navigate } from 'react-router-dom'
import BottomNav from './BottomNav'
import Sidebar from './Sidebar'
import Header from './Header'
import Topbar from './Topbar'
import { useAuth } from '../../context/AuthContext'
import { OfflineIndicator, InstallPrompt } from '../ui'

const Layout = ({ showHeader = true, headerProps = {} }) => {
  const { needsOnboarding } = useAuth()

  // Único punto por el que pasan TODAS las páginas de la app, incluidas las
  // públicas como Inicio. El guard va aquí y no en ProtectedRoute porque una
  // cuenta sin nombre puede aterrizar en una ruta pública.
  // /bienvenido vive fuera del Layout, así que no hay bucle.
  if (needsOnboarding) {
    return <Navigate to="/bienvenido" replace />
  }

  return (
    <div className="h-dvh overflow-hidden bg-[#fafafa] dark:bg-zinc-950">
      <OfflineIndicator />

      <div className="flex h-full">
        <Sidebar />

        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* Header sólo móvil; Topbar sólo escritorio */}
          {showHeader && <Header {...headerProps} />}
          <Topbar />

          {/* Único contenedor con scroll: header, sidebar y bottom nav quedan fijos */}
          <div className="flex-1 overflow-y-auto overscroll-contain pb-nav md:pb-0">
            <Outlet />
          </div>
        </main>
      </div>

      <BottomNav />
      <InstallPrompt />
    </div>
  )
}

export default Layout
