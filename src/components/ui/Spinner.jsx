// Componente Spinner de carga
import { Loader2 } from '../../utils/icons'

const sizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-8 h-8',
  xl: 'w-10 h-10'
}

const Spinner = ({ size = 'md', className = '', fullScreen = false }) => {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className={`${sizes.xl} text-zinc-900 dark:text-zinc-50 animate-spin`} />
          <p className="text-sm text-zinc-400">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <Loader2
      className={`${sizes[size]} text-zinc-900 dark:text-zinc-50 animate-spin ${className}`}
    />
  )
}

Spinner.Container = ({ size = 'lg', text = 'Cargando...' }) => (
  <div className="flex flex-col items-center justify-center py-12 gap-3">
    <Loader2 className={`${sizes[size]} text-zinc-900 dark:text-zinc-50 animate-spin`} />
    {text && <p className="text-sm text-zinc-400">{text}</p>}
  </div>
)

export default Spinner
