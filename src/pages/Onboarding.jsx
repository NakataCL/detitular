// Alta de perfil para cuentas creadas con teléfono (no traen nombre ni foto)
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { Button, Card, Input, Select } from '../components/ui'
import { updateUser } from '../firebase/firestore'
import { POSITIONS } from '../utils/constants'
import toast from 'react-hot-toast'

const Onboarding = () => {
  const navigate = useNavigate()
  const { user, refreshUserData } = useAuth()

  const [nombre, setNombre] = useState('')
  const [posicion, setPosicion] = useState('')
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (saving) return

    const nextErrors = {}
    if (nombre.trim().length < 3) nextErrors.nombre = 'Escribe tu nombre completo'
    if (!posicion) nextErrors.posicion = 'Elige tu posición'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setSaving(true)
    try {
      await updateUser(user.uid, {
        nombre: nombre.trim(),
        displayName: nombre.trim(),
        posicionPrincipal: posicion
      })
      await refreshUserData()
      toast.success(`¡Bienvenido, ${nombre.trim().split(' ')[0]}!`)
      navigate('/', { replace: true })
    } catch (error) {
      console.error(error)
      toast.error('No pudimos guardar tus datos')
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#fafafa] dark:bg-zinc-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight mb-1.5">
            Cuéntanos quién eres
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Así te reconocemos cuando armemos los equipos
          </p>
        </div>

        <Card className="p-8 dark:border-zinc-600 dark:bg-zinc-800/60">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Nombre completo"
              autoFocus
              autoComplete="name"
              placeholder="Juan Pérez"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              error={errors.nombre}
              disabled={saving}
            />

            <Select
              label="Posición preferencial"
              placeholder="Elige tu posición"
              options={POSITIONS}
              value={posicion}
              onChange={(e) => setPosicion(e.target.value)}
              error={errors.posicion}
              disabled={saving}
            />

            <Button type="submit" fullWidth size="lg" loading={saving}>
              Empezar
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}

export default Onboarding
