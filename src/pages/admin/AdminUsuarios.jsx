// Gestión de usuarios (Admin)
import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  Shield,
  User,
  CreditCard,
  ChevronRight,
  Check,
  X,
  Trash2,
  AlertTriangle
} from '../../utils/icons'
import { Card, Button, Badge, Avatar, EmptyState, Skeleton, Modal } from '../../components/ui'
import Input, { Select } from '../../components/ui/Input'
import {
  useAllUsers,
  useUpdateUserPlan,
  useUpdateUserRole,
  useToggleUserDisabled,
  useDeleteUser
} from '../../hooks/usePlayer'
import { useAuth } from '../../context/AuthContext'
import { PLANS } from '../../utils/constants'
import { formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

const AdminUsuarios = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)

  const { user: currentUser } = useAuth()
  const { data: users, isLoading } = useAllUsers()
  const updatePlan = useUpdateUserPlan()
  const updateRole = useUpdateUserRole()
  const toggleDisabled = useToggleUserDisabled()
  const deleteUserMutation = useDeleteUser()

  // Filtrar usuarios
  const filteredUsers = users?.filter(user => {
    const term = searchTerm.toLowerCase()
    return (
      user.nombre?.toLowerCase().includes(term) ||
      user.displayName?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term)
    )
  }) || []

  const handleToggleRole = async (user) => {
    const newRole = user.role === 'admin' ? 'jugador' : 'admin'

    if (!window.confirm(`¿Cambiar rol de ${user.nombre || user.displayName} a ${newRole}?`)) return

    try {
      await updateRole.mutateAsync({ userId: user.id, role: newRole })
      toast.success(`Rol actualizado a ${newRole}`)
    } catch (error) {
      toast.error('Error al actualizar rol')
    }
  }

  const handleOpenPlanModal = (user) => {
    setSelectedUser(user)
    setShowPlanModal(true)
  }

  const handleActivatePlan = async (planType) => {
    if (!selectedUser) return

    const plan = PLANS[planType]
    const now = new Date()
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    try {
      await updatePlan.mutateAsync({
        userId: selectedUser.id,
        planData: {
          type: planType,
          active: true,
          totalSessions: plan.sessions,
          sessionsUsed: 0,
          expiresAt: endOfMonth
        }
      })
      toast.success(`Plan ${plan.name} activado`)
      setShowPlanModal(false)
      setSelectedUser(null)
    } catch (error) {
      toast.error('Error al activar plan')
    }
  }

  const handleDeactivatePlan = async (user) => {
    if (!window.confirm('¿Desactivar el plan de este usuario?')) return

    try {
      await updatePlan.mutateAsync({
        userId: user.id,
        planData: {
          ...user.plan,
          active: false
        }
      })
      toast.success('Plan desactivado')
    } catch (error) {
      toast.error('Error al desactivar plan')
    }
  }

  const handleToggleDisabled = async (user) => {
    const nextDisabled = !user.disabled
    const action = nextDisabled ? 'desactivar' : 'reactivar'

    if (!window.confirm(`¿${action.charAt(0).toUpperCase() + action.slice(1)} a ${user.nombre || user.displayName}?`)) return

    try {
      await toggleDisabled.mutateAsync({ userId: user.id, disabled: nextDisabled })
      toast.success(nextDisabled ? 'Usuario desactivado' : 'Usuario reactivado')
    } catch (error) {
      toast.error(`Error al ${action} usuario`)
    }
  }

  const handleConfirmDelete = async () => {
    if (!userToDelete) return

    try {
      await deleteUserMutation.mutateAsync(userToDelete.id)
      toast.success('Usuario eliminado')
      setUserToDelete(null)
    } catch (error) {
      toast.error('Error al eliminar usuario')
    }
  }

  return (
    <div className="px-4 sm:px-6 md:px-12 pt-8 sm:pt-10 pb-12 md:pt-14 md:pb-20 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Gestión de Usuarios
        </h1>
        <p className="text-zinc-400">Administra jugadores, planes y roles</p>
      </div>

      {/* Búsqueda */}
      <div className="mb-8">
        <Input
          type="search"
          placeholder="Buscar por nombre o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={Search}
          inputMode="search"
          autoComplete="off"
          enterKeyHint="search"
        />
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
        <Card className="text-center py-4">
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {users?.length || 0}
          </p>
          <p className="text-xs text-zinc-400">Total usuarios</p>
        </Card>
        <Card className="text-center py-4">
          <p className="text-2xl font-bold text-red-600">
            {users?.filter(u => u.plan?.active).length || 0}
          </p>
          <p className="text-xs text-zinc-400">Con plan activo</p>
        </Card>
        <Card className="text-center py-4">
          <p className="text-2xl font-bold text-purple-600">
            {users?.filter(u => u.role === 'admin').length || 0}
          </p>
          <p className="text-xs text-zinc-400">Administradores</p>
        </Card>
      </div>

      {/* Lista de usuarios */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton.UserItem key={i} />
          ))}
        </div>
      ) : filteredUsers.length > 0 ? (
        <div className="space-y-3">
          {filteredUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              isSelf={user.id === currentUser?.uid}
              onToggleRole={() => handleToggleRole(user)}
              onManagePlan={() => handleOpenPlanModal(user)}
              onDeactivatePlan={() => handleDeactivatePlan(user)}
              onToggleDisabled={() => handleToggleDisabled(user)}
              onDelete={() => setUserToDelete(user)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="users"
          title="Sin resultados"
          description={
            searchTerm
              ? 'No se encontraron usuarios con esa búsqueda'
              : 'No hay usuarios registrados'
          }
        />
      )}

      {/* Modal de plan */}
      <PlanModal
        isOpen={showPlanModal}
        onClose={() => {
          setShowPlanModal(false)
          setSelectedUser(null)
        }}
        user={selectedUser}
        onActivate={handleActivatePlan}
        isLoading={updatePlan.isPending}
      />

      {/* Modal de confirmación de eliminación */}
      <DeleteUserModal
        user={userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteUserMutation.isPending}
      />
    </div>
  )
}

// Tarjeta de usuario
const UserCard = ({
  user,
  isSelf,
  onToggleRole,
  onManagePlan,
  onDeactivatePlan,
  onToggleDisabled,
  onDelete
}) => {
  const hasPlan = user.plan?.active
  const isDisabled = !!user.disabled

  const planStatus = hasPlan ? (
    <div className="text-right">
      <Badge variant="success" size="sm" dot>
        Plan activo
      </Badge>
      <p className="text-xs text-zinc-400 mt-1">
        {user.plan.sessionsUsed || 0}/{user.plan.totalSessions} sesiones
      </p>
    </div>
  ) : (
    <Badge variant="secondary" size="sm">
      Sin plan
    </Badge>
  )

  const actionButtons = (
    <div className="flex items-center gap-1">
      <button
        onClick={onToggleRole}
        className="p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400"
        title={user.role === 'admin' ? 'Quitar admin' : 'Hacer admin'}
        aria-label={user.role === 'admin' ? 'Quitar admin' : 'Hacer admin'}
      >
        <Shield className="w-4 h-4" />
      </button>

      {hasPlan ? (
        <button
          onClick={onDeactivatePlan}
          className="p-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500"
          title="Desactivar plan"
          aria-label="Desactivar plan"
        >
          <X className="w-4 h-4" />
        </button>
      ) : (
        <button
          onClick={onManagePlan}
          className="p-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-600"
          title="Activar plan"
          aria-label="Activar plan"
        >
          <CreditCard className="w-4 h-4" />
        </button>
      )}

      <button
        onClick={onToggleDisabled}
        disabled={isSelf}
        className="p-2.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg text-amber-600 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        title={isSelf ? 'No puedes desactivarte a ti mismo' : (isDisabled ? 'Reactivar usuario' : 'Desactivar usuario')}
        aria-label={isDisabled ? 'Reactivar usuario' : 'Desactivar usuario'}
      >
        {isDisabled ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
      </button>

      <button
        onClick={onDelete}
        disabled={isSelf}
        className="p-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        title={isSelf ? 'No puedes eliminarte a ti mismo' : 'Eliminar usuario'}
        aria-label="Eliminar usuario"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )

  return (
    <Card className={isDisabled ? 'opacity-60' : ''}>
      <div className="flex items-start sm:items-center gap-3 sm:gap-4">
        <Avatar
          src={user.photoURL}
          name={user.nombre || user.displayName}
          size="md"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-zinc-900 dark:text-zinc-50 truncate">
              {user.nombre || user.displayName || 'Sin nombre'}
            </h3>
            <Badge variant={user.role} size="sm">
              {user.role === 'admin' ? 'Admin' : 'Jugador'}
            </Badge>
            {isDisabled && (
              <Badge variant="danger" size="sm">
                Desactivado
              </Badge>
            )}
          </div>
          <p className="text-sm text-zinc-400 truncate">{user.email}</p>
          {user.posicionPrincipal && (
            <p className="text-xs text-primary-600 mt-1">
              {user.posicionPrincipal}
            </p>
          )}

          {/* Mobile: acciones (arriba) + plan (abajo derecha) en stack */}
          <div className="mt-3 space-y-2 sm:hidden">
            <div className="flex justify-start">{actionButtons}</div>
            <div className="flex justify-end">{planStatus}</div>
          </div>
        </div>

        {/* Desktop: plan + acciones a la derecha */}
        <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
          {planStatus}
          {actionButtons}
        </div>
      </div>
    </Card>
  )
}

// Modal para activar plan
const PlanModal = ({ isOpen, onClose, user, onActivate, isLoading }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Activar Plan"
      size="md"
    >
      {user && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
            <Avatar src={user.photoURL} name={user.nombre || user.displayName} size="md" />
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-50">
                {user.nombre || user.displayName}
              </p>
              <p className="text-sm text-zinc-400">{user.email}</p>
            </div>
          </div>

          <p className="text-sm text-zinc-400">
            Selecciona el plan a activar. El plan vencerá al final del mes actual.
          </p>

          <div className="space-y-2">
            {Object.entries(PLANS).map(([key, plan]) => (
              <button
                key={key}
                onClick={() => onActivate(key)}
                disabled={isLoading}
                className="w-full flex items-center justify-between p-4 rounded-lg border-2 border-zinc-200/60 dark:border-zinc-800 hover:border-primary-500 transition-colors text-left"
              >
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {plan.name}
                  </p>
                  <p className="text-sm text-zinc-400">{plan.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-400" />
              </button>
            ))}
          </div>
        </div>
      )}
    </Modal>
  )
}

// Modal de confirmación de eliminación
const DeleteUserModal = ({ user, onClose, onConfirm, isLoading }) => {
  return (
    <Modal
      isOpen={!!user}
      onClose={onClose}
      title="Eliminar usuario"
      size="sm"
    >
      {user && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
            <Avatar src={user.photoURL} name={user.nombre || user.displayName} size="md" />
            <div className="min-w-0">
              <p className="font-medium text-zinc-900 dark:text-zinc-50 truncate">
                {user.nombre || user.displayName}
              </p>
              <p className="text-sm text-zinc-400 truncate">{user.email}</p>
            </div>
          </div>

          <div className="flex gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">
              Esta acción eliminará los datos del perfil del usuario. No se puede deshacer.
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={onConfirm} loading={isLoading}>
              Eliminar
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default AdminUsuarios
