// Dashboard de administración
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Calendar,
  ClipboardList,
  Image,
  TrendingUp,
  ArrowRight,
  Plus
} from '../../utils/icons'
import { Card, Button, Skeleton } from '../../components/ui'
import { useStats } from '../../hooks/useStats'
import { useNextEvent } from '../../hooks/useEvents'
import { formatShortDate } from '../../utils/helpers'

const AdminDashboard = () => {
  const navigate = useNavigate()
  const { data: stats, isLoading: loadingStats } = useStats()
  const { data: nextEvent, isLoading: loadingEvent } = useNextEvent()

  const quickActions = [
    {
      title: 'Crear Evento',
      description: 'Programa un nuevo evento',
      icon: Calendar,
      color: 'bg-blue-500',
      action: () => navigate('/admin/eventos')
    },
    {
      title: 'Gestionar Usuarios',
      description: 'Ver y administrar jugadores',
      icon: Users,
      color: 'bg-red-500',
      action: () => navigate('/admin/usuarios')
    },
    {
      title: 'Subir Contenido',
      description: 'Añadir fotos o videos',
      icon: Image,
      color: 'bg-purple-500',
      action: () => navigate('/experiencias')
    }
  ]

  return (
    <div className="px-4 sm:px-6 md:px-12 pt-8 sm:pt-10 pb-12 md:pt-14 md:pb-20 max-w-6xl mx-auto space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Panel de Administración
          </h1>
          <p className="text-zinc-400">Gestiona tu academia de fútbol</p>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          title="Jugadores"
          value={loadingStats ? '-' : stats?.totalPlayers || 0}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Activos con plan"
          value={loadingStats ? '-' : stats?.activePlayers || 0}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Eventos del mes"
          value={loadingStats ? '-' : stats?.eventsThisMonth || 0}
          icon={Calendar}
          color="amber"
        />
        <StatCard
          title="Inscripciones"
          value={loadingStats ? '-' : stats?.registrationsThisMonth || 0}
          icon={ClipboardList}
          color="purple"
        />
      </div>

      {/* Acciones rápidas */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-5">
          Acciones Rápidas
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card hover onClick={action.action} className="cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${action.color} text-white`}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                      {action.title}
                    </h3>
                    <p className="text-sm text-zinc-400">{action.description}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-zinc-400" />
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Próximo evento */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Próximo Evento
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/eventos')}
            icon={ArrowRight}
            iconPosition="right"
          >
            Ver todos
          </Button>
        </div>

        {loadingEvent ? (
          <Skeleton.EventCard />
        ) : nextEvent ? (
          <Card>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center">
                <Calendar className="w-7 h-7 text-zinc-600 dark:text-zinc-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {nextEvent.title}
                </h3>
                <p className="text-sm text-zinc-400">
                  {formatShortDate(nextEvent.date)} • {nextEvent.currentSlots}/{nextEvent.maxSlots} inscritos
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/eventos/${nextEvent.id}`)}
              >
                Ver
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="text-center py-8">
            <Calendar className="w-12 h-12 text-zinc-300 mx-auto mb-2" />
            <p className="text-zinc-400 mb-4">No hay eventos próximos</p>
            <Button onClick={() => navigate('/admin/eventos')} icon={Plus}>
              Crear evento
            </Button>
          </Card>
        )}
      </div>

      {/* Secciones de administración */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card hover onClick={() => navigate('/admin/eventos')} className="cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                Gestión de Eventos
              </h3>
              <p className="text-sm text-zinc-400">
                Crear, editar y ver inscritos
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-zinc-400" />
          </div>
        </Card>

        <Card hover onClick={() => navigate('/admin/usuarios')} className="cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30">
              <Users className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                Gestión de Usuarios
              </h3>
              <p className="text-sm text-zinc-400">
                Planes, roles y perfiles
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-zinc-400" />
          </div>
        </Card>
      </div>
    </div>
  )
}

// Tarjeta de estadística
const StatCard = ({ title, value, icon: Icon, color }) => {
  const colors = {
    blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    green: 'text-red-600 bg-red-100 dark:bg-red-900/30',
    amber: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
    purple: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30'
  }

  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{value}</p>
          <p className="text-xs text-zinc-400">{title}</p>
        </div>
      </div>
    </Card>
  )
}

export default AdminDashboard
