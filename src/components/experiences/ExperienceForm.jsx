// Formulario para subir experiencias (Admin)
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Image, Video, X, Link } from '../../utils/icons'
import { Button, Modal, Badge } from '../ui'
import Input, { Textarea, Select } from '../ui/Input'
import { EXPERIENCE_CATEGORIES } from '../../utils/constants'
import { getVideoId } from '../../utils/helpers'

const categoryOptions = EXPERIENCE_CATEGORIES.filter(c => c.value !== 'all').map(c => ({
  value: c.value,
  label: c.label
}))

const ExperienceForm = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  uploadProgress = 0
}) => {
  const [mediaType, setMediaType] = useState('image') // 'image' o 'video'
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'partidos',
    videoUrl: ''
  })
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [errors, setErrors] = useState({})
  const fileInputRef = useRef(null)

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'partidos',
      videoUrl: ''
    })
    setSelectedFile(null)
    setPreview(null)
    setErrors({})
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setErrors({ file: 'Tipo de archivo no permitido' })
      return
    }

    // Validar tamaño (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrors({ file: 'El archivo es muy grande (máx. 10MB)' })
      return
    }

    setSelectedFile(file)
    setErrors(prev => ({ ...prev, file: null }))

    // Crear preview
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido'
    }

    if (mediaType === 'image' && !selectedFile) {
      newErrors.file = 'Selecciona una imagen'
    }

    if (mediaType === 'video') {
      if (!formData.videoUrl.trim()) {
        newErrors.videoUrl = 'La URL del video es requerida'
      } else if (!getVideoId(formData.videoUrl)) {
        newErrors.videoUrl = 'URL de video no válida (YouTube o Vimeo)'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!validate()) return

    const experienceData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category,
      mediaType,
      mediaUrl: mediaType === 'video' ? formData.videoUrl : null
    }

    onSubmit({
      experienceData,
      imageFile: mediaType === 'image' ? selectedFile : null
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Subir Contenido"
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={isLoading}>
            {isLoading ? `Subiendo... ${Math.round(uploadProgress)}%` : 'Subir'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Selector de tipo */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setMediaType('image')}
            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors ${
              mediaType === 'image'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700'
                : 'border-zinc-200/60 dark:border-zinc-800 text-zinc-400'
            }`}
          >
            <Image className="w-5 h-5" />
            <span className="font-medium">Imagen</span>
          </button>
          <button
            type="button"
            onClick={() => setMediaType('video')}
            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors ${
              mediaType === 'video'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700'
                : 'border-zinc-200/60 dark:border-zinc-800 text-zinc-400'
            }`}
          >
            <Video className="w-5 h-5" />
            <span className="font-medium">Video</span>
          </button>
        </div>

        {/* Subida de imagen */}
        {mediaType === 'image' && (
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Imagen
            </label>

            <AnimatePresence mode="wait">
              {preview ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative rounded-lg overflow-hidden"
                >
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-48 object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                      errors.file
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                        : 'border-zinc-300 dark:border-zinc-600 hover:border-primary-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <Upload className="w-10 h-10 text-zinc-400 mb-2" />
                    <p className="text-sm text-zinc-400">
                      Haz clic para seleccionar o arrastra una imagen
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">
                      JPG, PNG, WebP, GIF (máx. 10MB)
                    </p>
                  </label>
                </motion.div>
              )}
            </AnimatePresence>

            {errors.file && (
              <p className="text-sm text-red-500 mt-1">{errors.file}</p>
            )}

            {/* Barra de progreso */}
            {isLoading && uploadProgress > 0 && (
              <div className="mt-2">
                <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    className="h-full bg-primary-500"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* URL de video */}
        {mediaType === 'video' && (
          <Input
            label="URL del video"
            name="videoUrl"
            value={formData.videoUrl}
            onChange={handleChange}
            placeholder="https://youtube.com/watch?v=... o https://vimeo.com/..."
            error={errors.videoUrl}
            icon={Link}
            helperText="Soportamos YouTube y Vimeo"
          />
        )}

        <Input
          label="Título"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Título del contenido"
          error={errors.title}
        />

        <Textarea
          label="Descripción (opcional)"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Descripción breve..."
          rows={3}
        />

        <Select
          label="Categoría"
          name="category"
          value={formData.category}
          onChange={handleChange}
          options={categoryOptions}
        />
      </form>
    </Modal>
  )
}

export default ExperienceForm
