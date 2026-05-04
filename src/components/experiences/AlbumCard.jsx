// Tarjeta clickable de un álbum en la grilla de la galería
import { useNavigate } from 'react-router-dom'
import { Lock, Image as ImageIcon } from '../../utils/icons'
import { EXPERIENCE_CATEGORIES } from '../../utils/constants'
import { formatDate } from '../../utils/helpers'
import AlbumCover from './AlbumCover'

const AlbumCard = ({ album }) => {
  const navigate = useNavigate()
  const categoryLabel =
    EXPERIENCE_CATEGORIES.find((c) => c.value === album.category)?.label ||
    album.category

  return (
    <button
      type="button"
      onClick={() => navigate(`/experiencias/${album.id}`)}
      aria-label={`Abrir álbum ${album.title}`}
      className="relative w-full aspect-square rounded-2xl overflow-hidden group bg-zinc-200 dark:bg-zinc-800 transition-transform duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950"
    >
      <AlbumCover album={album} />

      {/* Counter de fotos */}
      <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/55 backdrop-blur-sm text-white text-xs font-semibold">
        <ImageIcon className="w-3 h-3" />
        {album.itemCount || 0}
      </span>

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
    </button>
  )
}

export default AlbumCard
