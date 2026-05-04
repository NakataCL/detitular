// Portada visual de un álbum: foto fijada > mosaico 2x2 > primera foto > placeholder degradado
import { ALBUM_GRADIENTS } from '../../utils/constants'
import { getInitials } from '../../utils/helpers'

const FALLBACK_GRADIENT = 'from-zinc-700 to-zinc-900'

const AlbumCover = ({ album }) => {
  if (!album) return null
  const previewUrls = Array.isArray(album.previewUrls) ? album.previewUrls : []
  const gradient = ALBUM_GRADIENTS[album.category] || FALLBACK_GRADIENT

  if (album.coverUrl) {
    return (
      <img
        src={album.coverUrl}
        alt={album.title}
        loading="lazy"
        className="w-full h-full object-cover"
      />
    )
  }

  if (previewUrls.length >= 4) {
    return (
      <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-px">
        {previewUrls.slice(0, 4).map((url, i) => (
          <img
            key={url + i}
            src={url}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ))}
      </div>
    )
  }

  if (previewUrls.length > 0) {
    return (
      <img
        src={previewUrls[0]}
        alt={album.title}
        loading="lazy"
        className="w-full h-full object-cover"
      />
    )
  }

  return (
    <div
      className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}
    >
      <span className="font-display text-4xl md:text-5xl text-white/90 tracking-wider">
        {getInitials(album.title)}
      </span>
    </div>
  )
}

export default AlbumCover
