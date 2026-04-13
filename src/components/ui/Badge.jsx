// Componente Badge para estados y tipos
const variants = {
  // Tipos de evento
  partido: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
  torneo: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  entrenamiento: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  otro: 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300',

  // Estados
  abierto: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  lleno: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
  inscrito: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  cerrado: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',

  // Roles
  admin: 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  jugador: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',

  // Genéricos
  primary: 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300',
  secondary: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  danger: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
  info: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
}

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm'
}

const Badge = ({
  children,
  variant = 'secondary',
  size = 'md',
  dot = false,
  className = ''
}) => {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        font-medium rounded-lg
        ${variants[variant] || variants.secondary}
        ${sizes[size]}
        ${className}
      `}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      )}
      {children}
    </span>
  )
}

export default Badge
