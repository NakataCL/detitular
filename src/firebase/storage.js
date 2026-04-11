// Servicios de Firebase Storage
import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll
} from 'firebase/storage'
import { storage } from './config'

/**
 * Sube una imagen de perfil de usuario
 * @param {string} userId - ID del usuario
 * @param {File} file - Archivo de imagen
 * @param {function} onProgress - Callback para el progreso (opcional)
 * @returns {Promise<string>} URL de descarga de la imagen
 */
export const uploadProfileImage = async (userId, file, onProgress = null) => {
  // Validar tipo de archivo
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Tipo de archivo no permitido. Usa JPG, PNG o WebP.')
  }

  // Validar tamaño (máximo 5MB)
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    throw new Error('El archivo es muy grande. Máximo 5MB.')
  }

  // Crear referencia con nombre único
  const extension = file.name.split('.').pop()
  const fileName = `profile_${Date.now()}.${extension}`
  const storageRef = ref(storage, `users/${userId}/${fileName}`)

  if (onProgress) {
    // Subida con seguimiento de progreso
    const uploadTask = uploadBytesResumable(storageRef, file)

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          onProgress(progress)
        },
        (error) => {
          reject(error)
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
          resolve(downloadURL)
        }
      )
    })
  } else {
    // Subida simple
    await uploadBytes(storageRef, file)
    return await getDownloadURL(storageRef)
  }
}

/**
 * Sube una imagen para experiencias/galería
 * @param {File} file - Archivo de imagen
 * @param {string} category - Categoría (partidos, entrenamientos, etc.)
 * @param {function} onProgress - Callback para el progreso (opcional)
 * @returns {Promise<string>} URL de descarga de la imagen
 */
export const uploadExperienceImage = async (file, category, onProgress = null) => {
  // Validar tipo de archivo
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Tipo de archivo no permitido. Usa JPG, PNG, WebP o GIF.')
  }

  // Validar tamaño (máximo 10MB)
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    throw new Error('El archivo es muy grande. Máximo 10MB.')
  }

  // Crear referencia
  const extension = file.name.split('.').pop()
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`
  const storageRef = ref(storage, `experiences/${category}/${fileName}`)

  if (onProgress) {
    const uploadTask = uploadBytesResumable(storageRef, file)

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          onProgress(progress)
        },
        (error) => {
          reject(error)
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
          resolve(downloadURL)
        }
      )
    })
  } else {
    await uploadBytes(storageRef, file)
    return await getDownloadURL(storageRef)
  }
}

/**
 * Elimina un archivo de Storage
 * @param {string} fileUrl - URL del archivo a eliminar
 */
export const deleteFile = async (fileUrl) => {
  try {
    // Extraer la ruta del archivo desde la URL
    const baseUrl = `https://firebasestorage.googleapis.com/v0/b/${import.meta.env.VITE_FIREBASE_STORAGE_BUCKET}/o/`
    const filePath = decodeURIComponent(fileUrl.replace(baseUrl, '').split('?')[0])

    const fileRef = ref(storage, filePath)
    await deleteObject(fileRef)
  } catch (error) {
    // Si el archivo no existe, no es un error crítico
    if (error.code !== 'storage/object-not-found') {
      throw error
    }
  }
}

/**
 * Obtiene la URL de descarga de un archivo
 * @param {string} path - Ruta del archivo en Storage
 * @returns {Promise<string>} URL de descarga
 */
export const getFileURL = async (path) => {
  const fileRef = ref(storage, path)
  return await getDownloadURL(fileRef)
}

/**
 * Lista todos los archivos en una carpeta
 * @param {string} path - Ruta de la carpeta
 * @returns {Promise<Array>} Lista de URLs de archivos
 */
export const listFiles = async (path) => {
  const folderRef = ref(storage, path)
  const result = await listAll(folderRef)

  const urls = await Promise.all(
    result.items.map(async (itemRef) => ({
      name: itemRef.name,
      fullPath: itemRef.fullPath,
      url: await getDownloadURL(itemRef)
    }))
  )

  return urls
}

/**
 * Comprime una imagen antes de subirla (lado del cliente)
 * @param {File} file - Archivo de imagen
 * @param {number} maxWidth - Ancho máximo
 * @param {number} quality - Calidad (0-1)
 * @returns {Promise<Blob>} Imagen comprimida
 */
export const compressImage = (file, maxWidth = 1920, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      let { width, height } = img

      // Calcular nuevas dimensiones manteniendo proporción
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }

      canvas.width = width
      canvas.height = height

      // Dibujar imagen en canvas
      ctx.drawImage(img, 0, 0, width, height)

      // Convertir a blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Error al comprimir la imagen'))
          }
        },
        file.type,
        quality
      )
    }

    img.onerror = () => reject(new Error('Error al cargar la imagen'))
    img.src = URL.createObjectURL(file)
  })
}
