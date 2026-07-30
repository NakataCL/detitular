// Detalle de un álbum: hero, toolbar, grilla de fotos, lightbox y multi-select
// para el álbum virtual "Sin clasificar". Botones admin (subir más, editar) se
// conectan en T05/T07.
import { useState, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Image as ImageIcon,
  Lock,
  Video as VideoIcon,
  Plus,
  Edit2,
  Check,
  X,
  Share2,
  Download
} from '../utils/icons'
import { shareAlbum } from '../utils/share'
import { downloadAlbumZip } from '../utils/zip'
import { Button, Skeleton, EmptyState } from '../components/ui'
import {
  Lightbox,
  AlbumCreateModal,
  AlbumPhotoUploader,
  MoveToAlbumSheet
} from '../components/experiences'
import {
  useAlbum,
  useAlbumExperiences,
  useUnclassifiedExperiences
} from '../hooks/useAlbums'
import { useDeleteExperience } from '../hooks/useExperiences'
import { useEvent } from '../hooks/useEvents'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import {
  EXPERIENCE_CATEGORIES,
  ALBUM_GRADIENTS,
  UNCLASSIFIED_ALBUM_ID
} from '../utils/constants'
import { formatDate } from '../utils/helpers'

const AlbumDetalle = () => {
  const { albumId } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const isUnclassified = albumId === UNCLASSIFIED_ALBUM_ID

  const albumQuery = useAlbum(albumId)
  const experiencesQuery = useAlbumExperiences(albumId)
  const unclassifiedQuery = useUnclassifiedExperiences()
  const linkedEventId = !isUnclassified ? albumQuery.data?.eventId : null
  const { data: linkedEvent } = useEvent(linkedEventId)

  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [moveSheetOpen, setMoveSheetOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [uploaderOpen, setUploaderOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)

  // El álbum virtual "Sin clasificar" no tiene doc Firestore; sintetizamos uno.
  const album = isUnclassified
    ? {
        id: UNCLASSIFIED_ALBUM_ID,
        title: 'Sin clasificar',
        category: 'otro',
        isPublic: false,
        date: null,
        description:
          'Fotos sueltas que aún no pertenecen a ningún álbum. Selecciónalas y muévelas al álbum correspondiente.'
      }
    : albumQuery.data

  const experiences = useMemo(
    () => (isUnclassified ? unclassifiedQuery.data : experiencesQuery.data) || [],
    [isUnclassified, unclassifiedQuery.data, experiencesQuery.data]
  )

  const isLoading = isUnclassified ? unclassifiedQuery.isLoading : albumQuery.isLoading

  const imageExperiences = useMemo(
    () => experiences.filter((e) => e.mediaType !== 'video'),
    [experiences]
  )
  const videoCount = useMemo(
    () => experiences.filter((e) => e.mediaType === 'video').length,
    [experiences]
  )

  const exitSelectMode = useCallback(() => {
    setSelectMode(false)
    setSelectedIds(new Set())
  }, [])

  const toggleSelected = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const { mutate: deletePhoto } = useDeleteExperience()

  // Borrado de una foto desde el lightbox. Al quitarla, la lista se corre sola:
  // solo hay que cerrar si era la última y acotar el índice si era la del final.
  const handleDeletePhoto = (photo) => {
    if (!photo) return
    if (!window.confirm('¿Eliminar esta foto? Esta acción no se puede deshacer.')) return
    deletePhoto(photo, {
      onSuccess: () => {
        toast.success('Foto eliminada')
        const remaining = imageExperiences.length - 1
        if (remaining <= 0) setLightboxOpen(false)
        else setLightboxIndex((i) => Math.min(i, remaining - 1))
      },
      onError: () => toast.error('No se pudo eliminar la foto')
    })
  }

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(experiences.map((e) => e.id)))
  }, [experiences])

  // Restringir "Sin clasificar" a admins (defensivo: redirige si no admin).
  if (isUnclassified && isAdmin === false) {
    navigate('/experiencias', { replace: true })
    return null
  }

  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 md:px-12 pt-8 pb-12 max-w-5xl mx-auto space-y-6">
        <Skeleton variant="card" className="h-32 rounded-2xl" />
        <Skeleton.AlbumGrid count={9} />
      </div>
    )
  }

  if (!album) {
    return (
      <div className="px-4 sm:px-6 md:px-12 pt-8 pb-12 max-w-5xl mx-auto">
        <EmptyState
          icon="experiences"
          title="Álbum no encontrado"
          description="Es posible que sea privado o haya sido eliminado."
        />
      </div>
    )
  }

  const gradient = ALBUM_GRADIENTS[album.category] || 'from-zinc-700 to-zinc-900'
  const categoryLabel =
    EXPERIENCE_CATEGORIES.find((c) => c.value === album.category)?.label ||
    album.category

  const handleViewExperience = (experience) => {
    if (selectMode) {
      toggleSelected(experience.id)
      return
    }
    if (experience.mediaType === 'video') return
    const idx = imageExperiences.findIndex((e) => e.id === experience.id)
    if (idx !== -1) {
      setLightboxIndex(idx)
      setLightboxOpen(true)
    }
  }

  return (
    <div className="pb-32">
      {/* Hero */}
      <div className={`bg-gradient-to-br ${gradient}`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-12 pt-5 pb-7 text-white">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Volver"
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-black/25 hover:bg-black/40 transition-colors focus:outline-none focus:ring-2 focus:ring-white/70"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="mt-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/20 text-xs font-semibold">
                {categoryLabel}
              </span>
              {album.isPublic === false && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 text-xs font-semibold">
                  <Lock className="w-3 h-3" /> Privado
                </span>
              )}
            </div>
            <h1 className="font-display text-4xl md:text-5xl tracking-wide leading-none text-balance">
              {album.title}
            </h1>
            <p className="text-sm text-white/80 mt-2">
              {album.date ? formatDate(album.date, "d 'de' MMMM 'de' yyyy") + ' · ' : ''}
              {imageExperiences.length} fotos
              {videoCount > 0 ? ` · ${videoCount} videos` : ''}
              {album.eventId && (
                <>
                  {' · '}
                  <button
                    type="button"
                    onClick={() => navigate(`/eventos/${album.eventId}`)}
                    className="font-medium underline underline-offset-2 hover:text-white"
                  >
                    {linkedEvent?.title || 'Ver evento'}
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Barra de acciones */}
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-12 py-2 flex items-center gap-1 overflow-x-auto no-scrollbar">
          {!isUnclassified && album.isPublic && (
            <Button
              variant="ghost"
              size="sm"
              icon={Share2}
              aria-label="Compartir"
              onClick={() => shareAlbum(album)}
            >
              <span className="hidden sm:inline">Compartir</span>
            </Button>
          )}

          {isAdmin && !isUnclassified && experiences.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              icon={Download}
              aria-label="Descargar álbum"
              loading={downloading}
              onClick={async () => {
                setDownloading(true)
                try {
                  await downloadAlbumZip(album, experiences)
                } finally {
                  setDownloading(false)
                }
              }}
            >
              <span className="hidden sm:inline">Descargar</span>
            </Button>
          )}

          <div className="flex-1 min-w-2" />

          {isAdmin && !isUnclassified && (
            <>
              <Button
                variant="ghost"
                size="sm"
                icon={Edit2}
                aria-label="Editar álbum"
                onClick={() => setEditOpen(true)}
              >
                <span className="hidden sm:inline">Editar</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => setUploaderOpen(true)}
              >
                Subir más
              </Button>
            </>
          )}

          {isAdmin && isUnclassified && experiences.length > 0 && (
            <Button
              variant={selectMode ? 'ghost' : 'primary'}
              size="sm"
              icon={selectMode ? X : Check}
              onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
            >
              {selectMode ? 'Cancelar' : 'Seleccionar'}
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-12">
        {album.description && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-4 leading-relaxed max-w-[70ch]">
            {album.description}
          </p>
        )}

        {/* Acción "seleccionar todas" para Sin clasificar */}
        {isUnclassified && selectMode && experiences.length > 0 && experiences.length < 100 && (
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={selectAll}
              className="text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:underline"
            >
              Seleccionar todas ({experiences.length})
            </button>
            {selectedIds.size > 0 && (
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-xs font-medium text-zinc-500 hover:underline"
              >
                Limpiar selección
              </button>
            )}
          </div>
        )}
      </div>

      {/* Grilla de fotos */}
      <div className="px-4 sm:px-6 md:px-12 max-w-5xl mx-auto mt-6">
        {experiences.length === 0 ? (
          <EmptyState
            icon="experiences"
            title="Sin fotos todavía"
            description={
              isAdmin && !isUnclassified
                ? 'Sube las primeras fotos a este álbum.'
                : isUnclassified
                  ? 'No hay fotos sin clasificar — todas pertenecen a un álbum.'
                  : 'El admin aún no ha subido contenido a este álbum.'
            }
            action={isAdmin && !isUnclassified ? () => setUploaderOpen(true) : null}
            actionLabel="Subir fotos"
          />
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {experiences.map((exp) => {
              const selected = selectedIds.has(exp.id)
              return (
                <button
                  key={exp.id}
                  type="button"
                  onClick={() => handleViewExperience(exp)}
                  className={`relative aspect-square overflow-hidden bg-zinc-200 dark:bg-zinc-800 group ${
                    selected ? 'ring-2 ring-primary-500' : ''
                  }`}
                >
                  {exp.mediaUrl ? (
                    <img
                      src={exp.mediaUrl}
                      alt={exp.title || ''}
                      loading="lazy"
                      className={`w-full h-full object-cover transition-transform duration-200 ${
                        selectMode ? '' : 'group-hover:scale-105'
                      } ${selected ? 'opacity-70' : ''}`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-400">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}
                  {exp.mediaType === 'video' && (
                    <span className="absolute top-1 right-1 inline-flex items-center justify-center w-6 h-6 rounded-full bg-black/55 text-white">
                      <VideoIcon className="w-3 h-3" />
                    </span>
                  )}
                  {selectMode && (
                    <span
                      className={`absolute top-1 left-1 inline-flex items-center justify-center w-6 h-6 rounded-full border-2 ${
                        selected
                          ? 'bg-primary-500 border-primary-500 text-white'
                          : 'bg-white/70 border-white text-transparent'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer sticky para multi-select */}
      {isUnclassified && selectMode && selectedIds.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 pb-nav z-30 px-4 pb-3 pt-3 bg-white/95 dark:bg-zinc-950/95 backdrop-blur border-t border-zinc-200 dark:border-zinc-800">
          <div className="max-w-5xl mx-auto flex items-center gap-3">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {selectedIds.size} {selectedIds.size === 1 ? 'seleccionada' : 'seleccionadas'}
            </p>
            <div className="flex-1" />
            <Button
              variant="primary"
              size="sm"
              onClick={() => setMoveSheetOpen(true)}
            >
              Mover a álbum…
            </Button>
          </div>
        </div>
      )}

      <Lightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={imageExperiences}
        currentIndex={lightboxIndex}
        onIndexChange={setLightboxIndex}
        albumTitle={album.title}
        onDelete={isAdmin ? handleDeletePhoto : null}
      />

      {/* Sheet "Mover a álbum" (T06) */}
      <MoveToAlbumSheet
        isOpen={moveSheetOpen}
        onClose={() => setMoveSheetOpen(false)}
        experienceIds={[...selectedIds]}
        onMoved={() => {
          setMoveSheetOpen(false)
          exitSelectMode()
        }}
      />

      {/* Modal de edición de metadata (T07 conectará vínculo evento) */}
      {editOpen && !isUnclassified && (
        <AlbumCreateModal
          mode="edit"
          album={album}
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
        />
      )}

      {/* Subida masiva al álbum existente (T05) */}
      {uploaderOpen && !isUnclassified && (
        <AlbumPhotoUploader
          isOpen={uploaderOpen}
          onClose={() => setUploaderOpen(false)}
          albumId={album.id}
          category={album.category}
        />
      )}
    </div>
  )
}

export default AlbumDetalle
