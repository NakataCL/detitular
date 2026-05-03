// Bottom-sheet para reservar las sesiones restantes del plan en eventos compatibles
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Modal, Button, EmptyState } from '../ui'
import { useCreateRegistration } from '../../hooks/useRegistrations'
import { EVENT_TYPES } from '../../utils/constants'
import toast from 'react-hot-toast'

const PlanReserveSheet = ({
  isOpen,
  onClose,
  events = [],
  sessionsRemaining
}) => {
  const createRegistration = useCreateRegistration()
  const [selected, setSelected] = useState(() => new Set())

  // Preseleccionar las primeras N (donde N = sesiones restantes)
  useEffect(() => {
    if (!isOpen) return
    const initial = new Set(events.slice(0, sessionsRemaining).map(e => e.id))
    setSelected(initial)
  }, [isOpen, events, sessionsRemaining])

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (next.size < sessionsRemaining) next.add(id)
      return next
    })
  }

  const handleReserve = async () => {
    const ids = Array.from(selected)
    if (ids.length === 0) return

    const results = await Promise.allSettled(
      ids.map(id => createRegistration.mutateAsync(id))
    )

    const ok = results.filter(r => r.status === 'fulfilled').length
    const failed = results.length - ok

    if (ok > 0 && failed === 0) {
      toast.success(`Reservaste ${ok} ${ok === 1 ? 'evento' : 'eventos'}`)
    } else if (ok > 0 && failed > 0) {
      toast.success(`Reservaste ${ok} de ${ok + failed}`)
      toast.error(`${failed} no se pudieron reservar (quizá llenos)`)
    } else {
      toast.error('No se pudo reservar ninguno. Intenta de nuevo.')
    }
    onClose()
  }

  const remainingSlots = sessionsRemaining - selected.size
  const isPending = createRegistration.isPending

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      bottomSheet
      size="md"
      title="Reservar sesiones del plan"
      footer={
        <div className="flex flex-col gap-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center tabular-nums">
            {selected.size} de {sessionsRemaining} {sessionsRemaining === 1 ? 'sesión' : 'sesiones'} seleccionadas
            {remainingSlots > 0 && ` · ${remainingSlots} disponibles`}
          </p>
          <Button
            fullWidth
            disabled={selected.size === 0 || isPending}
            loading={isPending}
            onClick={handleReserve}
          >
            {selected.size > 1 ? 'Reservar todas' : 'Reservar'}
          </Button>
        </div>
      }
    >
      {events.length === 0 ? (
        <EmptyState
          icon="events"
          title="Sin eventos compatibles"
          description="No hay eventos abiertos antes del vencimiento de tu plan."
        />
      ) : (
        <ul className="space-y-2">
          {events.map((event) => (
            <ReserveRow
              key={event.id}
              event={event}
              selected={selected.has(event.id)}
              disabled={!selected.has(event.id) && selected.size >= sessionsRemaining}
              onToggle={() => toggle(event.id)}
            />
          ))}
        </ul>
      )}
    </Modal>
  )
}

const ReserveRow = ({ event, selected, disabled, onToggle }) => {
  const eventType = EVENT_TYPES[event.type] || EVENT_TYPES.otro
  const eventDate = event.date?.toDate ? event.date.toDate() : new Date(event.date)
  const free = (event.maxSlots || 0) - (event.currentSlots || 0)

  return (
    <li>
      <label
        className={`flex items-center gap-3 p-3 rounded-2xl border transition-colors cursor-pointer ${
          selected
            ? 'border-zinc-900 dark:border-zinc-50 bg-zinc-50 dark:bg-zinc-800/50'
            : disabled
              ? 'border-zinc-200 dark:border-zinc-800 opacity-50 cursor-not-allowed'
              : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
        }`}
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          disabled={disabled}
          className="w-4 h-4 accent-red-700 cursor-pointer disabled:cursor-not-allowed"
          aria-label={`Reservar ${event.title}`}
        />

        <div className={`flex-shrink-0 w-10 h-10 rounded-lg text-white flex flex-col items-center justify-center ${eventType.bannerClass}`}>
          <span className="font-display text-base leading-none">{eventDate.getDate()}</span>
          <span className="text-[8px] uppercase tracking-wider font-bold">
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
      </label>
    </li>
  )
}

export default PlanReserveSheet
