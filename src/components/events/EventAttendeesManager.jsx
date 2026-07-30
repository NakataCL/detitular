// Modal admin para gestionar inscritos de un evento (ver, añadir, remover, marcar asistencia)
// y cerrar la lista publicando la convocatoria con el criterio elegido.
import { Fragment, useMemo, useState } from 'react'
import { Search, Trash2, Plus, Lock } from '../../utils/icons'
import { Modal, Button, Avatar, EmptyState, Skeleton, Badge, ConfirmModal } from '../ui'
import Input, { Select } from '../ui/Input'
import {
  useEventRegistrations,
  useMarkAttendance,
  useAdminAddUserToEvent,
  useAdminRemoveUserFromEvent,
  useTrainingCounts,
  usePublishConvocatoria
} from '../../hooks/useRegistrations'
import { useAllUsers } from '../../hooks/usePlayer'
import { useEvent } from '../../hooks/useEvents'
import { rankRegistrations, formatDate, formatPhone, userContact } from '../../utils/helpers'
import {
  ATTENDANCE_WINDOWS,
  DEFAULT_ATTENDANCE_WINDOW,
  SELECTION_MODES,
  DEFAULT_SELECTION_MODE,
  GOALKEEPER_SLOTS
} from '../../utils/constants'
import toast from 'react-hot-toast'

const selectionModeOptions = Object.entries(SELECTION_MODES).map(([value, { label }]) => ({
  value,
  label
}))

const attendanceWindowOptions = Object.entries(ATTENDANCE_WINDOWS).map(([value, { label }]) => ({
  value,
  label
}))

const EventAttendeesManager = ({ eventId, onClose }) => {
  const [tab, setTab] = useState('inscritos')
  const [searchTerm, setSearchTerm] = useState('')
  const [pendingRemove, setPendingRemove] = useState(null)
  const [pendingPublish, setPendingPublish] = useState(false)

  const { data: event } = useEvent(eventId)
  const { data: registrations, isLoading: loadingRegs } = useEventRegistrations(eventId)
  const { data: allUsers, isLoading: loadingUsers } = useAllUsers()

  const markAttendance = useMarkAttendance()
  const addUser = useAdminAddUserToEvent()
  const removeUser = useAdminRemoveUserFromEvent()
  const publish = usePublishConvocatoria()

  // Criterio de cierre: se elige aquí, no al crear el evento. Si ya se publicó,
  // arranca con el criterio usado la última vez.
  const [mode, setMode] = useState(null)
  const [windowKey, setWindowKey] = useState(null)
  const selectionMode = mode ?? event?.selectionMode ?? DEFAULT_SELECTION_MODE
  const attendanceWindow = windowKey ?? event?.attendanceWindow ?? DEFAULT_ATTENDANCE_WINDOW
  const byTraining = selectionMode === 'entrenamiento'

  const { data: trainingCounts, isLoading: loadingCounts } = useTrainingCounts(
    attendanceWindow,
    byTraining && !!eventId
  )

  // La posición viene del perfil: los arqueros se convocan aparte.
  const positions = useMemo(
    () => Object.fromEntries((allUsers || []).map(u => [u.id, u.posicionPrincipal])),
    [allUsers]
  )

  const rows = useMemo(
    () =>
      rankRegistrations(registrations || [], {
        mode: selectionMode,
        trainingCounts: trainingCounts || {},
        maxSlots: event?.maxSlots || 0,
        positions
      }),
    [registrations, selectionMode, trainingCounts, event?.maxSlots, positions]
  )

  const goalkeepers = rows.filter(r => r.isGoalkeeper)
  const fieldPlayers = rows.filter(r => !r.isGoalkeeper)

  const published = !!event?.convocatoriaPublishedAt
  // La convocatoria publicada queda desactualizada si entró o salió alguien,
  // o si el admin cambió el criterio sin volver a publicar.
  const isStale =
    published &&
    (event.convocatoriaCount !== registrations?.length ||
      event.selectionMode !== selectionMode ||
      (byTraining && event.attendanceWindow !== attendanceWindow) ||
      (registrations || []).some(r => r.selectionRank === undefined))

  const handlePublish = async () => {
    setPendingPublish(false)
    try {
      await publish.mutateAsync({
        eventId,
        ranked: rows,
        selectionMode,
        attendanceWindow
      })
      toast.success('Convocatoria publicada')
    } catch {
      toast.error('No se pudo publicar la convocatoria')
    }
  }

  const eligibleUsers = useMemo(() => {
    if (!allUsers || !registrations) return []
    const registeredIds = new Set(registrations.map(r => r.userId))
    const term = searchTerm.toLowerCase()
    return allUsers
      .filter(u => !registeredIds.has(u.id) && !u.disabled)
      .filter(u => {
        if (!term) return true
        return (
          u.nombre?.toLowerCase().includes(term) ||
          u.displayName?.toLowerCase().includes(term) ||
          u.email?.toLowerCase().includes(term) ||
          u.telefono?.includes(term.replace(/\D/g, ''))
        )
      })
  }, [allUsers, registrations, searchTerm])

  const handleToggleAttendance = async (registration) => {
    try {
      await markAttendance.mutateAsync({
        registrationId: registration.id,
        attended: !registration.attended,
        eventId,
        userId: registration.userId
      })
    } catch {
      toast.error('Error al actualizar asistencia')
    }
  }

  const handleAddUser = async (u) => {
    try {
      await addUser.mutateAsync({
        eventId,
        user: {
          uid: u.id,
          displayName: u.displayName,
          nombre: u.nombre,
          email: u.email,
          telefono: u.telefono,
          photoURL: u.photoURL
        }
      })
      toast.success(`${u.nombre || u.displayName || userContact(u)} fue añadido`)
    } catch (error) {
      toast.error(error.message || 'Error al añadir usuario')
    }
  }

  const handleRemoveUser = (registration) => {
    setPendingRemove(registration)
  }

  const performRemove = async () => {
    if (!pendingRemove) return
    try {
      await removeUser.mutateAsync({
        registrationId: pendingRemove.id,
        eventId,
        userId: pendingRemove.userId
      })
      toast.success('Inscripción removida')
    } catch {
      toast.error('Error al remover usuario')
    } finally {
      setPendingRemove(null)
    }
  }

  const renderGroup = (list, cap, titularesLabel) =>
    list.map((reg, index) => (
      <Fragment key={reg.id}>
        {index === 0 && (
          <p className="pt-2 text-[10px] uppercase tracking-widest font-bold text-zinc-400">
            {titularesLabel}
          </p>
        )}
        {index === cap && (
          <p className="pt-2 text-[10px] uppercase tracking-widest font-bold text-zinc-400">
            Suplentes
          </p>
        )}
        <div
          className={`flex items-center justify-between p-3 rounded-lg ${
            reg.selected
              ? 'bg-zinc-50 dark:bg-zinc-900'
              : 'bg-zinc-100/60 dark:bg-zinc-900/40 opacity-70'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-sm text-zinc-500 dark:text-zinc-400 w-6 flex-shrink-0">
              {reg.selectionRank}
            </span>
            <Avatar src={reg.userPhoto} name={reg.userName} size="sm" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-zinc-900 dark:text-zinc-50 truncate">
                  {reg.userName || formatPhone(reg.userTelefono) || reg.userEmail}
                </p>
                {reg.registeredBy === 'admin' && (
                  <Badge variant="info" size="sm">Admin</Badge>
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                {byTraining
                  ? `${reg.trainingCount} ${reg.trainingCount === 1 ? 'entrenamiento' : 'entrenamientos'}`
                  : formatPhone(reg.userTelefono) || reg.userEmail}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => handleToggleAttendance(reg)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                reg.attended
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400'
              }`}
            >
              {reg.attended ? '✓ Asistió' : 'Marcar'}
            </button>
            <button
              onClick={() => handleRemoveUser(reg)}
              className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              title="Quitar inscripción"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Fragment>
    ))

  const title = event?.isPrivate ? (
    <span className="flex items-center gap-2">
      <Lock className="w-4 h-4" />
      Inscritos — evento privado
    </span>
  ) : 'Inscritos'

  return (
    <Modal isOpen={!!eventId} onClose={onClose} title={title} size="lg">
      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-zinc-200 dark:border-zinc-700">
        <button
          onClick={() => setTab('inscritos')}
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'inscritos'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          Inscritos {registrations ? `(${registrations.length})` : ''}
        </button>
        <button
          onClick={() => setTab('añadir')}
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'añadir'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          Añadir usuarios
        </button>
      </div>

      {tab === 'inscritos' && (
        <div className="mb-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 space-y-3">
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
            Cerrar lista y convocar
          </p>

          <Select
            label="¿Cómo se eligen los convocados?"
            value={selectionMode}
            onChange={(e) => setMode(e.target.value)}
            options={selectionModeOptions}
            helperText={SELECTION_MODES[selectionMode]?.description}
          />

          {byTraining && (
            <Select
              label="Entrenamientos a considerar"
              value={attendanceWindow}
              onChange={(e) => setWindowKey(e.target.value)}
              options={attendanceWindowOptions}
              helperText="Se cuentan las asistencias a entrenamientos dentro de esa ventana."
            />
          )}

          <p className="text-xs text-blue-700 dark:text-blue-300">
            Entran {event?.maxSlots} jugadores de campo + {GOALKEEPER_SLOTS} arqueros (los arqueros
            se eligen aparte, no compiten por las plazas de campo).
          </p>

          <p className="text-xs text-blue-700 dark:text-blue-300">
            {published
              ? `Publicada el ${formatDate(event.convocatoriaPublishedAt, "d MMM 'a las' HH:mm")}${
                  isStale ? ' — la lista o el criterio cambiaron, vuelve a publicar.' : ''
                }`
              : 'Sin publicar: los jugadores aún no ven si están convocados.'}
          </p>

          <Button
            size="sm"
            onClick={() => setPendingPublish(true)}
            loading={publish.isPending}
            disabled={(byTraining && loadingCounts) || !rows.length}
          >
            {published ? 'Actualizar convocatoria' : 'Publicar convocatoria'}
          </Button>
        </div>
      )}

      {tab === 'inscritos' ? (
        loadingRegs ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton.UserItem key={i} />
            ))}
          </div>
        ) : rows.length > 0 ? (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {renderGroup(goalkeepers, GOALKEEPER_SLOTS, 'Arqueros')}
            {renderGroup(fieldPlayers, event?.maxSlots || 0, 'Titulares')}
          </div>
        ) : (
          <EmptyState
            icon="users"
            title="Sin inscritos"
            description={
              event?.isPrivate
                ? 'Añade usuarios desde la pestaña "Añadir usuarios".'
                : 'Aún no hay jugadores inscritos en este evento.'
            }
          />
        )
      ) : (
        <div>
          <div className="mb-4">
            <Input
              type="search"
              placeholder="Buscar por nombre o correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
              inputMode="search"
              autoComplete="off"
              enterKeyHint="search"
            />
          </div>

          {loadingUsers ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton.UserItem key={i} />
              ))}
            </div>
          ) : eligibleUsers.length > 0 ? (
            <div className="space-y-2 max-h-[55vh] overflow-y-auto">
              {eligibleUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar src={u.photoURL} name={u.nombre || u.displayName} size="sm" />
                    <div className="min-w-0">
                      <p className="font-medium text-zinc-900 dark:text-zinc-50 truncate">
                        {u.nombre || u.displayName || userContact(u)}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{userContact(u)}</p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    icon={Plus}
                    onClick={() => handleAddUser(u)}
                    disabled={addUser.isPending}
                    loading={addUser.isPending && addUser.variables?.user?.uid === u.id}
                  >
                    Añadir
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="users"
              title="Sin usuarios disponibles"
              description={
                searchTerm
                  ? 'No se encontraron usuarios con esa búsqueda.'
                  : 'Todos los usuarios ya están inscritos en este evento.'
              }
            />
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={pendingPublish}
        onClose={() => setPendingPublish(false)}
        onConfirm={handlePublish}
        title={published ? 'Actualizar convocatoria' : 'Cerrar lista y publicar'}
        description={`Se convocarán ${Math.min(fieldPlayers.length, event?.maxSlots || 0)} jugadores de campo y ${Math.min(goalkeepers.length, GOALKEEPER_SLOTS)} arqueros por ${SELECTION_MODES[selectionMode]?.short.toLowerCase()}. Los demás quedan como suplentes y todos verán su estado.`}
        confirmLabel={published ? 'Actualizar' : 'Publicar'}
        loading={publish.isPending}
      />

      <ConfirmModal
        isOpen={!!pendingRemove}
        onClose={() => setPendingRemove(null)}
        onConfirm={performRemove}
        title="Quitar inscripción"
        description={
          pendingRemove
            ? `${pendingRemove.userName || formatPhone(pendingRemove.userTelefono) || pendingRemove.userEmail} será removido del evento.`
            : ''
        }
        confirmLabel="Quitar"
        loading={removeUser.isPending}
      />
    </Modal>
  )
}

export default EventAttendeesManager
