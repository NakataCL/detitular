// Componente Modal reutilizable
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from '../../utils/icons'

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showClose = true,
  closeOnOverlay = true,
  closeOnEsc = true,
  footer = null,
  bottomSheet = false
}) => {
  const modalRef = useRef(null)

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  }

  useEffect(() => {
    if (!closeOnEsc) return

    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose, closeOnEsc])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Focus trap: enfoca el modal al abrir y mantiene el Tab dentro
  useEffect(() => {
    if (!isOpen) return
    const node = modalRef.current
    if (!node) return

    const previouslyFocused = document.activeElement
    // Foco inicial: primer elemento interactivo o el contenedor
    const focusables = node.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    const first = focusables[0] || node
    first.focus({ preventScroll: true })

    const handleKey = (e) => {
      if (e.key !== 'Tab') return
      const items = node.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const firstEl = items[0]
      const lastEl = items[items.length - 1]
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }

    node.addEventListener('keydown', handleKey)
    return () => {
      node.removeEventListener('keydown', handleKey)
      if (previouslyFocused && previouslyFocused.focus) {
        previouslyFocused.focus({ preventScroll: true })
      }
    }
  }, [isOpen])

  const handleOverlayClick = (e) => {
    if (closeOnOverlay && e.target === e.currentTarget) {
      onClose()
    }
  }

  const containerClass = bottomSheet
    ? 'fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4'
    : 'fixed inset-0 z-50 flex items-center justify-center p-4'

  const sheetShape = bottomSheet
    ? `relative w-full md:${sizes[size]}
       bg-white dark:bg-zinc-900
       rounded-t-3xl md:rounded-2xl shadow-xl
       border-t md:border border-zinc-200/80 dark:border-zinc-700
       max-h-[90vh] overflow-hidden
       flex flex-col
       safe-area-bottom`
    : `relative w-full ${sizes[size]}
       bg-white dark:bg-zinc-900
       rounded-2xl shadow-xl
       border border-zinc-200/80 dark:border-zinc-700
       max-h-[90vh] overflow-hidden
       flex flex-col`

  const sheetMotion = bottomSheet
    ? {
        initial: { opacity: 0, y: 60 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 60 }
      }
    : {
        initial: { opacity: 0, scale: 0.96, y: 10 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.96, y: 10 }
      }

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className={containerClass}>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleOverlayClick}
          />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            {...sheetMotion}
            transition={{ duration: 0.18 }}
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === 'string' ? title : undefined}
            tabIndex={-1}
            className={`${sheetShape} focus:outline-none`}
          >
            {/* Header */}
            {(title || showClose) && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                {title && (
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                    {title}
                  </h2>
                )}
                {showClose && (
                  <button
                    onClick={onClose}
                    aria-label="Cerrar"
                    className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  return createPortal(modalContent, document.body)
}

export default Modal
