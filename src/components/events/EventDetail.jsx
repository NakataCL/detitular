// Detalle completo de un evento
import { motion } from 'framer-motion'
import {
  Calendar,
  MapPin,
  Users,
  Share2,
  CalendarPlus,
  ArrowLeft,
  Lock,
  Clock,
  Image as ImageIcon,
  ArrowRight
} from '../../utils/icons'
import { useNavigate } from 'react-router-dom'
import { Card, Badge, Button, Countdown, Avatar } from '../ui'
import { formatDateTime, formatShortDate, formatSlots, getEventStatus } from '../../utils/helpers'
import { downloadICS } from '../../utils/calendar'
import { EVENT_TYPES, REGISTRATION_STATUS } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'
import {
  useMyWaitlistPosition,
  useJoinWaitlist,
  useLeaveWaitlist
} from '../../hooks/useWaitlist'
import { useAlbums } from '../../hooks/useAlbums'
import { AlbumCreateModal } from '../experiences'
import { useState } from 'react'
import { Plus } from '../../utils/icons'
import toast from 'react-hot-toast'

const EventDetail = ({
  event,
  registrations = [],
  userRegistration = null,
  onRegister,
  onCancelRegistration,
  isRegistering = false,
  isCanceling = false
}) => {
  const navigate = useNavigate()
  const { isAuthenticated, login, isAdmin } = useAuth()
  const { data: linkedAlbums = [] } = useAlbums({ eventId: event?.id })
  const linkedAlbum = linkedAlbums[0] || null
  const [createAlbumOpen, setCreateAlbumOpen] = useState(false)

  const eventType = EVENT_TYPES[event.type] || EVENT_TYPES.otro
  const status = getEventStatus(event, userRegistration)
  const statusConfig = REGISTRATION_STATUS[status]

  const handleShare = async () => {
    const shareData = {
      title: event.title,
      text: `${event.title} — ${formatShortDate(event.date)}`,
      url: window.location.href
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        if (err?.name !== 'AbortError') {
          console.error('Error al compartir:', err)
          toast.error('No se pudo compartir')
        }
      }
      return
    }

    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Enlace copiado')
    } catch {
      toast.error('No se pudo copiar el enlace')
    }
  }

  const handleAddToCalendar = () => {
    downloadICS(event)
    toast.success('Descargando archivo de calendario')
  }

  const handleRegister = async () => {
    if (!isAuthenticated) {
      try {
        await login()
        onRegister?.(event.id)
      } catch {
        toast.error('Debes iniciar sesión para inscribirte')
      }
      return
    }

    onRegister?.(event.id)
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div
        className={`relative h-44 md:h-56 rounded-2xl ${eventType.bgClass} flex items-end p-6 mb-6`}
      >
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2 bg-black/20 backdrop-blur rounded-xl text-white hover:bg-black/30 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
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
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            {event.title}
          </h1>
        </div>

        <Badge variant={status} size="lg" className="absolute top-4 right-4">
          {statusConfig.label}
        </Badge>
      </div>

      {/* Content */}
      <div className="space-y-8">
        {/* Countdown */}
        {status === 'abierto' && (
          <Card className="bg-zinc-50 dark:bg-zinc-800 border-0">
            <p className="text-xs text-zinc-400 uppercase tracking-wider text-center mb-3 font-medium">
              El evento comienza en
            </p>
            <Countdown targetDate={event.date} />
          </Card>
        )}

        {/* Event info */}
        <Card>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                <Calendar className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-400">Fecha y hora</p>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {formatDateTime(event.date)}
                </p>
              </div>
            </div>

            {event.location && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                  <MapPin className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                </div>
                <div>
                  <p className="text-xs text-zinc-400">Ubicación</p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {event.location}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                <Users className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-400">Cupos</p>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {formatSlots(event)} inscritos
                </p>
                {event.currentSlots < event.maxSlots && status === 'abierto' && (
                  <p className="text-xs text-primary-600 dark:text-primary-400 mt-0.5">
                    ¡Quedan {event.maxSlots - event.currentSlots} cupos!
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Description */}
        {event.description && (
          <Card>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider mb-3">
              Descripción
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 whitespace-pre-line leading-relaxed">
              {event.description}
            </p>
          </Card>
        )}

        {/* Galería del evento */}
        {linkedAlbum && (
          <Card hover onClick={() => navigate(`/experiencias/${linkedAlbum.id}`)} className="cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex-shrink-0">
                {linkedAlbum.coverUrl || linkedAlbum.previewUrls?.[0] ? (
                  <img
                    src={linkedAlbum.coverUrl || linkedAlbum.previewUrls[0]}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-400">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                  Galería del evento
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {linkedAlbum.itemCount || 0} {linkedAlbum.itemCount === 1 ? 'foto' : 'fotos'}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-400" />
            </div>
          </Card>
        )}

        {/* Sugerencia para admin: crear álbum si aún no hay */}
        {isAdmin && !linkedAlbum && (
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center flex-shrink-0">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  Crear álbum vacío para este evento
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Después podrás subir fotos vinculadas al evento.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={Plus}
                onClick={() => setCreateAlbumOpen(true)}
              >
                Crear
              </Button>
            </div>
          </Card>
        )}

        {/* Quick actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            icon={CalendarPlus}
            onClick={handleAddToCalendar}
            className="flex-1"
            size="sm"
          >
            Añadir a calendario
          </Button>
          <Button
            variant="outline"
            icon={Share2}
            onClick={handleShare}
            className="flex-1"
            size="sm"
          >
            Compartir
          </Button>
        </div>

        {/* Registration action */}
        <Card>
          {status === 'abierto' && !event.isPrivate && (
            <Button
              fullWidth
              size="lg"
              onClick={handleRegister}
              loading={isRegistering}
            >
              {isAuthenticated ? 'Inscribirme ahora' : 'Iniciar sesión para inscribirme'}
            </Button>
          )}

          {status === 'abierto' && event.isPrivate && (
            <div className="space-y-2 text-center py-2">
              <Button fullWidth size="lg" variant="secondary" disabled icon={Lock}>
                Evento privado — sólo por invitación
              </Button>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                El administrador gestiona las inscripciones a este evento.
              </p>
            </div>
          )}

          {status === 'inscrito' && (
            <div className="space-y-2">
              <Button fullWidth size="lg" variant="success" disabled>
                Ya estás inscrito
              </Button>
              {userRegistration?.registeredBy !== 'admin' && (
                <Button
                  fullWidth
                  variant="ghost"
                  onClick={() => onCancelRegistration?.(userRegistration)}
                  loading={isCanceling}
                >
                  Cancelar inscripción
                </Button>
              )}
              {userRegistration?.registeredBy === 'admin' && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
                  Te inscribió el administrador. Contactalo para dar de baja.
                </p>
              )}
            </div>
          )}

          {status === 'lleno' && !event.isPrivate && (
            <WaitlistAction eventId={event.id} isAuthenticated={isAuthenticated} />
          )}

          {status === 'lleno' && event.isPrivate && (
            <Button fullWidth size="lg" variant="secondary" disabled>
              Cupos agotados
            </Button>
          )}

          {status === 'cerrado' && (
            <Button fullWidth size="lg" variant="ghost" disabled>
              Evento finalizado
            </Button>
          )}
        </Card>

        {/* Modal de creación de álbum precargado con datos del evento */}
        <AlbumCreateModal
          isOpen={createAlbumOpen}
          onClose={() => setCreateAlbumOpen(false)}
          album={{
            title: event.title,
            category: event.type,
            date: event.date,
            eventId: event.id,
            isPublic: !event.isPrivate
          }}
        />

        {/* Attendees */}
        {registrations.length > 0 && (
          <Card>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider mb-4">
              Inscritos ({registrations.length})
            </h3>
            <div className="flex -space-x-2">
              {registrations.slice(0, 8).map((reg) => (
                <Avatar
                  key={reg.id}
                  src={reg.userPhoto}
                  name={reg.userName}
                  size="sm"
                  className="ring-2 ring-white dark:ring-zinc-900"
                />
              ))}
              {registrations.length > 8 && (
                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-medium text-zinc-600 dark:text-zinc-300 ring-2 ring-white dark:ring-zinc-900">
                  +{registrations.length - 8}
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

const WaitlistAction = ({ eventId, isAuthenticated }) => {
  const { entry, position, isLoading } = useMyWaitlistPosition(eventId)
  const join = useJoinWaitlist()
  const leave = useLeaveWaitlist()

  if (!isAuthenticated) {
    return (
      <div className="space-y-2 text-center">
        <Button fullWidth size="lg" variant="secondary" disabled icon={Clock}>
          Cupos agotados
        </Button>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Inicia sesión para apuntarte a la lista de espera.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <Button fullWidth size="lg" variant="secondary" disabled>
        Cargando...
      </Button>
    )
  }

  if (entry) {
    return (
      <div className="space-y-2">
        <Button fullWidth size="lg" variant="success" disabled icon={Clock}>
          En lista de espera {position ? `· #${position}` : ''}
        </Button>
        <Button
          fullWidth
          variant="ghost"
          onClick={async () => {
            try {
              await leave.mutateAsync({ entryId: entry.id, eventId })
              toast.success('Saliste de la lista de espera')
            } catch {
              toast.error('No se pudo actualizar')
            }
          }}
          loading={leave.isPending}
        >
          Salir de la lista
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2 text-center">
      <Button
        fullWidth
        size="lg"
        variant="outline"
        icon={Clock}
        onClick={async () => {
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
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Te avisaremos si se libera un cupo.
      </p>
    </div>
  )
}

export default EventDetail
