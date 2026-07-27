// Tarjeta clickable de un álbum en la grilla de la galería
import { useNavigate } from 'react-router-dom'
import { Lock, Image as ImageIcon, Trash2 } from '../../utils/icons'
import { EXPERIENCE_CATEGORIES } from '../../utils/constants'
import { formatDate } from '../../utils/helpers'
import AlbumCover from './AlbumCover'

const AlbumCard = ({ album, showDelete = false, onDelete }) => {
  const navigate = useNavigate()
  const categoryLabel =
    EXPERIENCE_CATEGORIES.find((c) => c.value === album.category)?.label ||
    album.category

  const handleDelete = (e) => {
    e.stopPropagation()
    onDelete?.(album)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/experiencias/${album.id}`)}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/experiencias/${album.id}`)}
      aria-label={`Abrir álbum ${album.title}`}
      className="relative w-full aspect-square rounded-2xl overflow-hidden group bg-zinc-200 dark:bg-zinc-800 transition-transform duration-200 hover:scale-[1.02] cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950"
    >
      <AlbumCover album={album} />

      {/* Counter de fotos — se oculta en hover cuando hay botón de eliminar */}
      <span className={`absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/55 backdrop-blur-sm text-white text-xs font-semibold transition-opacity duration-150 ${showDelete ? 'group-hover:opacity-0' : ''}`}>
        <ImageIcon className="w-3 h-3" />
        {album.itemCount || 0}
      </span>

      {/* Botón eliminar (solo admins, visible en hover) */}
      {showDelete && (
        <button
          type="button"
          onClick={handleDelete}
          aria-label="Eliminar álbum"
          title="Eliminar álbum"
          className="absolute top-2 right-2 p-1.5 bg-red-500/90 rounded-lg hover:bg-red-500 transition-all duration-150 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none"
        >
          <Trash2 className="w-3.5 h-3.5 text-white" />
        </button>
      )}

      {/* Candado para álbumes privados */}
      {album.isPublic === false && (
        <span
          className="absolute top-2 left-2 inline-flex items-center justify-center w-7 h-7 rounded-full bg-black/55 backdrop-blur-sm text-white"
          aria-label="Álbum privado"
        >
          <Lock className="w-3 h-3" />
        </span>
      )}

      {/* Meta inferior con gradiente */}
      <div className="absolute inset-x-0 bottom-0 p-3 pt-10 bg-gradient-to-t from-black/85 via-black/40 to-transparent text-left">
        <h3 className="font-display text-white text-base md:text-lg leading-tight tracking-wide line-clamp-2">
          {album.title}
        </h3>
        <p className="text-xs text-white/75 mt-1">
          {album.date ? formatDate(album.date, "d MMM yyyy") : ''}
          {album.date ? ' · ' : ''}
          {categoryLabel}
        </p>
      </div>
    </div>
  )
}

export default AlbumCard
