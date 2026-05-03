// Carnet editorial del jugador para la cabecera de Perfil
import { Avatar } from '../ui'
import { usePlayerStats } from '../../hooks/usePlayer'
import { POSITIONS } from '../../utils/constants'
import { getInitials } from '../../utils/helpers'

const PlayerCard = ({ player, user }) => {
  const { data: stats } = usePlayerStats()

  const displayName =
    player?.nombre || player?.displayName || user?.displayName || 'Jugador'
  const positionLabel = POSITIONS.find(
    p => p.value === player?.posicionPrincipal
  )?.label

  const watermark = player?.numeroCamiseta
    ? `#${player.numeroCamiseta}`
    : getInitials(displayName)

  return (
    <section
      aria-label={`Carnet de ${displayName}`}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-black dark:to-zinc-900 p-6 md:p-8 text-white"
    >
      <span
        aria-hidden="true"
        className="font-display italic absolute -right-4 -top-8 text-[200px] leading-none text-red-700/15 select-none pointer-events-none"
      >
        {watermark}
      </span>

      <div className="relative">
        {/* Identidad */}
        <div className="flex items-center gap-4 mb-8">
          <Avatar
            src={player?.photoURL || user?.photoURL}
            name={displayName}
            size="xl"
            className="ring-2 ring-white/15"
          />
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-3xl md:text-4xl leading-tight tracking-tight truncate">
              {displayName}
            </h2>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400 mt-1">
              {positionLabel || 'Jugador'}
            </p>
          </div>
        </div>

        {/* Stats embebidas */}
        <dl className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
          <Stat label="Asistencias" value={stats?.attendedEvents ?? 0} />
          <Stat
            label="% Asistencia"
            value={
              stats?.attendanceRate !== undefined
                ? `${stats.attendanceRate}%`
                : '—'
            }
          />
          <Stat label="Racha" value={stats?.currentStreak ?? 0} />
        </dl>
      </div>
    </section>
  )
}

const Stat = ({ label, value }) => (
  <div>
    <dd className="font-display text-3xl md:text-4xl leading-none tabular-nums">
      {value}
    </dd>
    <dt className="mt-1 text-[10px] uppercase tracking-[0.18em] font-bold text-zinc-400">
      {label}
    </dt>
  </div>
)

export default PlayerCard
