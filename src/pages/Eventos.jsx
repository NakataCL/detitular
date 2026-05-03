// Página de Eventos
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, List, Search } from '../utils/icons'
import { Button, EmptyState, Skeleton } from '../components/ui'
import Input from '../components/ui/Input'
import { EventCard, EventCalendar, RegistrationConfirmSheet } from '../components/events'
import { useActiveEvents } from '../hooks/useEvents'
import { useMyRegistrations, useCreateRegistration } from '../hooks/useRegistrations'
import { useAuth } from '../context/AuthContext'
import { EVENT_TYPES } from '../utils/constants'
import toast from 'react-hot-toast'

const Eventos = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [viewMode, setViewMode] = useState('list')
  const [filterType, setFilterType] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [confirmedEvent, setConfirmedEvent] = useState(null)

  const { data: events, isLoading, error } = useActiveEvents()
  const { data: myRegistrations } = useMyRegistrations()
  const createRegistration = useCreateRegistration()

  const userRegistrationsMap = myRegistrations?.reduce((acc, reg) => {
    acc[reg.eventId] = reg
    return acc
  }, {}) || {}

  const filteredEvents = events?.filter(event => {
    const matchesType = filterType === 'all' || event.type === filterType
    const matchesSearch = !searchTerm ||
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesType && matchesSearch
  }) || []

  const handleRegister = async (eventId) => {
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión para inscribirte')
      return
    }

    try {
      await createRegistration.mutateAsync(eventId)
      toast.success('¡Inscripción exitosa!')
      const event = events?.find(e => e.id === eventId)
      if (event) setConfirmedEvent(event)
    } catch (error) {
      toast.error(error.message || 'Error al inscribirse')
    }
  }

  const handleEventClick = (event) => {
    navigate(`/eventos/${event.id}`)
  }

  return (
    <div className="px-4 sm:px-6 md:px-12 pt-8 sm:pt-10 pb-12 md:pt-14 md:pb-20 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
          Eventos
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">Encuentra y participa en actividades</p>
      </div>

      {/* Search & Filters */}
      <div className="space-y-5 mb-12">
        <div className="flex items-center gap-2">
          <div className="flex-1">
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

          {/* View toggle */}
          <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-50'
                  : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-50'
                  : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <Calendar className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          <FilterChip
            active={filterType === 'all'}
            onClick={() => setFilterType('all')}
          >
            Todos
          </FilterChip>
          {Object.entries(EVENT_TYPES).map(([key, { label }]) => (
            <FilterChip
              key={key}
              active={filterType === key}
              onClick={() => setFilterType(key)}
            >
              {label}
            </FilterChip>
          ))}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {viewMode === 'list' ? (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            {error ? (
              <EmptyState
                icon="events"
                title="Error al cargar eventos"
                description={error.message}
              />
            ) : isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton.EventCard key={i} />
              ))
            ) : filteredEvents.length > 0 ? (
              filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  userRegistration={userRegistrationsMap[event.id]}
                  onRegister={handleRegister}
                  isRegistering={createRegistration.isPending}
                />
              ))
            ) : (
              <EmptyState
                icon="events"
                title="No hay eventos"
                description={
                  searchTerm || filterType !== 'all'
                    ? 'No se encontraron eventos con esos filtros'
                    : 'No hay eventos disponibles en este momento'
                }
              />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="calendar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <EventCalendar
              events={events}
              isLoading={isLoading}
              onEventClick={handleEventClick}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <RegistrationConfirmSheet
        event={confirmedEvent}
        isOpen={!!confirmedEvent}
        onClose={() => setConfirmedEvent(null)}
      />
    </div>
  )
}

const FilterChip = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
      active
        ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900'
        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
    }`}
  >
    {children}
  </button>
)

export default Eventos
