// Modal admin para gestionar inscritos de un evento (ver, añadir, remover, marcar asistencia)
import { Fragment, useMemo, useState } from 'react'
import { Search, Trash2, Check, Plus, Lock } from '../../utils/icons'
import { Modal, Button, Avatar, EmptyState, Skeleton, Badge, ConfirmModal } from '../ui'
import Input from '../ui/Input'
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
import { isPriorityMode, rankRegistrations, formatDate, formatPhone, userContact } from '../../utils/helpers'
import { ATTENDANCE_WINDOWS, DEFAULT_ATTENDANCE_WINDOW } from '../../utils/constants'
import toast from 'react-hot-toast'

const EventAttendeesManager = ({ eventId, onClose }) => {
  const [tab, setTab] = useState('inscritos')
  const [searchTerm, setSearchTerm] = useState('')
  const [pendingRemove, setPendingRemove] = useState(null)

  const { data: event } = useEvent(eventId)
  const { data: registrations, isLoading: loadingRegs } = useEventRegistrations(eventId)
  const { data: allUsers, isLoading: loadingUsers } = useAllUsers()

  const markAttendance = useMarkAttendance()
  const addUser = useAdminAddUserToEvent()
  const removeUser = useAdminRemoveUserFromEvent()

  const isPriority = isPriorityMode(event)
  const windowKey = event?.attendanceWindow || DEFAULT_ATTENDANCE_WINDOW
  const { data: trainingCounts, isLoading: loadingCounts } = useTrainingCounts(
    windowKey,
    isPriority && !!eventId
  )
  const publish = usePublishConvocatoria()

  // En modo "entrenamiento" no hay tope de inscritos: los cupos son plazas de titular.
  const isFull = !isPriority && event && (event.currentSlots || 0) >= (event.maxSlots || 0)

  const rows = useMemo(() => {
    if (!registrations) return []
    if (!isPriority) return registrations
    return rankRegistrations(registrations, trainingCounts || {}, event?.maxSlots || 0)
  }, [registrations, isPriority, trainingCounts, event?.maxSlots])

  // La convocatoria publicada queda desactualizada si entró o salió alguien.
  const isStale =
    isPriority &&
    !!event?.convocatoriaPublishedAt &&
    (event.convocatoriaCount !== registrations?.length ||
      (registrations || []).some(r => r.selectionRank === undefined))

  const handlePublish = async () => {
    try {
      await publish.mutateAsync({ eventId, ranked: rows })
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
        eventId
      })
    } catch {
      toast.error('Error al actualizar asistencia')
    }
  }

  const handleAddUser = async (u) => {
    if (isFull) {
      toast.error('Cupos completos')
      return
    }
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

      {isFull && tab === 'añadir' && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-sm">
          Cupos completos ({event?.currentSlots}/{event?.maxSlots}). No se pueden añadir más usuarios.
        </div>
      )}

      {tab === 'inscritos' && isPriority && (
        <div className="mb-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 space-y-2">
          <p className="text-sm text-blue-900 dark:text-blue-200">
            Convocatoria por <strong>entrenamientos</strong> —{' '}
            {ATTENDANCE_WINDOWS[windowKey]?.label.toLowerCase()}. Juegan los{' '}
            {event?.maxSlots} con más entrenamientos; empate se resuelve por orden de inscripción.
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            {event?.convocatoriaPublishedAt
              ? `Publicada el ${formatDate(event.convocatoriaPublishedAt, "d MMM 'a las' HH:mm")}${
                  isStale ? ' — la lista cambió desde entonces, vuelve a publicar.' : ''
                }`
              : 'Sin publicar: los jugadores aún no ven si están convocados.'}
          </p>
          <Button
            size="sm"
            onClick={handlePublish}
            loading={publish.isPending}
            disabled={loadingCounts || !rows.length}
          >
            {event?.convocatoriaPublishedAt ? 'Actualizar convocatoria' : 'Publicar convocatoria'}
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
            {rows.map((reg, index) => (
              <Fragment key={reg.id}>
                {isPriority && index === (event?.maxSlots || 0) && (
                  <p className="pt-3 text-[10px] uppercase tracking-widest font-bold text-zinc-400">
                    Suplentes
                  </p>
                )}
                {isPriority && index === 0 && (
                  <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">
                    Titulares
                  </p>
                )}
              <div
                className={`flex items-center justify-between p-3 rounded-lg ${
                  isPriority && !reg.selected
                    ? 'bg-zinc-100/60 dark:bg-zinc-900/40 opacity-70'
                    : 'bg-zinc-50 dark:bg-zinc-900'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400 w-6 flex-shrink-0">{index + 1}</span>
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
                      {isPriority
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
            ))}
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
                    disabled={isFull || addUser.isPending}
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
