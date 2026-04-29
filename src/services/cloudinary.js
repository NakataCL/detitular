// Servicio de subida de imágenes a Cloudinary (reemplaza Firebase Storage)
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`

const uploadToCloudinary = (file, folder, onProgress) => {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', UPLOAD_PRESET)
    formData.append('folder', folder)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', UPLOAD_URL)

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress((e.loaded / e.total) * 100)
        }
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const { secure_url } = JSON.parse(xhr.responseText)
          resolve(secure_url)
        } catch {
          reject(new Error('Respuesta inválida de Cloudinary'))
        }
      } else {
        let message = `Error al subir la imagen (HTTP ${xhr.status})`
        try {
          const data = JSON.parse(xhr.responseText)
          if (data?.error?.message) message = data.error.message
        } catch {
          // ignorar parse error, usar mensaje por defecto
        }
        reject(new Error(message))
      }
    }

    xhr.onerror = () => reject(new Error('Error de red al subir la imagen'))
    xhr.send(formData)
  })
}

export const uploadProfileImage = async (userId, file, onProgress = null) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Tipo de archivo no permitido. Usa JPG, PNG o WebP.')
  }

  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    throw new Error('El archivo es muy grande. Máximo 5MB.')
  }

  return uploadToCloudinary(file, `users/${userId}`, onProgress)
}

export const uploadExperienceImage = async (file, category, onProgress = null) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Tipo de archivo no permitido. Usa JPG, PNG, WebP o GIF.')
  }

  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    throw new Error('El archivo es muy grande. Máximo 10MB.')
  }

  return uploadToCloudinary(file, `experiences/${category}`, onProgress)
}

// Borrar en Cloudinary requiere API secret, no es seguro desde el cliente.
// Al eliminar una experiencia el doc se borra de Firestore y el asset queda
// huérfano en Cloudinary; se limpia manualmente desde su dashboard si hace falta.
export const deleteFile = async () => {}
