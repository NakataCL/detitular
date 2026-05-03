// Página de Perfil del jugador
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, ChevronRight, Shield, Edit2, Bell, BellOff } from '../utils/icons'
import { Card, Button, Skeleton, Modal } from '../components/ui'
import { ProfileForm, PlanCard, PlayerCard } from '../components/profile'
import { useAuth } from '../context/AuthContext'
import { usePlayer } from '../hooks/usePlayer'
import { useEventReminders } from '../hooks/useEventReminders'
import { POSITIONS, FOOT_OPTIONS } from '../utils/constants'
import toast from 'react-hot-toast'

const Perfil = () => {
  const navigate = useNavigate()
  const { user, logout, isAdmin } = useAuth()
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
    return (
      <div className="px-4 sm:px-6 md:px-12 pt-8 sm:pt-10 pb-12 md:pt-14 md:pb-20 max-w-3xl mx-auto space-y-10">
        <Skeleton.PlayerCard />
        <div>
          <Skeleton variant="text" className="w-32 mb-4" />
          <Skeleton.PlanCard />
        </div>
        <Skeleton.PlanCard />
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 md:px-12 pt-8 sm:pt-10 pb-12 md:pt-14 md:pb-20 max-w-3xl mx-auto space-y-10">
      {/* Carnet de jugador */}
      <div className="relative">
        <PlayerCard player={player} user={user} />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowEditModal(true)}
          aria-label="Editar perfil"
          className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white"
        >
          <Edit2 className="w-4 h-4" />
        </Button>
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400 text-center">
          {user?.email}
        </p>
      </div>

      {/* Plan */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">
          Mi Plan
        </h2>
        <PlanCard plan={player?.plan} />
      </div>

      {/* Recordatorios */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">
          Recordatorios
        </h2>
        <RemindersCard />
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

const RemindersCard = () => {
  const { enabled, permission, supported, triggersSupported, enable, disable } = useEventReminders()

  if (!supported) {
    return (
      <Card>
        <div className="flex items-start gap-3">
          <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
            <BellOff className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              No disponible
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Tu navegador no soporta notificaciones locales.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  const handleToggle = async () => {
    if (enabled) {
      await disable()
      toast.success('Recordatorios desactivados')
      return
    }
    const ok = await enable()
    if (ok) toast.success('Recordatorios activados')
    else if (permission === 'denied') {
      toast.error('Permiso denegado. Activa las notificaciones en el navegador.')
    }
  }

  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-xl ${enabled ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'}`}>
          {enabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Avisarme 1h antes de cada evento
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {triggersSupported
              ? 'La notificación llega aunque la app esté cerrada.'
              : 'Tu navegador sólo envía recordatorios cuando la app está abierta.'}
          </p>
        </div>
        <button
          onClick={handleToggle}
          aria-pressed={enabled}
          aria-label={enabled ? 'Desactivar recordatorios' : 'Activar recordatorios'}
          className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
            enabled ? 'bg-emerald-600' : 'bg-zinc-300 dark:bg-zinc-700'
          }`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
              enabled ? 'translate-x-5' : 'translate-x-0.5'
            }`}
            aria-hidden="true"
          />
        </button>
      </div>
    </Card>
  )
}

const InfoRow = ({ label, value, last = false }) => (
  <div className={`flex justify-between py-3 ${!last ? 'border-b border-zinc-100 dark:border-zinc-800' : ''}`}>
    <span className="text-sm text-zinc-500 dark:text-zinc-400">{label}</span>
    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{value}</span>
  </div>
)

export default Perfil
