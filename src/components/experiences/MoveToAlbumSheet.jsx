// Bottom-sheet para mover experiencias a un álbum existente.
// - Lista todos los álbumes (useAlbums) con buscador inline por título.
// - Botón "+ Crear álbum nuevo" abre AlbumCreateModal en modo skipPhotoUpload
//   y, tras la creación, mueve directamente las fotos a ese álbum.
import { useState, useMemo } from 'react'
import { Modal, Button, EmptyState, Skeleton } from '../ui'
import Input from '../ui/Input'
import { Plus, Search, Image as ImageIcon, Lock } from '../../utils/icons'
import { useAlbums, useMoveExperiencesToAlbum } from '../../hooks/useAlbums'
import { EXPERIENCE_CATEGORIES } from '../../utils/constants'
import { formatDate } from '../../utils/helpers'
import AlbumCreateModal from './AlbumCreateModal'
import toast from 'react-hot-toast'

const MoveToAlbumSheet = ({ isOpen, onClose, experienceIds = [], onMoved }) => {
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const { data: albums, isLoading } = useAlbums()
  const moveMutation = useMoveExperiencesToAlbum()

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return albums || []
    return (albums || []).filter((a) =>
      (a.title || '').toLowerCase().includes(q)
    )
  }, [albums, search])

  const performMove = async (targetAlbumId) => {
    if (!experienceIds.length) {
      toast.error('No hay fotos seleccionadas')
      return
    }
    try {
      await moveMutation.mutateAsync({ experienceIds, targetAlbumId })
      toast.success(
        experienceIds.length === 1
          ? '1 foto movida'
          : `${experienceIds.length} fotos movidas`
      )
      if (onMoved) onMoved()
    } catch (e) {
      toast.error('No se pudieron mover')
      console.error(e)
    }
  }

  const handleNewAlbumCreated = (newAlbum) => {
    setCreateOpen(false)
    performMove(newAlbum.id)
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Mover ${experienceIds.length} ${experienceIds.length === 1 ? 'foto' : 'fotos'} a…`}
        size="md"
        bottomSheet
      >
        <div className="space-y-3">
          <Input
            placeholder="Buscar álbum…"
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600">
              <Plus className="w-4 h-4" />
            </span>
            <span className="text-sm font-medium">Crear álbum nuevo</span>
          </button>

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton variant="card" className="h-14 rounded-xl" />
              <Skeleton variant="card" className="h-14 rounded-xl" />
              <Skeleton variant="card" className="h-14 rounded-xl" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="experiences"
              title={search ? 'Sin resultados' : 'No hay álbumes todavía'}
              description={
                search
                  ? 'Prueba con otro nombre.'
                  : 'Crea uno nuevo arriba.'
              }
            />
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800 -mx-6">
              {filtered.map((album) => (
                <li key={album.id}>
                  <button
                    type="button"
                    onClick={() => performMove(album.id)}
                    disabled={moveMutation.isPending}
                    className="w-full flex items-center gap-3 px-6 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                  >
                    <div className="w-12 h-12 rounded-lg bg-zinc-200 dark:bg-zinc-800 overflow-hidden flex-shrink-0">
                      {album.coverUrl || album.previewUrls?.[0] ? (
                        <img
                          src={album.coverUrl || album.previewUrls[0]}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-400">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                          {album.title}
                        </p>
                        {album.isPublic === false && (
                          <Lock className="w-3 h-3 text-zinc-400 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {album.itemCount || 0} fotos
                        {album.date ? ' · ' + formatDate(album.date, 'd MMM yyyy') : ''}
                        {album.category
                          ? ' · ' +
                            (EXPERIENCE_CATEGORIES.find((c) => c.value === album.category)?.label ||
                              album.category)
                          : ''}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="ghost" onClick={onClose} disabled={moveMutation.isPending}>
            Cancelar
          </Button>
        </div>
      </Modal>

      {/* Modal anidado: crear álbum y volver con su id seleccionado */}
      <AlbumCreateModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        skipPhotoUpload
        onCreated={handleNewAlbumCreated}
      />
    </>
  )
}

export default MoveToAlbumSheet
