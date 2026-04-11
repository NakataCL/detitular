// Estadísticas del jugador
import { motion } from 'framer-motion'
import { Calendar, CheckCircle, TrendingUp, Flame } from '../../utils/icons'
import { Card, Skeleton } from '../ui'
import { usePlayerStats } from '../../hooks/usePlayer'

const PlayerStats = ({ userId = null }) => {
  const { data: stats, isLoading } = usePlayerStats(userId)

  if (isLoading) {
    return <Skeleton.Stats />
  }

  const statItems = [
    {
      label: 'Inscripciones',
      value: stats?.totalRegistrations || 0,
      icon: Calendar,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30'
    },
    {
      label: 'Asistencias',
      value: stats?.attendedEvents || 0,
      icon: CheckCircle,
      color: 'text-green-600 bg-green-100 dark:bg-green-900/30'
    },
    {
      label: '% Asistencia',
      value: `${stats?.attendanceRate || 0}%`,
      icon: TrendingUp,
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30'
    },
    {
      label: 'Racha',
      value: stats?.currentStreak || 0,
      icon: Flame,
      color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30'
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {statItems.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="text-center">
            <div className={`inline-flex p-2 rounded-lg mb-2 ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {stat.value}
            </p>
            <p className="text-xs text-zinc-400">{stat.label}</p>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

export default PlayerStats
