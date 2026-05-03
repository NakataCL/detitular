// Tarjeta de evento — banner por tipo + barra de cupos
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { MapPin, Users, Lock, Clock } from '../../utils/icons'
import { Badge, Button } from '../ui'
import { getEventStatus, getTimeRemaining } from '../../utils/helpers'
import { EVENT_TYPES, REGISTRATION_STATUS } from '../../utils/constants'
import { useMyWaitlist, useJoinWaitlist, useLeaveWaitlist } from '../../hooks/useWaitlist'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const EventCard = ({
  event,
  userRegistration = null,
  showActions = true,
  onRegister = null,
  isRegistering = false,
  compact = false
}) => {
  const navigate = useNavigate()

  const eventType = EVENT_TYPES[event.type] || EVENT_TYPES.otro
  const status = getEventStatus(event, userRegistration)
  const statusConfig = REGISTRATION_STATUS[status]
  const eventDate = event.date?.toDate ? event.date.toDate() : new Date(event.date)

  const max = event.maxSlots || 0
  const current = event.currentSlots || 0
  const free = Math.max(0, max - current)
  const fillPct = max > 0 ? Math.min(100, (current / max) * 100) : 0
  const freePct = max > 0 ? (free / max) * 100 : 0
  const fillColor =
    freePct <= 0 || freePct < 10
      ? 'bg-red-600'
      : freePct < 30
        ? 'bg-amber-500'
        : 'bg-emerald-500'

  const handleClick = () => {
    navigate(`/eventos/${event.id}`)
  }

  const handleRegister = (e) => {
    e.stopPropagation()
    if (onRegister) onRegister(event.id)
  }

  // Countdown corto solo si <48h
  const remaining = getTimeRemaining(event.date)
  const showShortCountdown =
    remaining && !remaining.expired && remaining.days < 2

  if (compact) {
    return (
      <motion.button
        type="button"
        onClick={handleClick}
        whileTap={{ scale: 0.995 }}
        aria-label={`Ver detalles de ${event.title}`}
        className="w-full text-left bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
      >
        <div className="flex items-stretch">
          {/* Strip vertical de color */}
          <div className={`w-1.5 flex-shrink-0 ${eventType.bannerClass}`} aria-hidden="true" />

          <div className="flex-1 min-w-0 p-4">
            <div className="flex items-start justify-between gap-3 mb-1">
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 break-words">
                {event.title}
              </h4>
              <Badge variant={status} size="sm">
                {statusConfig.label}
              </Badge>
            </div>

            <p className="text-xs uppercase tracking-wider font-bold text-zinc-500 dark:text-zinc-400 mb-3">
              {eventType.label} · {format(eventDate, "EEE d MMM · HH:mm'h'", { locale: es }).replace('.', '')}
            </p>

            {event.isPrivate && (
              <Badge variant="secondary" size="sm" className="mb-2">
                <Lock className="w-3 h-3" />
                Privado
              </Badge>
            )}

            <SlotBar
              free={free}
              current={current}
              max={max}
              fillPct={fillPct}
              fillColor={fillColor}
              compact
            />
          </div>
        </div>
      </motion.button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <button
        type="button"
        onClick={handleClick}
        aria-label={`Ver detalles de ${event.title}`}
        className="w-full text-left bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
      >
        {/* Banner por tipo */}
        <div
          className={`relative ${eventType.bannerClass} text-white px-5 h-16 flex items-center justify-between overflow-hidden`}
        >
          <span
            aria-hidden="true"
            className="font-display italic absolute right-2 -top-3 text-7xl leading-none text-white/10 select-none pointer-events-none"
          >
            {eventType.short}
          </span>
          <div className="relative">
            <p className="text-[10px] uppercase tracking-[0.18em] font-bold opacity-90">
              {eventType.label}
            </p>
            <p className="font-display text-xl leading-tight">
              {format(eventDate, 'EEE d MMM', { locale: es }).replace('.', '')}
            </p>
          </div>
          <div className="relative text-right">
            <p className="font-display text-xl leading-tight">
              {format(eventDate, "HH:mm'h'", { locale: es })}
            </p>
            {showShortCountdown && (
              <p className="text-[10px] uppercase tracking-widest font-bold opacity-90">
                {remaining.days > 0
                  ? `${remaining.days}d ${remaining.hours}h`
                  : `${remaining.hours}h ${remaining.minutes}m`}
              </p>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {event.title}
            </h3>
            <div className="flex items-center gap-1 flex-shrink-0">
              {event.isPrivate && (
                <Badge variant="secondary" size="sm">
                  <Lock className="w-3 h-3" />
                  Privado
                </Badge>
              )}
              <Badge variant={status} size="sm">
                {statusConfig.label}
              </Badge>
            </div>
          </div>

          {event.description && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 line-clamp-2">
              {event.description}
            </p>
          )}

          {event.location && (
            <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              <MapPin className="w-4 h-4" aria-hidden="true" />
              <span>{event.location}</span>
            </div>
          )}

          {/* Barra de cupos */}
          <SlotBar
            free={free}
            current={current}
            max={max}
            fillPct={fillPct}
            fillColor={fillColor}
          />
        </div>

        {/* Actions */}
        {showActions && (
          <div
            className="px-5 pb-5 pt-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
              {status === 'abierto' && !event.isPrivate && (
                <Button
                  fullWidth
                  onClick={handleRegister}
                  loading={isRegistering}
                  disabled={isRegistering}
                  className={eventType.ctaClass}
                >
                  Inscribirme
                </Button>
              )}

              {status === 'abierto' && event.isPrivate && (
                <Button fullWidth variant="secondary" disabled icon={Lock}>
                  Sólo por invitación
                </Button>
              )}

              {status === 'inscrito' && (
                <Button fullWidth variant="success" disabled icon={Users}>
                  Ya inscrito
                </Button>
              )}

              {status === 'lleno' && !event.isPrivate && (
                <WaitlistButton eventId={event.id} />
              )}

              {status === 'lleno' && event.isPrivate && (
                <Button fullWidth variant="secondary" disabled>
                  Cupos agotados
                </Button>
              )}

              {status === 'cerrado' && (
                <Button fullWidth variant="ghost" disabled>
                  Evento finalizado
                </Button>
              )}
            </div>
          </div>
        )}
      </button>
    </motion.div>
  )
}

const WaitlistButton = ({ eventId }) => {
  const { isAuthenticated } = useAuth()
  const { data: entries } = useMyWaitlist()
  const join = useJoinWaitlist()
  const leave = useLeaveWaitlist()

  const myEntry = (entries || []).find(e => e.eventId === eventId)

  if (!isAuthenticated) {
    return (
      <Button fullWidth variant="outline" icon={Clock} disabled>
        Inicia sesión para apuntarte
      </Button>
    )
  }

  if (myEntry) {
    return (
      <div className="flex flex-col gap-2">
        <Button fullWidth variant="secondary" icon={Clock} disabled>
          En lista de espera
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={async (e) => {
            e.stopPropagation()
            try {
              await leave.mutateAsync({ entryId: myEntry.id, eventId })
              toast.success('Saliste de la lista de espera')
            } catch {
              toast.error('No se pudo actualizar')
            }
          }}
          loading={leave.isPending}
          className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
        >
          Salir de la lista
        </Button>
      </div>
    )
  }

  return (
    <Button
      fullWidth
      variant="outline"
      icon={Clock}
      onClick={async (e) => {
        e.stopPropagation()
        try {
          await join.mutateAsync(eventId)
          toast.success('Apuntado a la lista de espera')
        } catch {
          toast.error('No se pudo apuntar')
        }
      }}
      loading={join.isPending}
    >
      Apúntame a la lista de espera
    </Button>
  )
}

const SlotBar = ({ free, current, max, fillPct, fillColor, compact = false }) => {
  if (max === 0) {
    return (
      <p className={`${compact ? 'text-xs' : 'text-sm'} text-zinc-500 dark:text-zinc-400`}>
        Sin cupo definido
      </p>
    )
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span
          className={`${compact ? 'text-xs' : 'text-sm'} font-semibold text-zinc-900 dark:text-zinc-50`}
        >
          {free === 0 ? 'Cupos agotados' : `${free} ${free === 1 ? 'cupo' : 'cupos'} disponibles`}
        </span>
        <span className={`${compact ? 'text-[10px]' : 'text-xs'} text-zinc-500 dark:text-zinc-400 tabular-nums`}>
          {current}/{max}
        </span>
      </div>
      <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${fillColor} transition-[width] duration-500`}
          style={{ width: `${fillPct}%` }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={`${free} cupos disponibles de ${max}`}
        />
      </div>
    </div>
  )
}

export default EventCard
