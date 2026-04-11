// Prompt para instalar la PWA
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X } from '../../utils/icons'
import { usePWAInstall } from '../../hooks/usePWA'
import Button from './Button'

const InstallPrompt = () => {
  const { canInstall, isInstalled, installPWA } = usePWAInstall()
  const [dismissed, setDismissed] = useState(false)

  if (isInstalled || !canInstall || dismissed) {
    return null
  }

  const handleInstall = async () => {
    const success = await installPWA()
    if (success) {
      setDismissed(true)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 z-40"
      >
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-zinc-200/80 dark:border-zinc-700 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center">
              <Download className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            </div>

            <div className="flex-1">
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-0.5">
                Instala la App
              </h4>
              <p className="text-xs text-zinc-400 mb-3">
                Accede más rápido y recibe notificaciones
              </p>

              <div className="flex gap-2">
                <Button size="sm" onClick={handleInstall}>
                  Instalar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDismissed(true)}
                >
                  Ahora no
                </Button>
              </div>
            </div>

            <button
              onClick={() => setDismissed(true)}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default InstallPrompt
