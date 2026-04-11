// Gestión de eventos (Admin)
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  Calendar,
  MoreVertical,
  Eye
} from '../../utils/icons'
import { Card, Button, Badge, EmptyState, Skeleton, Modal, Avatar } from '../../components/ui'
import Input from '../../components/ui/Input'
import { EventForm } from '../../components/events'
import {
  useAllEvents,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent
} from '../../hooks/useEvents'
import { useEventRegistrations, useMarkAttendance } from '../../hooks/useRegistrations'
import { useAuth } from '../../context/AuthContext'
import { formatShortDate, formatSlots } from '../../utils/helpers'
import { EVENT_TYPES } from '../../utils/constants'
import toast from 'react-hot-toast'

const AdminEventos = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [viewingEventId, setViewingEventId] = useState(null)

  const { data: events, isLoading } = useAllEvents()
  const createEvent = useCreateEvent()
  const updateEvent = useUpdateEvent()
  const deleteEvent = useDeleteEvent()

  // Filtrar eventos
  const filteredEvents = events?.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const handleCreateEvent = async (eventData) => {
    try {
      await createEvent.mutateAsync({
        eventData,
        userId: user.uid
      })
      toast.success('Evento creado exitosamente')
      setShowForm(false)
    } catch (error) {
      console.error('Error al crear evento:', error.code, error.message)
      toast.error('Error al crear evento')
    }
  }

  const handleUpdateEvent = async (eventData) => {
    try {
      await updateEvent.mutateAsync({
        eventId: editingEvent.id,
        data: eventData
      })
      toast.success('Evento actualizado')
      setEditingEvent(null)
    } catch (error) {
      toast.error('Error al actualizar evento')
    }
  }

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('¿Estás seguro de eliminar este evento?')) return

    try {
      await deleteEvent.mutateAsync(eventId)
      toast.success('Evento eliminado')
    } catch (error) {
      toast.error('Error al eliminar evento')
    }
  }

  return (
    <div className="px-6 md:px-12 pt-10 pb-12 md:pt-14 md:pb-20 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Gestión de Eventos
          </h1>
          <p className="text-zinc-400">Crea y administra los eventos de la academia</p>
        </div>
        <Button icon={Plus} onClick={() => setShowForm(true)}>
          Nuevo Evento
        </Button>
      </div>

      {/* Búsqueda */}
      <div className="mb-8">
        <Input
          placeholder="Buscar eventos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={Search}
        />
      </div>

      {/* Lista de eventos */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton.EventCard key={i} />
          ))}
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="space-y-4">
          {filteredEvents.map((event) => (
            <EventAdminCard
              key={event.id}
              event={event}
              onEdit={() => setEditingEvent(event)}
              onDelete={() => handleDeleteEvent(event.id)}
              onViewRegistrations={() => setViewingEventId(event.id)}
              onView={() => navigate(`/eventos/${event.id}`)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="events"
          title="Sin eventos"
          description={
            searchTerm
              ? 'No se encontraron eventos con esa búsqueda'
              : 'Aún no has creado ningún evento'
          }
          action={() => setShowForm(true)}
          actionLabel="Crear evento"
        />
      )}

      {/* Modal de crear evento */}
      <EventForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreateEvent}
        isLoading={createEvent.isPending}
      />

      {/* Modal de editar evento */}
      <EventForm
        isOpen={!!editingEvent}
        onClose={() => setEditingEvent(null)}
        onSubmit={handleUpdateEvent}
        initialData={editingEvent}
        isLoading={updateEvent.isPending}
      />

      {/* Modal de ver inscripciones */}
      <RegistrationsModal
        eventId={viewingEventId}
        onClose={() => setViewingEventId(null)}
      />
    </div>
  )
}

// Tarjeta de evento para admin
const EventAdminCard = ({ event, onEdit, onDelete, onViewRegistrations, onView }) => {
  const eventType = EVENT_TYPES[event.type] || EVENT_TYPES.otro
  const eventDate = event.date?.toDate ? event.date.toDate() : new Date(event.date)
  const isPast = eventDate < new Date()

  return (
    <Card>
      <div className="flex items-start gap-4">
        {/* Fecha */}
        <div className={`flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center text-white ${eventType.bgClass}`}>
          <span className="text-lg font-bold">{eventDate.getDate()}</span>
          <span className="text-xs uppercase">
            {eventDate.toLocaleString('es', { month: 'short' })}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                {event.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={event.type} size="sm">
                  {eventType.label}
                </Badge>
                {isPast && (
                  <Badge variant="secondary" size="sm">
                    Finalizado
                  </Badge>
                )}
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-1">
              <button
                onClick={onView}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400"
                title="Ver"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={onEdit}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400"
                title="Editar"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={onDelete}
                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-2 text-sm text-zinc-400">
            <span>{formatShortDate(event.date)}</span>
            <span>{event.location || 'Sin ubicación'}</span>
          </div>
        </div>

        {/* Cupos */}
        <button
          onClick={onViewRegistrations}
          className="flex-shrink-0 text-center p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <div className="flex items-center gap-1 text-primary-600 mb-1">
            <Users className="w-4 h-4" />
            <span className="font-bold">{formatSlots(event)}</span>
          </div>
          <span className="text-xs text-zinc-400">inscritos</span>
        </button>
      </div>
    </Card>
  )
}

// Modal de inscripciones
const RegistrationsModal = ({ eventId, onClose }) => {
  const { data: registrations, isLoading } = useEventRegistrations(eventId)
  const markAttendance = useMarkAttendance()

  const handleToggleAttendance = async (registration) => {
    try {
      await markAttendance.mutateAsync({
        registrationId: registration.id,
        attended: !registration.attended,
        eventId
      })
    } catch (error) {
      toast.error('Error al actualizar asistencia')
    }
  }

  return (
    <Modal
      isOpen={!!eventId}
      onClose={onClose}
      title="Lista de Inscritos"
      size="lg"
    >
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton.UserItem key={i} />
          ))}
        </div>
      ) : registrations?.length > 0 ? (
        <div className="space-y-2">
          {registrations.map((reg, index) => (
            <div
              key={reg.id}
              className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm text-zinc-400 w-6">{index + 1}</span>
                <Avatar src={reg.userPhoto} name={reg.userName} size="sm" />
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {reg.userName}
                  </p>
                  <p className="text-xs text-zinc-400">{reg.userEmail}</p>
                </div>
              </div>

              <button
                onClick={() => handleToggleAttendance(reg)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  reg.attended
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400'
                }`}
              >
                {reg.attended ? '✓ Asistió' : 'Marcar asistencia'}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="users"
          title="Sin inscritos"
          description="Aún no hay jugadores inscritos en este evento"
        />
      )}
    </Modal>
  )
}

export default AdminEventos
