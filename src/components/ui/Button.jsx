// Componente de botón reutilizable
import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from '../../utils/icons'

const variants = {
  primary: 'bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900',
  secondary: 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200',
  success: 'bg-primary-600 hover:bg-primary-700 text-white',
  danger: 'bg-red-500 hover:bg-red-600 text-white',
  warning: 'bg-amber-500 hover:bg-amber-600 text-white',
  ghost: 'bg-transparent hover:bg-zinc-100 text-zinc-600 dark:hover:bg-zinc-800 dark:text-zinc-300',
  outline: 'bg-transparent border border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800'
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
  icon: 'p-2.5'
}

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon: Icon = null,
  iconPosition = 'left',
  className = '',
  onClick,
  type = 'button',
  ...props
}, ref) => {
  const isDisabled = disabled || loading

  return (
    <motion.button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      whileTap={{ scale: isDisabled ? 1 : 0.98 }}
      className={`
        inline-flex items-center justify-center gap-2
        font-medium rounded-xl
        transition-colors duration-150
        focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:ring-offset-2
        disabled:opacity-40 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
          {children}
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
        </>
      )}
    </motion.button>
  )
})

Button.displayName = 'Button'

export default Button
