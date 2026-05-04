// Subida masiva de fotos a un álbum.
// - Drag & drop real + file picker múltiple.
// - Cola con concurrencia limitada a 4 sin dependencias.
// - Progreso por archivo, retry individual y selección de portada.
// Exporta UploaderPanel para usarse embebido (T05/AlbumCreateModal step 2)
// y un wrapper AlbumPhotoUploader que lo monta dentro de un Modal.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Modal,
  Button,
  EmptyState
} from '../ui'
import {
  Upload,
  Image as ImageIcon,
  Check,
  X,
  AlertCircle
} from '../../utils/icons'
import { uploadExperienceImage } from '../../services/cloudinary'
import { createExperience, setAlbumCover } from '../../firebase/firestore'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const CONCURRENCY = 4
const MAX_FILE_MB = 10
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const validate = (file) => {
  if (!ACCEPTED.includes(file.type)) {
    return `Formato no permitido (${file.name})`
  }
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    return `Excede ${MAX_FILE_MB}MB (${file.name})`
  }
  return null
}

/**
 * Panel sin Modal — útil para embeber dentro de otro modal (AlbumCreateModal).
 */
export const UploaderPanel = ({ albumId, category, onAllDone }) => {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [files, setFiles] = useState([])
  const [dragging, setDragging] = useState(false)
  const [coverPickedId, setCoverPickedId] = useState(null)
  const fileInputRef = useRef(null)

  // Cola con concurrencia. cancelledRef permite vaciar pendientes sin abortar
  // los que ya están subiendo.
  const cancelledRef = useRef(false)
  const runningRef = useRef(0)
  const queueRef = useRef([])

  // Limpia object URLs creados para los previews al desmontar.
  useEffect(() => {
    return () => {
      files.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateFile = (id, patch) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)))
  }

  const removeFile = (id) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id)
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((f) => f.id !== id)
    })
  }

  const processNext = () => {
    while (runningRef.current < CONCURRENCY && queueRef.current.length > 0) {
      if (cancelledRef.current) {
        queueRef.current = []
        break
      }
      const fn = queueRef.current.shift()
      runningRef.current++
      fn().finally(() => {
        runningRef.current--
        processNext()
        if (runningRef.current === 0 && queueRef.current.length === 0) {
          // Todos terminaron — invalidar cache de álbum y galería.
          queryClient.invalidateQueries({ queryKey: ['albums'] })
          if (albumId) {
            queryClient.invalidateQueries({ queryKey: ['album', albumId] })
            queryClient.invalidateQueries({ queryKey: ['album', albumId, 'experiences'] })
          }
          if (onAllDone) onAllDone()
        }
      })
    }
  }

  const uploadOne = async (entry) => {
    updateFile(entry.id, { status: 'uploading', progress: 0, error: null })
    try {
      const url = await uploadExperienceImage(entry.file, category, (p) => {
        updateFile(entry.id, { progress: p })
      })
      const exp = await createExperience(
        {
          title: entry.file.name.replace(/\.[^/.]+$/, ''),
          description: '',
          category,
          mediaUrl: url,
          mediaType: 'image',
          albumId: albumId || null
        },
        user.uid
      )
      updateFile(entry.id, { status: 'done', progress: 100, experienceId: exp.id })
    } catch (e) {
      updateFile(entry.id, { status: 'error', error: e?.message || 'Error desconocido' })
    }
  }

  const enqueue = (entry) => {
    queueRef.current.push(() => uploadOne(entry))
    processNext()
  }

  const addFiles = (fileList) => {
    cancelledRef.current = false
    const incoming = Array.from(fileList || [])
    const accepted = []
    for (const file of incoming) {
      const err = validate(file)
      if (err) {
        toast.error(err)
        continue
      }
      const id = newId()
      const previewUrl = URL.createObjectURL(file)
      const entry = { id, file, previewUrl, status: 'pending', progress: 0 }
      accepted.push(entry)
    }
    if (accepted.length === 0) return
    setFiles((prev) => [...prev, ...accepted])
    accepted.forEach(enqueue)
  }

  const retry = (id) => {
    cancelledRef.current = false
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, status: 'pending', error: null, progress: 0 } : f)))
    setTimeout(() => {
      const entry = files.find((f) => f.id === id)
      if (entry) enqueue(entry)
    }, 0)
  }

  const cancelPending = () => {
    cancelledRef.current = true
    queueRef.current = []
    setFiles((prev) =>
      prev.map((f) => (f.status === 'pending' ? { ...f, status: 'error', error: 'Cancelado' } : f))
    )
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files)
  }

  const handleSetCover = async (entry) => {
    if (!albumId || !entry.experienceId) return
    try {
      await setAlbumCover(albumId, entry.experienceId)
      setCoverPickedId(entry.id)
      queryClient.invalidateQueries({ queryKey: ['albums'] })
      queryClient.invalidateQueries({ queryKey: ['album', albumId] })
      toast.success('Portada actualizada')
    } catch (e) {
      toast.error('No se pudo actualizar la portada')
      console.error(e)
    }
  }

  const stats = useMemo(() => {
    const total = files.length
    const done = files.filter((f) => f.status === 'done').length
    const errored = files.filter((f) => f.status === 'error').length
    const inFlight = files.filter((f) => f.status === 'uploading' || f.status === 'pending').length
    return { total, done, errored, inFlight }
  }, [files])

  const allDone = stats.total > 0 && stats.inFlight === 0

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragEnter={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={(e) => { e.preventDefault(); if (e.currentTarget === e.target) setDragging(false) }}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-colors ${
          dragging
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
            : 'border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800'
        }`}
      >
        <Upload className="w-8 h-8 text-zinc-500 dark:text-zinc-400" />
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
          Arrastra fotos aquí o haz clic para seleccionar
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          JPEG, PNG, WebP o GIF · máx {MAX_FILE_MB}MB cada una
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED.join(',')}
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {/* Resumen */}
      {stats.total > 0 && (
        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>
            {stats.done}/{stats.total} subidas
            {stats.errored > 0 ? ` · ${stats.errored} con error` : ''}
          </span>
          {stats.inFlight > 0 && (
            <button
              type="button"
              onClick={cancelPending}
              className="text-xs text-red-600 hover:underline"
            >
              Cancelar pendientes
            </button>
          )}
        </div>
      )}

      {/* Grid de archivos */}
      {files.length === 0 ? (
        <EmptyState
          icon="experiences"
          title="Aún no has añadido fotos"
          description="Selecciona o arrastra archivos para empezar."
        />
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {files.map((entry) => (
            <FileTile
              key={entry.id}
              entry={entry}
              isCover={coverPickedId === entry.id}
              canPickCover={!!albumId && entry.status === 'done'}
              onPickCover={() => handleSetCover(entry)}
              onRetry={() => retry(entry.id)}
              onRemove={() => removeFile(entry.id)}
            />
          ))}
        </div>
      )}

      {/* Mensaje cuando todo terminó */}
      {allDone && stats.errored === 0 && albumId && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
          ¡Listo! Toca una miniatura para usarla como portada.
        </p>
      )}
    </div>
  )
}

const FileTile = ({ entry, isCover, canPickCover, onPickCover, onRetry, onRemove }) => {
  const status = entry.status
  return (
    <div className="relative aspect-square rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 group">
      {entry.previewUrl ? (
        <img
          src={entry.previewUrl}
          alt={entry.file?.name || ''}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-zinc-400">
          <ImageIcon className="w-6 h-6" />
        </div>
      )}

      {/* Overlay según estado */}
      {status === 'uploading' && (
        <div className="absolute inset-0 bg-black/45 flex items-end">
          <div className="w-full h-1.5 bg-white/30">
            <div
              className="h-full bg-primary-500 transition-all"
              style={{ width: `${entry.progress || 0}%` }}
            />
          </div>
        </div>
      )}

      {status === 'done' && (
        <button
          type="button"
          onClick={canPickCover ? onPickCover : undefined}
          disabled={!canPickCover}
          aria-label={isCover ? 'Portada actual' : 'Elegir como portada'}
          className={`absolute inset-0 flex items-center justify-center transition-colors ${
            isCover
              ? 'bg-primary-500/50'
              : 'bg-black/0 hover:bg-black/35'
          } ${canPickCover ? 'cursor-pointer' : ''}`}
        >
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/90 text-emerald-600">
            <Check className="w-4 h-4" />
          </span>
          {isCover && (
            <span className="absolute bottom-1 left-1 right-1 text-center text-[10px] font-semibold text-white bg-black/55 rounded">
              Portada
            </span>
          )}
        </button>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-1 p-1 text-white text-[10px] text-center">
          <AlertCircle className="w-5 h-5" />
          <span className="line-clamp-2">{entry.error}</span>
          <button
            type="button"
            onClick={onRetry}
            className="mt-1 text-[10px] font-semibold underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Botón remove (solo cuando no está subiendo) */}
      {status !== 'uploading' && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-1 right-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-black/55 text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Quitar"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

const AlbumPhotoUploader = ({ isOpen, onClose, albumId, category }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Subir fotos al álbum" size="lg">
      <UploaderPanel albumId={albumId} category={category} />
      <div className="mt-4 flex justify-end">
        <Button variant="primary" onClick={onClose}>
          Listo
        </Button>
      </div>
    </Modal>
  )
}

export default AlbumPhotoUploader
