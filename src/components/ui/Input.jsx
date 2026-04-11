// Componente Input reutilizable
import { forwardRef } from 'react'

const Input = forwardRef(({
  label,
  error,
  helperText,
  icon: Icon,
  type = 'text',
  className = '',
  fullWidth = true,
  ...props
}, ref) => {
  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
          {label}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-4 w-4 text-zinc-400" />
          </div>
        )}

        <input
          ref={ref}
          type={type}
          className={`
            block w-full rounded-xl
            border ${error ? 'border-red-400' : 'border-zinc-200 dark:border-zinc-700'}
            bg-white dark:bg-zinc-900
            text-zinc-900 dark:text-zinc-50
            placeholder-zinc-400
            focus:outline-none focus:ring-2
            ${error ? 'focus:ring-red-500/40' : 'focus:ring-primary-500/40'}
            focus:border-transparent
            disabled:bg-zinc-50 dark:disabled:bg-zinc-800 disabled:cursor-not-allowed disabled:text-zinc-400
            ${Icon ? 'pl-10' : 'pl-4'}
            pr-4 py-2.5
            text-sm
            transition-all
          `}
          {...props}
        />
      </div>

      {(error || helperText) && (
        <p className={`mt-1.5 text-xs ${error ? 'text-red-500' : 'text-zinc-400'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

// Textarea
export const Textarea = forwardRef(({
  label,
  error,
  helperText,
  rows = 4,
  className = '',
  fullWidth = true,
  ...props
}, ref) => {
  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
          {label}
        </label>
      )}

      <textarea
        ref={ref}
        rows={rows}
        className={`
          block w-full rounded-xl
          border ${error ? 'border-red-400' : 'border-zinc-200 dark:border-zinc-700'}
          bg-white dark:bg-zinc-900
          text-zinc-900 dark:text-zinc-50
          placeholder-zinc-400
          focus:outline-none focus:ring-2
          ${error ? 'focus:ring-red-500/40' : 'focus:ring-primary-500/40'}
          focus:border-transparent
          disabled:bg-zinc-50 dark:disabled:bg-zinc-800 disabled:cursor-not-allowed
          px-4 py-2.5
          text-sm
          resize-none
          transition-all
        `}
        {...props}
      />

      {(error || helperText) && (
        <p className={`mt-1.5 text-xs ${error ? 'text-red-500' : 'text-zinc-400'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  )
})

Textarea.displayName = 'Textarea'

// Select
export const Select = forwardRef(({
  label,
  error,
  helperText,
  options = [],
  placeholder = 'Seleccionar...',
  className = '',
  fullWidth = true,
  ...props
}, ref) => {
  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
          {label}
        </label>
      )}

      <select
        ref={ref}
        className={`
          block w-full rounded-xl
          border ${error ? 'border-red-400' : 'border-zinc-200 dark:border-zinc-700'}
          bg-white dark:bg-zinc-900
          text-zinc-900 dark:text-zinc-50
          focus:outline-none focus:ring-2
          ${error ? 'focus:ring-red-500/40' : 'focus:ring-primary-500/40'}
          focus:border-transparent
          disabled:bg-zinc-50 dark:disabled:bg-zinc-800 disabled:cursor-not-allowed
          px-4 py-2.5
          text-sm
          transition-all
          appearance-none
          bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%23a1a1aa%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')]
          bg-[length:1.25em_1.25em]
          bg-[right_0.75rem_center]
          bg-no-repeat
          pr-10
        `}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {(error || helperText) && (
        <p className={`mt-1.5 text-xs ${error ? 'text-red-500' : 'text-zinc-400'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  )
})

Select.displayName = 'Select'

export default Input
