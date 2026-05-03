// Página de Inicio
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar, ArrowRight, LogIn } from '../utils/icons'
import { Button, Skeleton } from '../components/ui'
import { EventCard } from '../components/events'
import { useNextEvent, useActiveEvents } from '../hooks/useEvents'
import { useStats } from '../hooks/useStats'
import { useAuth } from '../context/AuthContext'
import { APP_NAME, EVENT_TYPES } from '../utils/constants'
import { getTimeRemaining } from '../utils/helpers'

const Home = () => {
  const navigate = useNavigate()
  const { isAuthenticated, userData, user, login } = useAuth()
  const { data: nextEvent, isLoading: loadingNext } = useNextEvent()
  const { data: activeEvents, isLoading: loadingEvents } = useActiveEvents()
  const { data: stats } = useStats({ enabled: isAuthenticated })

  const handleLogin = async () => {
    try {
      await login()
    } catch (error) {
      console.error('Error al iniciar sesión:', error)
    }
  }

  const firstName =
    userData?.nombre?.split(' ')[0] ||
    user?.displayName?.split(' ')[0] ||
    'Jugador'

  const showStats = isAuthenticated && (stats?.totalRegistrations || 0) > 0

  return (
    <div className="px-4 sm:px-6 md:px-12 pt-8 sm:pt-10 pb-12 md:pt-14 md:pb-20 max-w-5xl mx-auto space-y-12">
      {/* Saludo */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400 font-bold">
          {isAuthenticated ? `Hola, ${firstName}` : 'Bienvenido'}
        </p>
      </motion.div>

      {/* Hero — Próximo Evento */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.4 }}
      >
        <NextEventHero
          event={nextEvent}
          loading={loadingNext}
          onView={() => nextEvent && navigate(`/eventos/${nextEvent.id}`)}
          onBrowse={() => navigate('/eventos')}
        />
      </motion.div>

      {/* Stats — solo si el jugador tiene actividad */}
      {showStats && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <header className="flex items-center justify-between mb-5">
            <h2 className="text-xs uppercase tracking-[0.18em] font-bold text-zinc-500 dark:text-zinc-400">
              Tu temporada
            </h2>
          </header>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <MiniStat label="Inscripciones" value={stats?.totalRegistrations || 0} />
            <MiniStat label="Eventos del mes" value={stats?.eventsThisMonth || 0} />
            <MiniStat label="Inscritos del mes" value={stats?.registrationsThisMonth || 0} />
            <MiniStat label="Activos" value={stats?.activePlayers || 0} />
          </div>
        </motion.section>
      )}

      {/* Próximos eventos (lista compacta, sola columna) */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <header className="flex items-center justify-between mb-5">
          <h2 className="text-xs uppercase tracking-[0.18em] font-bold text-zinc-500 dark:text-zinc-400">
            Próximos eventos
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
        </header>

        {loadingEvents ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton.EventCard key={i} />)}
          </div>
        ) : activeEvents?.length > 0 ? (
          <div className="space-y-3">
            {activeEvents.slice(0, 3).map((event) => (
              <EventCard key={event.id} event={event} compact showActions={false} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 px-5 py-10 text-center">
            <Calendar className="w-9 h-9 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Sin eventos disponibles ahora mismo
            </p>
          </div>
        )}
      </motion.section>

      {/* CTA login (anónimo) */}
      {!isAuthenticated && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="relative overflow-hidden rounded-3xl bg-zinc-900 dark:bg-zinc-800/80 p-8 md:p-12">
            <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/10 rounded-full blur-3xl" />
            <div className="relative max-w-md">
              <h3 className="font-display text-3xl md:text-4xl text-white mb-3">
                ¿Listo para jugar?
              </h3>
              <p className="text-sm text-zinc-300 mb-6">
                Únete a {APP_NAME} y empieza a inscribirte en eventos.
              </p>
              <Button
                onClick={handleLogin}
                icon={LogIn}
                className="bg-white text-zinc-900 hover:bg-zinc-100"
              >
                Continuar con Google
              </Button>
            </div>
          </div>
        </motion.section>
      )}
    </div>
  )
}

// Hero del próximo evento — fullbleed oscuro con countdown gigante
const NextEventHero = ({ event, loading, onView, onBrowse }) => {
  if (loading) {
    return (
      <section className="rounded-3xl bg-zinc-900 dark:bg-black p-7 md:p-10 min-h-[280px] animate-pulse" />
    )
  }

  if (!event) {
    return (
      <section className="relative overflow-hidden rounded-3xl bg-zinc-900 dark:bg-black p-7 md:p-10">
        <span
          aria-hidden="true"
          className="font-display italic absolute right-[-20px] top-[-20px] text-[180px] leading-none text-white/[0.05] select-none pointer-events-none"
        >
          —
        </span>
        <div className="relative">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400 font-bold mb-4">
            Próximo evento
          </p>
          <h2 className="font-display text-3xl md:text-5xl text-white leading-tight mb-4">
            Sin eventos programados
          </h2>
          <p className="text-sm text-zinc-300 mb-6 max-w-md">
            En cuanto haya un nuevo evento aparecerá aquí. Mientras tanto puedes explorar la galería.
          </p>
          <Button
            onClick={onBrowse}
            icon={ArrowRight}
            iconPosition="right"
            className="bg-white text-zinc-900 hover:bg-zinc-100"
          >
            Ver eventos
          </Button>
        </div>
      </section>
    )
  }

  const eventType = EVENT_TYPES[event.type] || EVENT_TYPES.otro
  const eventDate = event.date?.toDate ? event.date.toDate() : new Date(event.date)
  const watermark = event.maxSlots || eventDate.getDate()

  const dayName = format(eventDate, 'EEE', { locale: es }).replace('.', '')
  const dayNum = format(eventDate, 'd', { locale: es })
  const monthName = format(eventDate, 'MMMM', { locale: es })
  const time = format(eventDate, 'HH:mm', { locale: es })

  return (
    <section className="relative overflow-hidden rounded-3xl bg-zinc-900 dark:bg-black p-7 md:p-10">
      {/* Marca de agua */}
      <span
        aria-hidden="true"
        className="font-display italic absolute right-[-20px] top-[-20px] text-[180px] leading-none text-white/[0.05] select-none pointer-events-none"
      >
        {watermark}
      </span>

      <div className="relative">
        {/* Label fecha */}
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-400 font-bold mb-4">
          {dayName} {dayNum} {monthName} · {time}
        </p>

        {/* Título */}
        <h2 className="font-display text-3xl md:text-5xl text-white leading-tight mb-8 tracking-tight">
          {event.title}
        </h2>

        {/* Countdown gigante */}
        <BigCountdown targetDate={event.date} />

        {/* Chips inferiores */}
        <div className="mt-10 flex items-center flex-wrap gap-3">
          <span
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] text-white ${eventType.bgClass}`}
          >
            {eventType.label}
          </span>
          <Button
            size="sm"
            onClick={onView}
            icon={ArrowRight}
            iconPosition="right"
            className="bg-white text-zinc-900 hover:bg-zinc-100"
          >
            Ver detalles
          </Button>
        </div>
      </div>
    </section>
  )
}

// Countdown a tamaño hero
const BigCountdown = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState(() => getTimeRemaining(targetDate))

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeRemaining(targetDate)), 1000)
    return () => clearInterval(id)
  }, [targetDate])

  if (!timeLeft || timeLeft.expired) {
    return (
      <p className="font-display text-3xl md:text-4xl text-white">
        ¡Está en marcha!
      </p>
    )
  }

  return (
    <div
      className="flex items-baseline gap-5 md:gap-8 text-white"
      role="timer"
      aria-label={`Faltan ${timeLeft.days} días, ${timeLeft.hours} horas y ${timeLeft.minutes} minutos`}
    >
      <BigUnit value={timeLeft.days} label="días" />
      <BigUnit value={timeLeft.hours} label="hr" />
      <BigUnit value={timeLeft.minutes} label="min" />
    </div>
  )
}

const BigUnit = ({ value, label }) => (
  <div className="flex flex-col items-start">
    <span className="font-display tabular-nums text-5xl md:text-7xl leading-[0.95]">
      {String(value).padStart(2, '0')}
    </span>
    <span className="mt-1 text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold text-zinc-400">
      {label}
    </span>
  </div>
)

// Tarjeta de stat compacta (secundaria)
const MiniStat = ({ label, value }) => (
  <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-4">
    <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-zinc-500 dark:text-zinc-400 mb-2">
      {label}
    </p>
    <p className="font-display text-3xl text-zinc-900 dark:text-zinc-50 leading-none">
      {value}
    </p>
  </div>
)

export default Home
