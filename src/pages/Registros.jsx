// Página de inscripciones/registros del usuario
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, MapPin, Check, X, AlertCircle } from '../utils/icons'
import { Card, Badge, Button, EmptyState, Skeleton } from '../components/ui'
import { useMyRegistrations, useCancelRegistration } from '../hooks/useRegistrations'
import { useEvent } from '../hooks/useEvents'
import { formatShortDate } from '../utils/helpers'
import { EVENT_TYPES } from '../utils/constants'
import toast from 'react-hot-toast'

const Registros = () => {
  const navigate = useNavigate()
  const { data: registrations, isLoading } = useMyRegistrations()
  const [cancelingId, setCancelingId] = useState(null)
  const cancelRegistration = useCancelRegistration()

  const handleCancel = async (registration) => {
    setCancelingId(registration.id)
    try {
      await cancelRegistration.mutateAsync({
        registrationId: registration.id,
        eventId: registration.eventId
      })
      toast.success('Inscripción cancelada')
    } catch (error) {
      toast.error('Error al cancelar')
    } finally {
      setCancelingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="px-5 py-6 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton.EventCard key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="px-6 md:px-12 pt-10 pb-12 md:pt-14 md:pb-20 max-w-3xl mx-auto">
      <div className="mb-10">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
          Mis Inscripciones
        </h1>
        <p className="text-sm text-zinc-400 mt-1.5">
          {registrations?.length || 0} inscripciones
        </p>
      </div>

      {registrations?.length === 0 ? (
        <EmptyState
          icon="registrations"
          title="Sin inscripciones"
          description="Aún no te has inscrito a ningún evento"
          action={() => navigate('/eventos')}
          actionLabel="Ver eventos"
        />
      ) : (
        <div className="space-y-5">
          {registrations?.map((registration) => (
            <RegistrationCard
              key={registration.id}
              registration={registration}
              onCancel={() => handleCancel(registration)}
              isCanceling={cancelingId === registration.id}
              onViewEvent={() => navigate(`/eventos/${registration.eventId}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const RegistrationCard = ({
  registration,
  onCancel,
  isCanceling,
  onViewEvent
}) => {
  const { data: event, isLoading } = useEvent(registration.eventId)

  if (isLoading) {
    return <Skeleton.EventCard />
  }

  if (!event) {
    return (
      <Card className="opacity-50">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-zinc-400" />
          <span className="text-sm text-zinc-400">Evento no disponible</span>
        </div>
      </Card>
    )
  }

  const eventType = EVENT_TYPES[event.type] || EVENT_TYPES.otro
  const eventDate = event.date?.toDate ? event.date.toDate() : new Date(event.date)
  const isPast = eventDate < new Date()

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
    >
      <Card hover onClick={onViewEvent} className="cursor-pointer">
        <div className="flex items-start gap-3">
          {/* Date */}
          <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center text-white text-xs font-semibold ${eventType.bgClass}`}>
            <span className="text-base font-bold leading-none">
              {eventDate.getDate()}
            </span>
            <span className="text-xs uppercase opacity-80">
              {eventDate.toLocaleString('es', { month: 'short' })}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                {event.title}
              </h3>
              {registration.attended && (
                <Badge variant="success" size="sm">
                  <Check className="w-3 h-3 mr-1" />
                  Asistió
                </Badge>
              )}
            </div>

            <div className="space-y-1 text-xs text-zinc-400">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatShortDate(event.date)}</span>
              </div>
              {event.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="truncate">{event.location}</span>
                </div>
              )}
            </div>

            {!isPast && (
              <div className="mt-3">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    onCancel()
                  }}
                  loading={isCanceling}
                  className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 px-2"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Cancelar
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

export default Registros
