// Detalle de un álbum: hero, toolbar, grilla de fotos y lightbox.
// (T03 implementa la base; T04 añade multi-select, edición y enlaces a evento;
// T08 añade compartir y descarga ZIP.)
import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Image as ImageIcon,
  Lock,
  Video as VideoIcon
} from '../utils/icons'
import { Button, Skeleton, EmptyState, Badge } from '../components/ui'
import { Lightbox } from '../components/experiences'
import { useAlbum, useAlbumExperiences, useUnclassifiedExperiences } from '../hooks/useAlbums'
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

  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // El álbum virtual "Sin clasificar" no tiene doc Firestore; sintetizamos uno.
  const album = isUnclassified
    ? {
        id: UNCLASSIFIED_ALBUM_ID,
        title: 'Sin clasificar',
        category: 'otro',
        isPublic: false,
        date: null,
        description: 'Fotos sueltas que aún no pertenecen a ningún álbum.'
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
    if (experience.mediaType === 'video') return
    const idx = imageExperiences.findIndex((e) => e.id === experience.id)
    if (idx !== -1) {
      setLightboxIndex(idx)
      setLightboxOpen(true)
    }
  }

  return (
    <div className="pb-16">
      {/* Hero banner */}
      <div
        className={`relative bg-gradient-to-br ${gradient} text-white px-4 sm:px-6 md:px-12 pt-6 pb-8`}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Volver"
          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-black/25 hover:bg-black/40 backdrop-blur-sm transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="max-w-5xl mx-auto">
          <h1 className="font-display text-3xl md:text-4xl tracking-wide leading-tight">
            {album.title}
          </h1>
          <p className="text-sm text-white/85 mt-2">
            {album.date ? formatDate(album.date, "d 'de' MMMM 'de' yyyy") + ' · ' : ''}
            {categoryLabel} · {imageExperiences.length} fotos
            {videoCount > 0 ? ` · ${videoCount} videos` : ''}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-4 sm:px-6 md:px-12 max-w-5xl mx-auto -mt-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-3 flex items-center gap-2 flex-wrap shadow-sm">
          <Badge variant={album.category}>{categoryLabel}</Badge>
          {album.isPublic === false && (
            <Badge variant="secondary" className="inline-flex items-center gap-1">
              <Lock className="w-3 h-3" /> Privado
            </Badge>
          )}
          {album.eventId && (
            <Badge variant="info">Vinculado al evento</Badge>
          )}
        </div>

        {album.description && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-4 leading-relaxed">
            {album.description}
          </p>
        )}
      </div>

      {/* Grilla de fotos */}
      <div className="px-4 sm:px-6 md:px-12 max-w-5xl mx-auto mt-6">
        {experiences.length === 0 ? (
          <EmptyState
            icon="experiences"
            title="Sin fotos todavía"
            description={
              isAdmin
                ? 'Sube las primeras fotos a este álbum.'
                : 'El admin aún no ha subido contenido a este álbum.'
            }
          />
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {experiences.map((exp) => (
              <button
                key={exp.id}
                type="button"
                onClick={() => handleViewExperience(exp)}
                className="relative aspect-square overflow-hidden bg-zinc-200 dark:bg-zinc-800 group"
              >
                {exp.mediaUrl ? (
                  <img
                    src={exp.mediaUrl}
                    alt={exp.title || ''}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
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
              </button>
            ))}
          </div>
        )}
      </div>

      <Lightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={imageExperiences}
        currentIndex={lightboxIndex}
        onIndexChange={setLightboxIndex}
      />
    </div>
  )
}

export default AlbumDetalle
