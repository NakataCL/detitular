// App principal con routing
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { Layout, ProtectedRoute } from './components/layout'

// Páginas
import Home from './pages/Home'
import Eventos from './pages/Eventos'
import EventoDetalle from './pages/EventoDetalle'
import Registros from './pages/Registros'
import Experiencias from './pages/Experiencias'
import Perfil from './pages/Perfil'
import Login from './pages/Login'
import { AdminDashboard, AdminEventos, AdminUsuarios } from './pages/admin'

// Crear cliente de React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5 // 5 minutos
    }
  }
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Routes>
            {/* Ruta de login fuera del layout */}
            <Route path="/login" element={<Login />} />

            {/* Rutas con layout */}
            <Route element={<Layout />}>
              {/* Rutas públicas */}
              <Route path="/" element={<Home />} />
              <Route path="/eventos" element={<Eventos />} />
              <Route path="/eventos/:id" element={<EventoDetalle />} />
              <Route path="/experiencias" element={<Experiencias />} />

              {/* Rutas protegidas (requieren autenticación) */}
              <Route
                path="/registros"
                element={
                  <ProtectedRoute redirectTo="/login">
                    <Registros />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/perfil"
                element={
                  <ProtectedRoute redirectTo="/login">
                    <Perfil />
                  </ProtectedRoute>
                }
              />

              {/* Rutas de admin (requieren rol admin) */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAuth requireAdmin redirectTo="/">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/eventos"
                element={
                  <ProtectedRoute requireAuth requireAdmin redirectTo="/">
                    <AdminEventos />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/usuarios"
                element={
                  <ProtectedRoute requireAuth requireAdmin redirectTo="/">
                    <AdminUsuarios />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Redirección de rutas no encontradas */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>

        {/* Toast notifications */}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1f2937',
              color: '#fff',
              borderRadius: '12px',
              padding: '12px 16px'
            },
            success: {
              iconTheme: {
                primary: '#dc2626',
                secondary: '#fff'
              }
            },
            error: {
              iconTheme: {
                primary: '#e74c3c',
                secondary: '#fff'
              }
            }
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
