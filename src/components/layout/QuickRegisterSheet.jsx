// Bottom-sheet de inscripción rápida — abre desde el FAB del BottomNav
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar, ArrowRight, Lock } from '../../utils/icons'
import { Modal, Button, Skeleton } from '../ui'
import { useActiveEvents } from '../../hooks/useEvents'
import {
  useMyRegistrations,
  useCreateRegistration
} from '../../hooks/useRegistrations'
import { useAuth } from '../../context/AuthContext'
import { EVENT_TYPES } from '../../utils/constants'
import toast from 'react-hot-toast'

const QuickRegisterSheet = ({ isOpen, onClose, onRegistered }) => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { data: events, isLoading } = useActiveEvents()
  const { data: regs } = useMyRegistrations()
  const createRegistration = useCreateRegistration()

  const registeredIds = new Set((regs || []).map(r => r.eventId))

  const candidates = (events || [])
    .filter(e => !e.isPrivate && !registeredIds.has(e.id))
    .filter(e => (e.currentSlots || 0) < (e.maxSlots || 0))
    .slice(0, 3)

  const handleRegister = async (event) => {
    if (!isAuthenticated) {
      onClose()
      navigate('/login', { state: { from: { pathname: '/' } } })
      return
    }
    try {
      await createRegistration.mutateAsync(event.id)
      toast.success('¡Inscripción exitosa!')
      onRegistered?.(event)
    } catch (error) {
      toast.error(error.message || 'Error al inscribirse')
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      bottomSheet
      size="md"
      title="Inscripción rápida"
    >
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton.EventCard key={i} />)}
        </div>
      ) : candidates.length === 0 ? (
        <div className="py-8 text-center">
          <Calendar className="w-9 h-9 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            No hay eventos abiertos en este momento.
          </p>
          <Button
            variant="outline"
            size="sm"
            icon={ArrowRight}
            iconPosition="right"
            onClick={() => {
              onClose()
              navigate('/eventos')
            }}
          >
            Ver todos los eventos
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {candidates.map((event) => (
            <QuickRow
              key={event.id}
              event={event}
              onRegister={() => handleRegister(event)}
              isRegistering={createRegistration.isPending}
            />
          ))}
          <Button
            fullWidth
            variant="ghost"
            size="sm"
            icon={ArrowRight}
            iconPosition="right"
            onClick={() => {
              onClose()
              navigate('/eventos')
            }}
            className="mt-2"
          >
            Ver todos los eventos
          </Button>
        </div>
      )}
    </Modal>
  )
}

const QuickRow = ({ event, onRegister, isRegistering }) => {
  const eventType = EVENT_TYPES[event.type] || EVENT_TYPES.otro
  const eventDate = event.date?.toDate ? event.date.toDate() : new Date(event.date)
  const free = (event.maxSlots || 0) - (event.currentSlots || 0)

  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800">
      <div className={`flex-shrink-0 w-12 h-12 rounded-xl text-white flex flex-col items-center justify-center ${eventType.bannerClass}`}>
        <span className="font-display text-lg leading-none">{eventDate.getDate()}</span>
        <span className="text-[9px] uppercase tracking-wider font-bold">
          {format(eventDate, 'MMM', { locale: es }).replace('.', '')}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">
          {event.title}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          {format(eventDate, "EEE · HH:mm'h'", { locale: es }).replace('.', '')} · {free} {free === 1 ? 'cupo' : 'cupos'}
        </p>
      </div>
      {event.isPrivate ? (
        <Button size="sm" variant="secondary" disabled icon={Lock}>
          Privado
        </Button>
      ) : (
        <Button
          size="sm"
          onClick={onRegister}
          loading={isRegistering}
          className={eventType.ctaClass}
        >
          Inscribirme
        </Button>
      )}
    </div>
  )
}

export default QuickRegisterSheet
