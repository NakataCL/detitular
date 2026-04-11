// Formulario para crear/editar eventos (Admin)
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, MapPin, Users, FileText, Clock } from '../../utils/icons'
import { Button, Card, Modal } from '../ui'
import Input, { Textarea, Select } from '../ui/Input'
import { EVENT_TYPES } from '../../utils/constants'
import { format } from 'date-fns'

const eventTypeOptions = Object.entries(EVENT_TYPES).map(([value, { label }]) => ({
  value,
  label
}))

const EventForm = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    title: '',
    type: 'partido',
    date: '',
    time: '',
    maxSlots: 16,
    location: '',
    description: ''
  })
  const [errors, setErrors] = useState({})

  // Cargar datos iniciales si es edición
  useEffect(() => {
    if (initialData) {
      const date = initialData.date?.toDate
        ? initialData.date.toDate()
        : new Date(initialData.date)

      setFormData({
        title: initialData.title || '',
        type: initialData.type || 'partido',
        date: format(date, 'yyyy-MM-dd'),
        time: format(date, 'HH:mm'),
        maxSlots: initialData.maxSlots || 16,
        location: initialData.location || '',
        description: initialData.description || ''
      })
    } else {
      // Resetear formulario
      setFormData({
        title: '',
        type: 'partido',
        date: '',
        time: '',
        maxSlots: 16,
        location: '',
        description: ''
      })
    }
    setErrors({})
  }, [initialData, isOpen])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido'
    }

    if (!formData.date) {
      newErrors.date = 'La fecha es requerida'
    }

    if (!formData.time) {
      newErrors.time = 'La hora es requerida'
    }

    if (!formData.maxSlots || formData.maxSlots < 1) {
      newErrors.maxSlots = 'Debe haber al menos 1 cupo'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!validate()) return

    // Combinar fecha y hora
    const dateTime = new Date(`${formData.date}T${formData.time}`)

    const eventData = {
      title: formData.title.trim(),
      type: formData.type,
      date: dateTime,
      maxSlots: parseInt(formData.maxSlots),
      location: formData.location.trim(),
      description: formData.description.trim()
    }

    onSubmit(eventData)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Editar Evento' : 'Crear Nuevo Evento'}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={isLoading}>
            {initialData ? 'Guardar cambios' : 'Crear evento'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Título del evento"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Ej: Partido amistoso vs. Club Deportivo"
          error={errors.title}
          icon={FileText}
        />

        <Select
          label="Tipo de evento"
          name="type"
          value={formData.type}
          onChange={handleChange}
          options={eventTypeOptions}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Fecha"
            name="date"
            type="date"
            value={formData.date}
            onChange={handleChange}
            error={errors.date}
            icon={Calendar}
          />

          <Input
            label="Hora"
            name="time"
            type="time"
            value={formData.time}
            onChange={handleChange}
            error={errors.time}
            icon={Clock}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Cupos máximos"
            name="maxSlots"
            type="number"
            min="1"
            max="100"
            value={formData.maxSlots}
            onChange={handleChange}
            error={errors.maxSlots}
            icon={Users}
          />

          <Input
            label="Ubicación"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Ej: Cancha principal"
            icon={MapPin}
          />
        </div>

        <Textarea
          label="Descripción"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe los detalles del evento..."
          rows={4}
        />
      </form>
    </Modal>
  )
}

export default EventForm
