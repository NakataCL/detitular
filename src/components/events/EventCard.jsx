// Tarjeta de evento
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, MapPin, Users, Clock, ArrowRight, Lock } from '../../utils/icons'
import { Card, Badge, Button, Countdown } from '../ui'
import { formatShortDate, formatSlots, getEventStatus } from '../../utils/helpers'
import { EVENT_TYPES, REGISTRATION_STATUS } from '../../utils/constants'

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

  const handleClick = () => {
    navigate(`/eventos/${event.id}`)
  }

  const handleRegister = (e) => {
    e.stopPropagation()
    if (onRegister) {
      onRegister(event.id)
    }
  }

  if (compact) {
    return (
      <Card hover onClick={handleClick} className="cursor-pointer">
        <div className="flex items-center gap-4">
          {/* Date indicator */}
          <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center text-white text-xs font-semibold flex-shrink-0 ${eventType.bgClass}`}>
            {formatShortDate(event.date).split(',')[0]}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-50 break-words mb-2">
              {event.title}
            </h4>
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <Clock className="w-3 h-3" />
              <span>{formatShortDate(event.date)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1">
              <Users className="w-3 h-3" />
              <span>
                {formatSlots(event)} cupos
                {' · '}
                {(event.currentSlots || 0) >= event.maxSlots
                  ? 'Cupos agotados'
                  : `Quedan ${event.maxSlots - (event.currentSlots || 0)}`}
              </span>
            </div>
          </div>

          {/* Status badges */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <Badge variant={status} size="sm">
              {statusConfig.label}
            </Badge>
            {event.isPrivate && (
              <Badge variant="secondary" size="sm">
                <Lock className="w-3 h-3" />
                Privado
              </Badge>
            )}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card hover onClick={handleClick} className="cursor-pointer">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Badge variant={event.type}>
              {eventType.label}
            </Badge>
            {event.isPrivate && (
              <Badge variant="secondary" size="sm">
                <Lock className="w-3 h-3" />
                Privado
              </Badge>
            )}
          </div>
          <Badge variant={status}>
            {statusConfig.label}
          </Badge>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {event.title}
        </h3>

        {/* Description */}
        {event.description && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5 line-clamp-2">
            {event.description}
          </p>
        )}

        {/* Event info */}
        <div className="space-y-2.5 mb-5">
          <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <Calendar className="w-4 h-4 text-zinc-400" />
            <span>{formatShortDate(event.date)}</span>
          </div>

          {event.location && (
            <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
              <MapPin className="w-4 h-4 text-zinc-400" />
              <span>{event.location}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <Users className="w-4 h-4 text-zinc-400" />
            <span>{formatSlots(event)} cupos</span>
          </div>
        </div>

        {/* Countdown */}
        {status === 'abierto' && (
          <div className="mb-5 py-3 px-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 uppercase tracking-wider font-medium">
                Comienza en
              </span>
              <Countdown.Inline targetDate={event.date} />
            </div>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            {status === 'abierto' && !event.isPrivate && (
              <Button
                fullWidth
                onClick={handleRegister}
                loading={isRegistering}
                disabled={isRegistering}
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

            {status === 'lleno' && (
              <Button fullWidth variant="secondary" disabled>
                Cupos agotados
              </Button>
            )}

            {status === 'cerrado' && (
              <Button fullWidth variant="ghost" disabled>
                Evento finalizado
              </Button>
            )}

            <Button
              variant="ghost"
              icon={ArrowRight}
              onClick={handleClick}
              className="flex-shrink-0"
            />
          </div>
        )}
      </Card>
    </motion.div>
  )
}

export default EventCard
