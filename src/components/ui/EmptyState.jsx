// Componente para estados vacíos
import { motion } from 'framer-motion'
import { Calendar, Users, Image, ClipboardList, Search } from '../../utils/icons'
import Button from './Button'

const icons = {
  events: Calendar,
  users: Users,
  experiences: Image,
  registrations: ClipboardList,
  search: Search
}

const EmptyState = ({
  icon = 'events',
  title = 'No hay datos',
  description = 'No se encontraron elementos para mostrar',
  action = null,
  actionLabel = 'Crear nuevo',
  className = ''
}) => {
  const Icon = icons[icon] || Calendar

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center py-16 px-4 ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-zinc-400" />
      </div>

      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 mb-1 text-center">
        {title}
      </h3>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center max-w-xs mb-6">
        {description}
      </p>

      {action && (
        <Button onClick={action} size="sm">
          {actionLabel}
        </Button>
      )}
    </motion.div>
  )
}

export default EmptyState
