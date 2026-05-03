// Hoja de confirmación post-inscripción con .ics + ubicación
import { CheckCircle, CalendarPlus, MapPin, AlertCircle } from '../../utils/icons'
import { Modal, Button } from '../ui'
import { downloadICS } from '../../utils/calendar'
import { buildGeoLink } from '../../utils/geo'
import { formatDateTime } from '../../utils/helpers'

const RegistrationConfirmSheet = ({ event, isOpen, onClose }) => {
  if (!event) return null

  const geoLink = buildGeoLink(event.location)

  const handleAddToCalendar = () => {
    downloadICS(event)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      bottomSheet
      size="md"
      showClose={false}
    >
      <div className="flex flex-col items-center text-center pt-2 pb-4">
        <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mb-4">
          <CheckCircle className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
        </div>

        <h2 className="font-display text-3xl text-zinc-900 dark:text-zinc-50 leading-tight mb-1">
          ¡Ya estás convocado!
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
          Te inscribiste a <span className="font-semibold text-zinc-900 dark:text-zinc-50">{event.title}</span>
        </p>

        {/* Datos del evento */}
        <dl className="w-full text-left space-y-3 mb-6 px-1">
          <DataRow label="Cuándo" value={formatDateTime(event.date)} />
          {event.location && <DataRow label="Dónde" value={event.location} />}
        </dl>

        {/* Acciones */}
        <div className="w-full flex flex-col sm:flex-row gap-2 mb-3">
          <Button
            fullWidth
            variant="outline"
            icon={CalendarPlus}
            onClick={handleAddToCalendar}
          >
            Añadir al calendario
          </Button>
          {geoLink && (
            <Button
              fullWidth
              variant="outline"
              icon={MapPin}
              onClick={() => window.open(geoLink, '_blank', 'noopener,noreferrer')}
            >
              Ver ubicación
            </Button>
          )}
        </div>

        {/* Instrucciones */}
        {event.instructions && (
          <div className="w-full mb-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 flex gap-2 text-left">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-300 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed whitespace-pre-line">
              {event.instructions}
            </p>
          </div>
        )}

        <Button fullWidth onClick={onClose}>
          Listo
        </Button>
      </div>
    </Modal>
  )
}

const DataRow = ({ label, value }) => (
  <div className="flex flex-col gap-0.5 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
    <dt className="text-[10px] uppercase tracking-[0.18em] font-bold text-zinc-500 dark:text-zinc-400">
      {label}
    </dt>
    <dd className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
      {value}
    </dd>
  </div>
)

export default RegistrationConfirmSheet
