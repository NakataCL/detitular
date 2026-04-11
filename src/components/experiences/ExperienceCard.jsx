// Tarjeta de experiencia/galería
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Download, Trash2, Maximize2 } from '../../utils/icons'
import { getEmbedUrl, downloadImage } from '../../utils/helpers'
import { EXPERIENCE_CATEGORIES } from '../../utils/constants'
import { Badge } from '../ui'
import toast from 'react-hot-toast'

const ExperienceCard = ({
  experience,
  onView = null,
  onDelete = null,
  showDelete = false
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const isVideo = experience.mediaType === 'video'
  const embedUrl = isVideo ? getEmbedUrl(experience.mediaUrl) : null
  const category = EXPERIENCE_CATEGORIES.find(c => c.value === experience.category)

  const handleDownload = async (e) => {
    e.stopPropagation()
    if (!isVideo) {
      try {
        await downloadImage(experience.mediaUrl, `${experience.title}.jpg`)
        toast.success('Descargando imagen...')
      } catch {
        toast.error('Error al descargar')
      }
    }
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete(experience)
    }
  }

  const handleClick = () => {
    if (onView) {
      onView(experience)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {isVideo ? (
        <div className="w-full h-full bg-zinc-950 flex items-center justify-center">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      ) : (
        <>
          {!imageLoaded && (
            <div className="absolute inset-0 skeleton" />
          )}
          <img
            src={experience.mediaUrl}
            alt={experience.title}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
          />
        </>
      )}

      {/* Gradient overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity ${
          isHovered || isVideo ? 'opacity-100' : 'opacity-0 md:opacity-100'
        }`}
      />

      {/* Video play icon */}
      {isVideo && !isHovered && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="w-5 h-5 text-zinc-900 ml-0.5" fill="currentColor" />
          </div>
        </div>
      )}

      {/* Info */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        {category && (
          <Badge variant="secondary" size="sm" className="mb-1.5 bg-white/15 backdrop-blur text-white border-0">
            {category.label}
          </Badge>
        )}
        <h4 className="text-white font-medium text-xs line-clamp-2">
          {experience.title}
        </h4>
      </div>

      {/* Actions on hover */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        className="absolute top-2 right-2 flex gap-1"
      >
        {!isVideo && (
          <>
            <button
              onClick={handleClick}
              className="p-1.5 bg-white/90 rounded-lg hover:bg-white transition-colors"
              title="Ver grande"
            >
              <Maximize2 className="w-3.5 h-3.5 text-zinc-700" />
            </button>
            <button
              onClick={handleDownload}
              className="p-1.5 bg-white/90 rounded-lg hover:bg-white transition-colors"
              title="Descargar"
            >
              <Download className="w-3.5 h-3.5 text-zinc-700" />
            </button>
          </>
        )}

        {showDelete && (
          <button
            onClick={handleDelete}
            className="p-1.5 bg-red-500/90 rounded-lg hover:bg-red-500 transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-3.5 h-3.5 text-white" />
          </button>
        )}
      </motion.div>
    </motion.div>
  )
}

export default ExperienceCard
