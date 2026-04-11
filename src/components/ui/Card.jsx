// Componente Card reutilizable
import { motion } from 'framer-motion'

const Card = ({
  children,
  className = '',
  hover = false,
  padding = 'md',
  onClick = null,
  ...props
}) => {
  const paddingSizes = {
    none: '',
    sm: 'p-4',
    md: 'p-5 md:p-6',
    lg: 'p-6 md:p-8'
  }

  const Component = onClick ? motion.button : motion.div

  return (
    <Component
      onClick={onClick}
      whileHover={hover ? { y: -2 } : {}}
      whileTap={onClick ? { scale: 0.995 } : {}}
      className={`
        bg-white dark:bg-zinc-900
        rounded-2xl
        border border-zinc-200/80 dark:border-zinc-700
        ${paddingSizes[padding]}
        ${hover ? 'cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors' : ''}
        ${onClick ? 'text-left w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </Component>
  )
}

Card.Header = ({ children, className = '' }) => (
  <div className={`border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-5 ${className}`}>
    {children}
  </div>
)

Card.Title = ({ children, className = '' }) => (
  <h3 className={`text-base font-semibold text-zinc-900 dark:text-zinc-50 ${className}`}>
    {children}
  </h3>
)

Card.Description = ({ children, className = '' }) => (
  <p className={`text-sm text-zinc-500 dark:text-zinc-400 mt-1 ${className}`}>
    {children}
  </p>
)

Card.Body = ({ children, className = '' }) => (
  <div className={className}>
    {children}
  </div>
)

Card.Footer = ({ children, className = '' }) => (
  <div className={`border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-5 ${className}`}>
    {children}
  </div>
)

export default Card
