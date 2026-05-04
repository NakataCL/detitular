// Compartir álbum: usa Web Share API si está disponible,
// con fallback a copia al portapapeles.
import toast from 'react-hot-toast'

export const shareAlbum = async (album) => {
  if (!album) return

  const url = window.location.href
  const shareData = {
    title: album.title,
    text: `Mira el álbum ${album.title}`,
    url
  }

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share(shareData)
      return
    } catch (err) {
      if (err?.name === 'AbortError') return
      console.error('Error al compartir:', err)
    }
  }

  try {
    await navigator.clipboard.writeText(url)
    toast.success('Enlace copiado')
  } catch {
    toast.error('No se pudo copiar el enlace')
  }
}
