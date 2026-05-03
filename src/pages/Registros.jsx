// Página "Mis convocatorias" — inscripciones del usuario por estado temporal
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Clock, MapPin, Check, X, AlertCircle } from '../utils/icons'
import { Button, EmptyState, Skeleton, Countdown } from '../components/ui'
import {
  useMyRegistrationsHydrated,
  useCancelRegistration
} from '../hooks/useRegistrations'
import { EVENT_TYPES } from '../utils/constants'
import toast from 'react-hot-toast'

const TABS = [
  { value: 'upcoming', label: 'Próximas' },
  { value: 'past', label: 'Pasadas' },
  { value: 'canceled', label: 'Canceladas' }
]

const Registros = () => {
  const navigate = useNavigate()
  const [tab, setTab] = useState('upcoming')
  const [cancelingId, setCancelingId] = useState(null)
  const cancelRegistration = useCancelRegistration()
  const { data: regs, isLoading } = useMyRegistrationsHydrated()

  const groups = useMemo(() => {
    const now = new Date()
    const upcoming = []
    const past = []
    const canceled = []

    for (const reg of regs) {
      if (reg.canceledAt) {
        canceled.push(reg)
        continue
      }
      if (!reg.event) continue
      const date = reg.event.date?.toDate
        ? reg.event.date.toDate()
        : new Date(reg.event.date)
      if (date >= now) upcoming.push(reg)
      else past.push(reg)
    }

    upcoming.sort(byDateAsc)
    past.sort(byDateDesc)
    return { upcoming, past, canceled }
  }, [regs])

  const counts = {
    upcoming: groups.upcoming.length,
    past: groups.past.length,
    canceled: groups.canceled.length
  }

  const handleCancel = async (registration) => {
    setCancelingId(registration.id)
    try {
      await cancelRegistration.mutateAsync({
        registrationId: registration.id,
        eventId: registration.eventId
      })
      toast.success('Inscripción cancelada')
    } catch {
      toast.error('Error al cancelar')
    } finally {
      setCancelingId(null)
    }
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton.EventCard key={i} />)}
        </div>
      )
    }

    const items = groups[tab]

    if (items.length === 0) {
      if (tab === 'canceled') {
        return (
          <EmptyState
            icon="registrations"
            title="Sin cancelaciones"
            description="Las inscripciones canceladas aparecerán aquí."
          />
        )
      }
      if (tab === 'past') {
        return (
          <EmptyState
            icon="registrations"
            title="Sin historial"
            description="Tus eventos pasados aparecerán aquí cuando finalicen."
          />
        )
      }
      return (
        <EmptyState
          icon="registrations"
          title="Sin convocatorias próximas"
          description="Aún no estás inscrito a eventos futuros."
          action={() => navigate('/eventos')}
          actionLabel="Ver eventos"
        />
      )
    }

    return (
      <div className="space-y-3">
        {items.map(reg =>
          tab === 'upcoming' ? (
            <UpcomingCard
              key={reg.id}
              registration={reg}
              onCancel={() => handleCancel(reg)}
              isCanceling={cancelingId === reg.id}
              onView={() => navigate(`/eventos/${reg.eventId}`)}
            />
          ) : tab === 'past' ? (
            <PastCard
              key={reg.id}
              registration={reg}
              onView={() => navigate(`/eventos/${reg.eventId}`)}
            />
          ) : (
            <CanceledCard
              key={reg.id}
              registration={reg}
            />
          )
        )}
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 md:px-12 pt-8 sm:pt-10 pb-12 md:pt-14 md:pb-20 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl text-zinc-900 dark:text-zinc-50 leading-tight">
          Mis convocatorias
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5">
          Tus inscripciones a eventos
        </p>
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Filtrar convocatorias"
        className="flex gap-2 mb-8 overflow-x-auto no-scrollbar"
      >
        {TABS.map(t => {
          const active = tab === t.value
          return (
            <button
              key={t.value}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                active
                  ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {t.label} <span className="opacity-60 tabular-nums">({counts[t.value]})</span>
            </button>
          )
        })}
      </div>

      {renderContent()}
    </div>
  )
}

const byDateAsc = (a, b) => {
  const da = a.event?.date?.toDate?.() || new Date(a.event?.date || 0)
  const db = b.event?.date?.toDate?.() || new Date(b.event?.date || 0)
  return da - db
}

const byDateDesc = (a, b) => -byDateAsc(a, b)

// === Cards ===

const UpcomingCard = ({ registration: reg, onCancel, isCanceling, onView }) => {
  const event = reg.event
  if (!event) return <UnknownEventCard />

  const eventType = EVENT_TYPES[event.type] || EVENT_TYPES.otro
  const eventDate = event.date?.toDate ? event.date.toDate() : new Date(event.date)
  const isAdminAdded = reg.registeredBy === 'admin'

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden"
    >
      <button
        type="button"
        onClick={onView}
        aria-label={`Ver ${event.title}`}
        className="w-full text-left"
      >
        <div className={`${eventType.bannerClass} text-white px-5 py-3 flex items-center justify-between`}>
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] font-bold opacity-90">
              {eventType.label}
            </p>
            <p className="font-display text-xl leading-tight">
              {format(eventDate, 'EEE d MMM', { locale: es }).replace('.', '')}
            </p>
          </div>
          <p className="font-display text-xl">
            {format(eventDate, "HH:mm'h'", { locale: es })}
          </p>
        </div>

        <div className="p-5">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
            {event.title}
          </h3>

          {event.location && (
            <p className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              <MapPin className="w-4 h-4" aria-hidden="true" />
              {event.location}
            </p>
          )}

          <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
            <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-zinc-500 dark:text-zinc-400">
              Empieza en
            </span>
            <Countdown.Inline targetDate={event.date} />
          </div>
        </div>
      </button>

      {!isAdminAdded && (
        <div className="px-5 pb-5">
          <Button
            size="sm"
            variant="ghost"
            onClick={onCancel}
            loading={isCanceling}
            icon={X}
            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            Cancelar inscripción
          </Button>
        </div>
      )}
      {isAdminAdded && (
        <p className="px-5 pb-5 text-xs text-zinc-500 dark:text-zinc-400">
          Te inscribió el administrador. Para darte de baja contáctalo directamente.
        </p>
      )}
    </motion.div>
  )
}

const PastCard = ({ registration: reg, onView }) => {
  const event = reg.event
  if (!event) return <UnknownEventCard />

  const eventDate = event.date?.toDate ? event.date.toDate() : new Date(event.date)

  return (
    <motion.button
      type="button"
      onClick={onView}
      whileTap={{ scale: 0.995 }}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      aria-label={`Ver ${event.title}`}
      className="w-full text-left bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl px-4 py-3 flex items-center gap-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
    >
      <div className="flex-shrink-0 text-center">
        <p className="font-display text-2xl text-zinc-900 dark:text-zinc-50 leading-none">
          {eventDate.getDate()}
        </p>
        <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 dark:text-zinc-400 mt-1">
          {format(eventDate, 'MMM', { locale: es }).replace('.', '')}
        </p>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">
          {event.title}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          {format(eventDate, "EEE · HH:mm'h'", { locale: es }).replace('.', '')}
        </p>
      </div>
      <AttendanceBadge attended={!!reg.attended} />
    </motion.button>
  )
}

const CanceledCard = ({ registration: reg }) => {
  const event = reg.event
  return (
    <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 flex items-center gap-3 opacity-70">
      <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
        <X className="w-4 h-4 text-zinc-500 dark:text-zinc-400" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 truncate">
          {event?.title || 'Evento'}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Cancelada
          {reg.canceledAt
            ? ` el ${format(
                reg.canceledAt?.toDate?.() || new Date(reg.canceledAt),
                "d MMM",
                { locale: es }
              )}`
            : ''}
        </p>
      </div>
    </div>
  )
}

const AttendanceBadge = ({ attended }) =>
  attended ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
      <Check className="w-3 h-3" aria-hidden="true" />
      Asistió
    </span>
  ) : (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
      No asistió
    </span>
  )

const UnknownEventCard = () => (
  <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 flex items-center gap-3 opacity-60">
    <AlertCircle className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
    <span className="text-sm text-zinc-500 dark:text-zinc-400">Evento no disponible</span>
  </div>
)

export default Registros
