// Componente Avatar para fotos de perfil
import { getInitials, stringToColor } from '../../utils/helpers'

const sizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-24 h-24 text-3xl'
}

const Avatar = ({
  src,
  alt = '',
  name = '',
  size = 'md',
  className = '',
  showBadge = false,
  badgeColor = 'green'
}) => {
  const initials = getInitials(name || alt)
  const bgColor = stringToColor(name || alt)

  return (
    <div className={`relative inline-block ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt || name}
          className={`
            ${sizes[size]}
            rounded-full object-cover
            ring-2 ring-white dark:ring-zinc-900
          `}
          onError={(e) => {
            e.target.style.display = 'none'
            e.target.nextSibling.style.display = 'flex'
          }}
        />
      ) : null}

      {/* Fallback */}
      <div
        className={`
          ${sizes[size]}
          rounded-full
          flex items-center justify-center
          font-semibold text-white
          ring-2 ring-white dark:ring-zinc-900
          ${src ? 'hidden' : ''}
        `}
        style={{ backgroundColor: bgColor }}
      >
        {initials}
      </div>

      {showBadge && (
        <span
          className={`
            absolute bottom-0 right-0
            w-3 h-3 rounded-full
            ring-2 ring-white dark:ring-zinc-900
            ${badgeColor === 'green' ? 'bg-emerald-500' : ''}
            ${badgeColor === 'red' ? 'bg-red-500' : ''}
            ${badgeColor === 'yellow' ? 'bg-amber-500' : ''}
            ${badgeColor === 'gray' ? 'bg-zinc-400' : ''}
          `}
        />
      )}
    </div>
  )
}

Avatar.Group = ({ children, max = 4, className = '' }) => {
  const childArray = Array.isArray(children) ? children : [children]
  const visible = childArray.slice(0, max)
  const remaining = childArray.length - max

  return (
    <div className={`flex -space-x-2 ${className}`}>
      {visible}
      {remaining > 0 && (
        <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-sm font-medium text-zinc-600 dark:text-zinc-300 ring-2 ring-white dark:ring-zinc-900">
          +{remaining}
        </div>
      )}
    </div>
  )
}

export default Avatar
