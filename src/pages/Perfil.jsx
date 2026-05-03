// Página de Perfil del jugador
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogOut, ChevronRight, Shield, Edit2 } from '../utils/icons'
import { Card, Button, Avatar, Badge, Spinner, Modal } from '../components/ui'
import { ProfileForm, PlayerStats, PlanCard } from '../components/profile'
import { useAuth } from '../context/AuthContext'
import { usePlayer } from '../hooks/usePlayer'
import { POSITIONS, FOOT_OPTIONS } from '../utils/constants'
import toast from 'react-hot-toast'

const Perfil = () => {
  const navigate = useNavigate()
  const { user, userData, logout, isAdmin } = useAuth()
  const { data: player, isLoading } = usePlayer()
  const [showEditModal, setShowEditModal] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/')
      toast.success('Sesión cerrada')
    } catch (error) {
      toast.error('Error al cerrar sesión')
    }
  }

  if (isLoading) {
    return <Spinner fullScreen />
  }

  const displayName = player?.nombre || player?.displayName || user?.displayName || 'Jugador'
  const positionLabel = POSITIONS.find(p => p.value === player?.posicionPrincipal)?.label

  return (
    <div className="px-4 sm:px-6 md:px-12 pt-8 sm:pt-10 pb-12 md:pt-14 md:pb-20 max-w-3xl mx-auto space-y-12">
      {/* Profile header */}
      <Card>
        <div className="flex items-center gap-4">
          <Avatar
            src={player?.photoURL || user?.photoURL}
            name={displayName}
            size="xl"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 truncate">
                {displayName}
              </h1>
              {isAdmin && (
                <Badge variant="admin" size="sm">
                  <Shield className="w-3 h-3 mr-1" />
                  Admin
                </Badge>
              )}
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">{user?.email}</p>
            {positionLabel && (
              <p className="text-sm text-primary-600 dark:text-primary-400 mt-0.5">{positionLabel}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowEditModal(true)}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Stats */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">
          Mis Estadísticas
        </h2>
        <PlayerStats />
      </div>

      {/* Plan */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">
          Mi Plan
        </h2>
        <PlanCard plan={player?.plan} />
      </div>

      {/* Info */}
      <Card>
        <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">
          Información
        </h2>
        <div className="space-y-0">
          <InfoRow label="Edad" value={player?.edad ? `${player.edad} años` : '-'} />
          <InfoRow label="Ciudad" value={player?.ciudad || '-'} />
          <InfoRow label="Teléfono" value={player?.telefono || '-'} />
          <InfoRow
            label="Posición secundaria"
            value={POSITIONS.find(p => p.value === player?.posicionSecundaria)?.label || '-'}
          />
          <InfoRow
            label="Pie hábil"
            value={FOOT_OPTIONS.find(f => f.value === player?.pieHabil)?.label || '-'}
          />
          <InfoRow
            label="Número"
            value={player?.numeroCamiseta ? `#${player.numeroCamiseta}` : '-'}
            last
          />
        </div>
      </Card>

      {/* Actions */}
      <div className="space-y-2">
        {isAdmin && (
          <Card hover onClick={() => navigate('/admin')} className="cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-50 dark:bg-violet-950/50 rounded-xl">
                  <Shield className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    Panel de Administración
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Gestiona eventos, usuarios y más
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </div>
          </Card>
        )}

        <Button
          fullWidth
          variant="danger"
          icon={LogOut}
          onClick={handleLogout}
        >
          Cerrar sesión
        </Button>
      </div>

      {/* Edit modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Perfil"
        size="lg"
      >
        <ProfileForm
          player={player}
          onSuccess={() => setShowEditModal(false)}
        />
      </Modal>
    </div>
  )
}

const InfoRow = ({ label, value, last = false }) => (
  <div className={`flex justify-between py-3 ${!last ? 'border-b border-zinc-100 dark:border-zinc-800' : ''}`}>
    <span className="text-sm text-zinc-500 dark:text-zinc-400">{label}</span>
    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{value}</span>
  </div>
)

export default Perfil
