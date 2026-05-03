// Layout principal de la aplicación
import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import Sidebar from './Sidebar'
import Header from './Header'
import Topbar from './Topbar'
import { OfflineIndicator, InstallPrompt } from '../ui'

const Layout = ({ showHeader = true, headerProps = {} }) => {
  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-zinc-950">
      <OfflineIndicator />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 min-w-0 min-h-screen">
          {/* Header sólo móvil; Topbar sólo escritorio */}
          {showHeader && <Header {...headerProps} />}
          <Topbar />

          <div className="pb-nav md:pb-0">
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
