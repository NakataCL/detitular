// Modal para crear o editar un álbum.
// - Paso 1: metadata (título, descripción, categoría, fecha, evento, público).
// - Paso 2: subida de fotos vía UploaderPanel (solo en modo create sin skip).
// - Modo edit: solo paso 1, usa useUpdateAlbum.
// - Modo create + skipPhotoUpload: paso 1 dispara onCreated(album) y cierra.
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal, Button } from '../ui'
import Input, { Textarea, Select } from '../ui/Input'
import { Calendar, Save } from '../../utils/icons'
import { EXPERIENCE_CATEGORIES } from '../../utils/constants'
import { useCreateAlbum, useUpdateAlbum } from '../../hooks/useAlbums'
import { useVisibleActiveEvents } from '../../hooks/useEvents'
import { UploaderPanel } from './AlbumPhotoUploader'
import toast from 'react-hot-toast'

const todayInputValue = () => new Date().toISOString().slice(0, 10)

const toDateInputValue = (value) => {
  if (!value) return todayInputValue()
  const d = value.toDate ? value.toDate() : new Date(value)
  if (isNaN(d)) return todayInputValue()
  return d.toISOString().slice(0, 10)
}

const fromDateInputValue = (str) => {
  if (!str) return null
  // Mediodía local para evitar saltos de día por TZ.
  return new Date(`${str}T12:00:00`)
}

const buildInitialForm = (album) => ({
  title: album?.title || '',
  description: album?.description || '',
  category: album?.category || 'partido',
  date: toDateInputValue(album?.date),
  eventId: album?.eventId || '',
  isPublic: album?.isPublic !== false
})

const AlbumCreateModal = ({
  mode = 'create',
  album = null,
  isOpen,
  onClose,
  skipPhotoUpload = false,
  onCreated = null
}) => {
  const navigate = useNavigate()
  const createAlbum = useCreateAlbum()
  const updateAlbum = useUpdateAlbum()
  const { data: events = [] } = useVisibleActiveEvents()

  const [step, setStep] = useState(1)
  const [form, setForm] = useState(() => buildInitialForm(album))
  const [savedAlbum, setSavedAlbum] = useState(null)
  const [errors, setErrors] = useState({})

  // Reset al abrir / al cambiar el álbum a editar. Esta es la forma natural
  // de reiniciar estado interno cuando un modal vuelve a montarse lógicamente.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!isOpen) return
    setStep(1)
    setSavedAlbum(null)
    setErrors({})
    setForm(buildInitialForm(album))
  }, [isOpen, album])
  /* eslint-enable react-hooks/set-state-in-effect */

  const eventOptions = useMemo(
    () => events.map((e) => ({ value: e.id, label: e.title })),
    [events]
  )

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }))
  }

  const handleEventChange = (eventId) => {
    if (!eventId) {
      setField('eventId', '')
      return
    }
    const ev = events.find((e) => e.id === eventId)
    if (!ev) return
    setForm((prev) => ({
      ...prev,
      eventId,
      title: prev.title || ev.title || '',
      category: ev.type || prev.category,
      date: toDateInputValue(ev.date)
    }))
  }

  const validate = () => {
    const next = {}
    if (!form.title.trim()) next.title = 'Requerido'
    if (!form.category) next.category = 'Requerido'
    if (!form.date) next.date = 'Requerido'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSaveStep1 = async () => {
    if (!validate()) return

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      date: fromDateInputValue(form.date),
      eventId: form.eventId || null,
      isPublic: !!form.isPublic
    }

    try {
      if (mode === 'edit' && album?.id) {
        await updateAlbum.mutateAsync({ albumId: album.id, updates: payload })
        toast.success('Álbum actualizado')
        onClose()
        return
      }

      const created = await createAlbum.mutateAsync(payload)
      toast.success('Álbum creado')
      setSavedAlbum(created)

      if (skipPhotoUpload) {
        if (onCreated) onCreated(created)
        onClose()
        return
      }

      setStep(2)
    } catch (e) {
      toast.error(mode === 'edit' ? 'No se pudo actualizar' : 'No se pudo crear')
      console.error(e)
    }
  }

  const handleFinish = () => {
    onClose()
    if (savedAlbum?.id) navigate(`/experiencias/${savedAlbum.id}`)
  }

  const isSaving = createAlbum.isPending || updateAlbum.isPending
  const title = mode === 'edit' ? 'Editar álbum' : step === 1 ? 'Crear álbum' : 'Subir fotos'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      {step === 1 && (
        <div className="space-y-4">
          <Input
            label="Título"
            name="title"
            value={form.title}
            onChange={(e) => setField('title', e.target.value)}
            error={errors.title}
            placeholder="Ej. Liga Juvenil — J4 vs Atlético Norte"
            autoFocus
          />

          <Textarea
            label="Descripción (opcional)"
            name="description"
            rows={3}
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            placeholder="Qué pasó, contexto, etc."
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Categoría"
              value={form.category}
              onChange={(e) => setField('category', e.target.value)}
              options={EXPERIENCE_CATEGORIES}
              placeholder="Seleccionar"
              error={errors.category}
            />
            <Input
              label="Fecha"
              type="date"
              icon={Calendar}
              value={form.date}
              onChange={(e) => setField('date', e.target.value)}
              error={errors.date}
            />
          </div>

          <Select
            label="Vincular a evento (opcional)"
            value={form.eventId}
            onChange={(e) => handleEventChange(e.target.value)}
            options={eventOptions}
            placeholder="Sin evento"
          />

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.isPublic}
              onChange={(e) => setField('isPublic', e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              Visible para todos los usuarios
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveStep1}
              loading={isSaving}
              icon={mode === 'edit' ? Save : null}
            >
              {mode === 'edit'
                ? 'Guardar'
                : skipPhotoUpload
                  ? 'Crear álbum'
                  : 'Siguiente'}
            </Button>
          </div>
        </div>
      )}

      {step === 2 && savedAlbum && (
        <div className="space-y-4">
          <UploaderPanel
            albumId={savedAlbum.id}
            category={savedAlbum.category}
          />
          <div className="flex justify-end pt-2">
            <Button onClick={handleFinish}>Listo</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default AlbumCreateModal
