// Página de Experiencias/Galería
import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from '../utils/icons'
import { Button, Skeleton, EmptyState, ConfirmModal } from '../components/ui'
import { ExperienceCard, ExperienceForm, Lightbox } from '../components/experiences'
import { useInfiniteExperiences, useCreateExperience, useDeleteExperience } from '../hooks/useExperiences'
import { useAuth } from '../context/AuthContext'
import { EXPERIENCE_CATEGORIES } from '../utils/constants'
import toast from 'react-hot-toast'

const Experiencias = () => {
  const { isAdmin } = useAuth()
  const [category, setCategory] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [confirmingDelete, setConfirmingDelete] = useState(null)

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteExperiences(category, 12)

  const createExperience = useCreateExperience()
  const deleteExperience = useDeleteExperience()

  const experiences = useMemo(() => {
    return data?.pages.flatMap(page => page.experiences) || []
  }, [data])

  const imageExperiences = useMemo(() => {
    return experiences.filter(exp => exp.mediaType !== 'video')
  }, [experiences])

  const handleCreateExperience = async ({ experienceData, imageFile }) => {
    try {
      await createExperience.mutateAsync({
        experienceData,
        imageFile,
        onProgress: setUploadProgress
      })
      toast.success('Contenido subido exitosamente')
      setShowForm(false)
      setUploadProgress(0)
    } catch (error) {
      toast.error('Error al subir el contenido')
      setUploadProgress(0)
    }
  }

  const handleDeleteExperience = (experience) => {
    setConfirmingDelete(experience)
  }

  const performDelete = async () => {
    if (!confirmingDelete) return
    try {
      await deleteExperience.mutateAsync(confirmingDelete)
      toast.success('Contenido eliminado')
    } catch {
      toast.error('Error al eliminar')
    } finally {
      setConfirmingDelete(null)
    }
  }

  const handleViewExperience = useCallback((experience) => {
    if (experience.mediaType === 'video') return

    const index = imageExperiences.findIndex(exp => exp.id === experience.id)
    if (index !== -1) {
      setLightboxIndex(index)
      setLightboxOpen(true)
    }
  }, [imageExperiences])

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  return (
    <div className="px-4 sm:px-6 md:px-12 pt-8 sm:pt-10 pb-12 md:pt-14 md:pb-20 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Experiencias
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">Galería de momentos</p>
        </div>
        {isAdmin && (
          <Button
            icon={Plus}
            size="sm"
            onClick={() => setShowForm(true)}
          >
            Subir
          </Button>
        )}
      </div>

      {/* Category filters */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 mb-12">
        {EXPERIENCE_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              category === cat.value
                ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <Skeleton.ExperienceGrid count={8} />
      ) : experiences.length > 0 ? (
        <>
          <motion.div
            layout
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            <AnimatePresence>
              {experiences.map((experience, index) => (
                <motion.div
                  key={experience.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <ExperienceCard
                    experience={experience}
                    onView={handleViewExperience}
                    onDelete={handleDeleteExperience}
                    showDelete={isAdmin}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {hasNextPage && (
            <div className="mt-8 text-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                loading={isFetchingNextPage}
              >
                Cargar más
              </Button>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon="experiences"
          title="Sin contenido"
          description={
            category !== 'all'
              ? 'No hay contenido en esta categoría'
              : 'Aún no se ha subido contenido'
          }
          action={isAdmin ? () => setShowForm(true) : null}
          actionLabel="Subir contenido"
        />
      )}

      <ExperienceForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreateExperience}
        isLoading={createExperience.isPending}
        uploadProgress={uploadProgress}
      />

      <Lightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={imageExperiences}
        currentIndex={lightboxIndex}
        onIndexChange={setLightboxIndex}
      />

      <ConfirmModal
        isOpen={!!confirmingDelete}
        onClose={() => setConfirmingDelete(null)}
        onConfirm={performDelete}
        title="Eliminar contenido"
        confirmLabel="Eliminar"
        loading={deleteExperience.isPending}
      >
        {confirmingDelete && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {confirmingDelete.mediaType === 'image' && confirmingDelete.mediaUrl ? (
                <img
                  src={confirmingDelete.mediaUrl}
                  alt={confirmingDelete.title}
                  className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex-shrink-0" />
              )}
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {confirmingDelete.title}
              </p>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Esto eliminará la {confirmingDelete.mediaType === 'video' ? 'pieza' : 'foto'} definitivamente.
            </p>
          </div>
        )}
      </ConfirmModal>
    </div>
  )
}

export default Experiencias
