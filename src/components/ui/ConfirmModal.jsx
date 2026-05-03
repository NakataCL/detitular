// Modal de confirmación reutilizable — sustituye a window.confirm
import Modal from './Modal'
import Button from './Button'

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = '¿Estás seguro?',
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  confirmVariant = 'danger',
  loading = false,
  children
}) => {
  const handleConfirm = async () => {
    await onConfirm?.()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      closeOnOverlay={!loading}
      closeOnEsc={!loading}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={handleConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      {description && (
        <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
          {description}
        </p>
      )}
      {children}
    </Modal>
  )
}

export default ConfirmModal
