// Formulario de edición de perfil
import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Camera, User, Phone, MapPin, Save } from '../../utils/icons'
import { Button, Avatar, Card } from '../ui'
import Input, { Select } from '../ui/Input'
import { POSITIONS, FOOT_OPTIONS } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'
import { useUpdateProfile, useUploadProfilePhoto } from '../../hooks/usePlayer'
import toast from 'react-hot-toast'

const ProfileForm = ({ player, onSuccess = null }) => {
  const { user, refreshUserData } = useAuth()
  const updateProfile = useUpdateProfile()
  const uploadPhoto = useUploadProfilePhoto()

  const [formData, setFormData] = useState({
    nombre: player?.nombre || player?.displayName || '',
    edad: player?.edad || '',
    telefono: player?.telefono || '',
    ciudad: player?.ciudad || '',
    posicionPrincipal: player?.posicionPrincipal || '',
    posicionSecundaria: player?.posicionSecundaria || '',
    pieHabil: player?.pieHabil || '',
    numeroCamiseta: player?.numeroCamiseta || ''
  })
  const [photoPreview, setPhotoPreview] = useState(null)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const fileInputRef = useRef(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast.error('Selecciona una imagen válida')
      return
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen es muy grande (máx. 5MB)')
      return
    }

    setSelectedPhoto(file)

    // Preview
    const reader = new FileReader()
    reader.onload = (e) => setPhotoPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      // Subir foto si hay una nueva
      if (selectedPhoto) {
        await uploadPhoto.mutateAsync(selectedPhoto)
      }

      // Actualizar datos del perfil
      await updateProfile.mutateAsync({
        nombre: formData.nombre.trim(),
        edad: formData.edad ? parseInt(formData.edad) : null,
        telefono: formData.telefono.trim(),
        ciudad: formData.ciudad.trim(),
        posicionPrincipal: formData.posicionPrincipal,
        posicionSecundaria: formData.posicionSecundaria,
        pieHabil: formData.pieHabil,
        numeroCamiseta: formData.numeroCamiseta ? parseInt(formData.numeroCamiseta) : null
      })

      toast.success('Perfil actualizado correctamente')
      setSelectedPhoto(null)
      setPhotoPreview(null)
      onSuccess?.()
    } catch (error) {
      toast.error('Error al actualizar el perfil')
      console.error(error)
    }
  }

  const isLoading = updateProfile.isPending || uploadPhoto.isPending

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Foto de perfil */}
      <Card className="flex flex-col items-center py-6">
        <div className="relative mb-4">
          <Avatar
            src={photoPreview || player?.photoURL || user?.photoURL}
            name={formData.nombre}
            size="2xl"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 p-2 bg-primary-600 rounded-full text-white hover:bg-primary-700 transition-colors shadow-lg"
          >
            <Camera className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoSelect}
            className="hidden"
          />
        </div>
        <p className="text-sm text-zinc-400">
          Toca el ícono para cambiar tu foto
        </p>
      </Card>

      {/* Datos personales */}
      <Card>
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
          Datos Personales
        </h3>
        <div className="space-y-4">
          <Input
            label="Nombre completo"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Tu nombre"
            icon={User}
            autoComplete="name"
            autoCapitalize="words"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Edad"
              name="edad"
              type="number"
              min="5"
              max="99"
              value={formData.edad}
              onChange={handleChange}
              placeholder="Ej: 25"
              inputMode="numeric"
              autoComplete="off"
            />

            <Input
              label="Teléfono"
              name="telefono"
              type="tel"
              value={formData.telefono}
              onChange={handleChange}
              placeholder="+1 234 567 8900"
              icon={Phone}
              inputMode="tel"
              autoComplete="tel"
            />
          </div>

          <Input
            label="Ciudad"
            name="ciudad"
            value={formData.ciudad}
            onChange={handleChange}
            placeholder="Tu ciudad"
            icon={MapPin}
            autoComplete="address-level2"
            autoCapitalize="words"
          />
        </div>
      </Card>

      {/* Datos futbolísticos */}
      <Card>
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
          Datos Futbolísticos
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Posición principal"
              name="posicionPrincipal"
              value={formData.posicionPrincipal}
              onChange={handleChange}
              options={POSITIONS}
              placeholder="Seleccionar..."
            />

            <Select
              label="Posición secundaria"
              name="posicionSecundaria"
              value={formData.posicionSecundaria}
              onChange={handleChange}
              options={POSITIONS}
              placeholder="Seleccionar..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Pie hábil"
              name="pieHabil"
              value={formData.pieHabil}
              onChange={handleChange}
              options={FOOT_OPTIONS}
              placeholder="Seleccionar..."
            />

            <Input
              label="Número de camiseta"
              name="numeroCamiseta"
              type="number"
              min="1"
              max="99"
              value={formData.numeroCamiseta}
              onChange={handleChange}
              placeholder="Ej: 10"
              inputMode="numeric"
              autoComplete="off"
            />
          </div>
        </div>
      </Card>

      {/* Botón guardar */}
      <Button
        type="submit"
        fullWidth
        size="lg"
        loading={isLoading}
        icon={Save}
      >
        Guardar cambios
      </Button>
    </form>
  )
}

export default ProfileForm
