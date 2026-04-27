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
  Eye,
  Lock
} from '../../utils/icons'
import { Card, Button, Badge, EmptyState, Skeleton } from '../../components/ui'
import Input from '../../components/ui/Input'
import { EventForm, EventAttendeesManager } from '../../components/events'
import {
  useAllEvents,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent
} from '../../hooks/useEvents'
import { useAuth } from '../../context/AuthContext'
import { formatShortDate, formatSlots } from '../../utils/helpers'
import { migrateLegacyEvents } from '../../firebase/firestore'
import { EVENT_TYPES } from '../../utils/constants'
import toast from 'react-hot-toast'

const AdminEventos = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [viewingEventId, setViewingEventId] = useState(null)
  const [migrating, setMigrating] = useState(false)

  const { data: events, isLoading } = useAllEvents()
  const createEvent = useCreateEvent()
  const updateEvent = useUpdateEvent()
  const deleteEvent = useDeleteEvent()

  // Detectar eventos que necesitan backfill (no tienen isPrivate o registeredUserIds)
  const legacyCount = (events || []).filter(
    e => e.isPrivate === undefined || !Array.isArray(e.registeredUserIds)
  ).length

  const handleMigrate = async () => {
    if (!window.confirm(`Se actualizarán ${legacyCount} evento(s) con los nuevos campos de privacidad. ¿Continuar?`)) return
    setMigrating(true)
    try {
      const { migrated } = await migrateLegacyEvents()
      toast.success(`Migrados ${migrated} evento(s)`)
    } catch (error) {
      toast.error(error.message || 'Error en la migración')
    } finally {
      setMigrating(false)
    }
  }

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
    <div className="px-4 sm:px-6 md:px-12 pt-8 sm:pt-10 pb-12 md:pt-14 md:pb-20 max-w-6xl mx-auto">
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

      {/* Banner de migración — se auto-oculta cuando no hay eventos legacy */}
      {legacyCount > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Hay {legacyCount} evento(s) sin los campos de privacidad. Ejecuta la migración para habilitarlos.
          </p>
          <Button size="sm" variant="outline" loading={migrating} onClick={handleMigrate} className="flex-shrink-0">
            Migrar eventos antiguos
          </Button>
        </div>
      )}

      {/* Búsqueda */}
      <div className="mb-8">
        <Input
          type="search"
          placeholder="Buscar eventos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={Search}
          inputMode="search"
          autoComplete="off"
          enterKeyHint="search"
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

      {/* Gestor de inscritos (admin) */}
      {viewingEventId && (
        <EventAttendeesManager
          eventId={viewingEventId}
          onClose={() => setViewingEventId(null)}
        />
      )}
    </div>
  )
}

// Tarjeta de evento para admin
const EventAdminCard = ({ event, onEdit, onDelete, onViewRegistrations, onView }) => {
  const eventType = EVENT_TYPES[event.type] || EVENT_TYPES.otro
  const eventDate = event.date?.toDate ? event.date.toDate() : new Date(event.date)
  const isPast = eventDate < new Date()

  const actionButtons = (
    <div className="flex items-center gap-1">
      <button
        onClick={onViewRegistrations}
        className="p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400"
        title="Gestionar inscritos"
        aria-label="Gestionar inscritos"
      >
        <Users className="w-4 h-4" />
      </button>
      <button
        onClick={onView}
        className="p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400"
        title="Ver"
        aria-label="Ver evento"
      >
        <Eye className="w-4 h-4" />
      </button>
      <button
        onClick={onEdit}
        className="p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400"
        title="Editar"
        aria-label="Editar evento"
      >
        <Edit2 className="w-4 h-4" />
      </button>
      <button
        onClick={onDelete}
        className="p-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500"
        title="Eliminar"
        aria-label="Eliminar evento"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )

  const slotsButtonDesktop = (
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
  )

  const slotsButtonMobile = (
    <button
      onClick={onViewRegistrations}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
    >
      <Users className="w-3.5 h-3.5 text-primary-600" />
      <span className="text-sm font-bold text-primary-600">{formatSlots(event)}</span>
      <span className="text-xs text-zinc-400">inscritos</span>
    </button>
  )

  return (
    <Card>
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Fecha */}
        <div className={`flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center text-white ${eventType.bgClass}`}>
          <span className="text-lg font-bold">{eventDate.getDate()}</span>
          <span className="text-xs uppercase">
            {eventDate.toLocaleString('es', { month: 'short' })}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 break-words">
            {event.title}
          </h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant={event.type} size="sm">
              {eventType.label}
            </Badge>
            {event.isPrivate && (
              <Badge variant="secondary" size="sm">
                <Lock className="w-3 h-3" />
                Privado
              </Badge>
            )}
            {isPast && (
              <Badge variant="secondary" size="sm">
                Finalizado
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-x-4 gap-y-1 mt-2 text-sm text-zinc-400 flex-wrap">
            <span>{formatShortDate(event.date)}</span>
            <span className="break-words">{event.location || 'Sin ubicación'}</span>
          </div>

          {/* Mobile: acciones (arriba) + cupos compacto (abajo derecha) en stack */}
          <div className="mt-3 space-y-2 sm:hidden">
            <div className="flex justify-start">{actionButtons}</div>
            <div className="flex justify-end">{slotsButtonMobile}</div>
          </div>
        </div>

        {/* Desktop: acciones + cupos a la derecha */}
        <div className="hidden sm:flex items-start gap-2 flex-shrink-0">
          {actionButtons}
          {slotsButtonDesktop}
        </div>
      </div>
    </Card>
  )
}

export default AdminEventos
