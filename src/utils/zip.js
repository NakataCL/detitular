// Descarga ZIP de un álbum. Usa import() dinámico para que jszip no entre
// al bundle inicial — solo se carga cuando el admin pulsa "Descargar todo".
import toast from 'react-hot-toast'

const slugify = (str) =>
  (str || 'album')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const extFromUrl = (url) => {
  if (!url) return 'jpg'
  const clean = url.split('?')[0].split('#')[0]
  const m = clean.match(/\.([a-zA-Z0-9]{2,4})$/)
  return (m?.[1] || 'jpg').toLowerCase()
}

export const downloadAlbumZip = async (album, experiences = []) => {
  if (!experiences.length) {
    toast.error('No hay fotos para descargar')
    return
  }

  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()

  const slug = slugify(album?.title)
  let added = 0

  // Fetch en paralelo limitado para no saturar.
  const concurrency = 4
  let cursor = 0
  const next = async () => {
    while (cursor < experiences.length) {
      const idx = cursor++
      const exp = experiences[idx]
      if (!exp?.mediaUrl || exp.mediaType === 'video') continue
      try {
        const res = await fetch(exp.mediaUrl, { mode: 'cors' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const blob = await res.blob()
        const ext = extFromUrl(exp.mediaUrl)
        const name = `${slug}-${String(idx + 1).padStart(3, '0')}.${ext}`
        zip.file(name, blob)
        added++
      } catch (e) {
        console.error('Error descargando', exp.mediaUrl, e)
      }
    }
  }

  const toastId = toast.loading('Preparando ZIP…')
  try {
    await Promise.all(Array.from({ length: concurrency }, next))
    if (added === 0) throw new Error('No se pudo descargar ninguna imagen')

    const blob = await zip.generateAsync({ type: 'blob' })
    const a = document.createElement('a')
    const objectUrl = URL.createObjectURL(blob)
    a.href = objectUrl
    a.download = `${slug || 'album'}.zip`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(objectUrl)

    toast.success(`Descargado ${added} ${added === 1 ? 'foto' : 'fotos'}`, { id: toastId })
  } catch (e) {
    console.error(e)
    toast.error('No se pudo generar el ZIP', { id: toastId })
  }
}
