// Indicador de estado offline
import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff } from '../../utils/icons'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'

const OfflineIndicator = () => {
  const isOnline = useOnlineStatus()

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium shadow-lg"
        >
          <WifiOff className="w-4 h-4" />
          <span>Sin conexión - Mostrando datos guardados</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default OfflineIndicator
