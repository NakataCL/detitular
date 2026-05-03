// Página de detalle de evento
import { useParams, useNavigate } from 'react-router-dom'
import { EventDetail } from '../components/events'
import { Spinner } from '../components/ui'
import { useEvent } from '../hooks/useEvents'
import {
  useEventRegistrations,
  useUserEventRegistration,
  useCreateRegistration,
  useCancelRegistration
} from '../hooks/useRegistrations'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const EventoDetalle = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const { data: event, isLoading: loadingEvent } = useEvent(id)
  const { data: registrations } = useEventRegistrations(id)
  const { data: userRegistration } = useUserEventRegistration(id)

  const createRegistration = useCreateRegistration()
  const cancelRegistration = useCancelRegistration()

  const handleRegister = async () => {
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión para inscribirte')
      return
    }

    try {
      await createRegistration.mutateAsync(id)
      toast.success('¡Te has inscrito exitosamente!')
    } catch (error) {
      toast.error(error.message || 'Error al inscribirse')
    }
  }

  const handleCancelRegistration = async (registration) => {
    if (!registration) return

    try {
      await cancelRegistration.mutateAsync({
        registrationId: registration.id,
        eventId: id,
        userId: registration.userId
      })
      toast.success('Inscripción cancelada')
    } catch (error) {
      toast.error('Error al cancelar inscripción')
    }
  }

  if (loadingEvent) {
    return <Spinner fullScreen />
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          Evento no encontrado
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
          El evento que buscas no existe o ha sido eliminado
        </p>
        <button
          onClick={() => navigate('/eventos')}
          className="text-sm text-primary-600 hover:underline"
        >
          Volver a eventos
        </button>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 md:px-12 pt-8 sm:pt-10 pb-12 md:pt-14 md:pb-20 max-w-3xl mx-auto">
      <EventDetail
        event={event}
        registrations={registrations || []}
        userRegistration={userRegistration}
        onRegister={handleRegister}
        onCancelRegistration={handleCancelRegistration}
        isRegistering={createRegistration.isPending}
        isCanceling={cancelRegistration.isPending}
      />
    </div>
  )
}

export default EventoDetalle
