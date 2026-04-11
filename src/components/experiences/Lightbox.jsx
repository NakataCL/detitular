// Lightbox para ver imágenes en grande
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from '../../utils/icons'
import { downloadImage } from '../../utils/helpers'
import toast from 'react-hot-toast'

const Lightbox = ({
  isOpen,
  onClose,
  images = [],
  currentIndex = 0,
  onIndexChange = null
}) => {
  const [index, setIndex] = useState(currentIndex)
  const [zoom, setZoom] = useState(1)

  useEffect(() => {
    setIndex(currentIndex)
    setZoom(1)
  }, [currentIndex, isOpen])

  // Navegación con teclado
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          goToPrev()
          break
        case 'ArrowRight':
          goToNext()
          break
        default:
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, index])

  // Bloquear scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const currentImage = images[index]

  const goToPrev = () => {
    const newIndex = index > 0 ? index - 1 : images.length - 1
    setIndex(newIndex)
    setZoom(1)
    onIndexChange?.(newIndex)
  }

  const goToNext = () => {
    const newIndex = index < images.length - 1 ? index + 1 : 0
    setIndex(newIndex)
    setZoom(1)
    onIndexChange?.(newIndex)
  }

  const handleDownload = async () => {
    if (currentImage) {
      try {
        await downloadImage(
          currentImage.mediaUrl,
          `${currentImage.title || 'imagen'}.jpg`
        )
        toast.success('Descargando...')
      } catch {
        toast.error('Error al descargar')
      }
    }
  }

  const toggleZoom = () => {
    setZoom(zoom === 1 ? 2 : 1)
  }

  if (!images.length) return null

  const content = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
          onClick={onClose}
        >
          {/* Toolbar */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-10">
            <div className="text-white">
              <span className="text-sm opacity-75">
                {index + 1} / {images.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleZoom()
                }}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              >
                {zoom === 1 ? (
                  <ZoomIn className="w-5 h-5" />
                ) : (
                  <ZoomOut className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDownload()
                }}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Imagen principal */}
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="relative max-w-full max-h-full p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentImage?.mediaUrl}
              alt={currentImage?.title}
              className="max-w-full max-h-[80vh] object-contain transition-transform duration-200"
              style={{ transform: `scale(${zoom})` }}
            />
          </motion.div>

          {/* Navegación */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  goToPrev()
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  goToNext()
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Título */}
          {currentImage?.title && (
            <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
              <p className="text-white font-medium">{currentImage.title}</p>
              {currentImage.description && (
                <p className="text-white/70 text-sm mt-1">
                  {currentImage.description}
                </p>
              )}
            </div>
          )}

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 max-w-full overflow-x-auto no-scrollbar px-4">
              {images.map((img, i) => (
                <button
                  key={img.id || i}
                  onClick={(e) => {
                    e.stopPropagation()
                    setIndex(i)
                    setZoom(1)
                    onIndexChange?.(i)
                  }}
                  className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                    i === index
                      ? 'border-white scale-110'
                      : 'border-transparent opacity-50 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img.mediaUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )

  return createPortal(content, document.body)
}

export default Lightbox
