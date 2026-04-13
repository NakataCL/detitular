// Página de Inicio
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Calendar, Users, Trophy, ArrowRight, LogIn, Zap } from '../utils/icons'
import { Card, Button, Countdown, Skeleton, Badge } from '../components/ui'
import { EventCard } from '../components/events'
import { useNextEvent, useActiveEvents } from '../hooks/useEvents'
import { useStats } from '../hooks/useStats'
import { useAuth } from '../context/AuthContext'
import { APP_NAME } from '../utils/constants'
import { formatShortDate } from '../utils/helpers'

const Home = () => {
  const navigate = useNavigate()
  const { isAuthenticated, login } = useAuth()
  const { data: nextEvent, isLoading: loadingNext } = useNextEvent()
  const { data: activeEvents, isLoading: loadingEvents } = useActiveEvents()
  const { data: stats, isLoading: loadingStats } = useStats({ enabled: isAuthenticated })

  const handleLogin = async () => {
    try {
      await login()
    } catch (error) {
      console.error('Error al iniciar sesión:', error)
    }
  }

  return (
    <div className="px-6 md:px-12 pt-10 pb-12 md:pt-14 md:pb-20 max-w-5xl mx-auto space-y-16">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 rounded-full text-xs font-medium mb-6">
          <Zap className="w-3 h-3" />
          Temporada 2026 activa
        </div>

        <h1 className="text-3xl md:text-5xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight mb-4">
          {APP_NAME}
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-base md:text-lg max-w-lg mb-10">
          Entrena, compite y lleva tu juego al siguiente nivel
        </p>

        {!isAuthenticated && (
          <div className="flex items-center gap-3">
            <Button size="lg" icon={LogIn} onClick={handleLogin}>
              Comenzar ahora
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => navigate('/eventos')}
              icon={ArrowRight}
              iconPosition="right"
            >
              Ver eventos
            </Button>
          </div>
        )}
      </motion.section>

      {/* Stats */}
      {isAuthenticated && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
        >
          <StatCard label="Jugadores" value={loadingStats ? '...' : stats?.totalPlayers || 0} icon={Users} />
          <StatCard label="Eventos/mes" value={loadingStats ? '...' : stats?.eventsThisMonth || 0} icon={Calendar} />
          <StatCard label="Inscripciones" value={loadingStats ? '...' : stats?.registrationsThisMonth || 0} icon={Trophy} />
          <StatCard label="Activos" value={loadingStats ? '...' : stats?.activePlayers || 0} icon={Zap} />
        </motion.section>
      )}

      {/* Next Event + Events in 2 cols on desktop */}
      <div className="grid md:grid-cols-2 gap-8 md:gap-10">
        {/* Next Event */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card padding="lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                Próximo Evento
              </h2>
              {nextEvent && (
                <Badge variant={nextEvent.type} size="sm">{nextEvent.type}</Badge>
              )}
            </div>

            {loadingNext ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-3 mt-5">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-14 w-14 rounded-xl" />
                  ))}
                </div>
              </div>
            ) : nextEvent ? (
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-1">
                  {nextEvent.title}
                </h3>
                <p className="text-sm text-zinc-400 mb-6">
                  {formatShortDate(nextEvent.date)}
                </p>

                <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                  <p className="text-xs text-zinc-400 uppercase tracking-widest mb-3 text-center font-medium">
                    Comienza en
                  </p>
                  <Countdown targetDate={nextEvent.date} />
                </div>

                <Button
                  fullWidth
                  variant="outline"
                  onClick={() => navigate(`/eventos/${nextEvent.id}`)}
                  icon={ArrowRight}
                  iconPosition="right"
                >
                  Ver detalles
                </Button>
              </div>
            ) : (
              <div className="text-center py-10">
                <Calendar className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                <p className="text-sm text-zinc-400">No hay eventos próximos</p>
              </div>
            )}
          </Card>
        </motion.section>

        {/* Active Events */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
              Eventos Disponibles
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/eventos')}
              icon={ArrowRight}
              iconPosition="right"
            >
              Ver todos
            </Button>
          </div>

          {loadingEvents ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton.EventCard key={i} />
              ))}
            </div>
          ) : activeEvents?.length > 0 ? (
            <div className="space-y-4">
              {activeEvents.slice(0, 3).map((event) => (
                <EventCard key={event.id} event={event} compact showActions={false} />
              ))}
            </div>
          ) : (
            <Card className="text-center py-10">
              <Calendar className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-400">No hay eventos disponibles</p>
            </Card>
          )}
        </motion.section>
      </div>

      {/* CTA */}
      {!isAuthenticated && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="relative overflow-hidden rounded-2xl bg-zinc-900 dark:bg-zinc-800/80 p-10 md:p-14">
            <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/10 rounded-full blur-3xl" />
            <div className="relative">
              <h3 className="text-xl font-semibold text-white mb-2">
                ¿Listo para jugar?
              </h3>
              <p className="text-sm text-zinc-400 mb-6 max-w-md">
                Únete a la academia y empieza a inscribirte en eventos
              </p>
              <Button
                onClick={handleLogin}
                icon={LogIn}
                className="bg-white text-zinc-900 hover:bg-zinc-100"
              >
                Registrarse con Google
              </Button>
            </div>
          </div>
        </motion.section>
      )}
    </div>
  )
}

const StatCard = ({ icon: Icon, label, value }) => (
  <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-700 rounded-2xl p-5 md:p-6">
    <div className="flex items-center gap-3 mb-3">
      <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800">
        <Icon className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
      </div>
      <span className="text-xs text-zinc-400 font-medium">{label}</span>
    </div>
    <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">{value}</p>
  </div>
)

export default Home
