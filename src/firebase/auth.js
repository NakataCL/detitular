// Servicios de autenticación
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './config'

// Proveedor de Google
const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({
  prompt: 'select_account'
})

// Email del admin configurado en .env
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@academia.com'

/**
 * Inicia sesión con Google
 * En móvil usa redirect, en desktop usa popup
 */
export const signInWithGoogle = async () => {
  try {
    // Detectar si es móvil para usar redirect en lugar de popup
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

    if (isMobile) {
      await signInWithRedirect(auth, googleProvider)
      return null // El resultado se obtiene después del redirect
    } else {
      const result = await signInWithPopup(auth, googleProvider)
      await handleUserAfterAuth(result.user)
      return result.user
    }
  } catch (error) {
    console.error('Error al iniciar sesión con Google:', error)
    throw error
  }
}

/**
 * Maneja el resultado del redirect de Google (para móvil)
 */
export const handleGoogleRedirect = async () => {
  try {
    const result = await getRedirectResult(auth)
    if (result?.user) {
      await handleUserAfterAuth(result.user)
      return result.user
    }
    return null
  } catch (error) {
    console.error('Error al manejar redirect de Google:', error)
    throw error
  }
}

/**
 * Procesa el usuario después de autenticarse
 * Crea o actualiza el documento del usuario en Firestore
 */
export const handleUserAfterAuth = async (user) => {
  if (!user) return null

  const userRef = doc(db, 'users', user.uid)
  const userSnap = await getDoc(userRef)

  if (!userSnap.exists()) {
    // Nuevo usuario - determinar rol
    const role = user.email === ADMIN_EMAIL ? 'admin' : 'jugador'

    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      role,
      // Datos personales (se completan después)
      nombre: user.displayName || '',
      edad: null,
      telefono: '',
      ciudad: '',
      // Datos futbolísticos
      posicionPrincipal: '',
      posicionSecundaria: '',
      pieHabil: '',
      numeroCamiseta: null,
      // Plan activo
      plan: null,
      // Metadata
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    }

    await setDoc(userRef, userData)
    return { ...userData, isNewUser: true }
  } else {
    // Usuario existente - actualizar último login y verificar rol admin
    const existingData = userSnap.data()
    const expectedRole = user.email === ADMIN_EMAIL ? 'admin' : existingData.role
    const updateData = {
      lastLogin: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...(expectedRole !== existingData.role ? { role: expectedRole } : {})
    }
    await setDoc(userRef, updateData, { merge: true })
    return { ...existingData, ...updateData, isNewUser: false }
  }
}

/**
 * Cierra la sesión del usuario
 */
export const signOut = async () => {
  try {
    await firebaseSignOut(auth)
  } catch (error) {
    console.error('Error al cerrar sesión:', error)
    throw error
  }
}

/**
 * Obtiene los datos del usuario actual desde Firestore
 */
export const getCurrentUserData = async (uid, email) => {
  if (!uid) return null

  try {
    const userRef = doc(db, 'users', uid)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists()) {
      const data = userSnap.data()
      // Asegurar que el rol admin esté correcto en Firestore
      if (email === ADMIN_EMAIL && data.role !== 'admin') {
        await setDoc(userRef, { role: 'admin', updatedAt: serverTimestamp() }, { merge: true })
        data.role = 'admin'
      }
      return data
    }
    return null
  } catch (error) {
    console.error('Error al obtener datos del usuario:', error)
    throw error
  }
}

/**
 * Suscripción a cambios en el estado de autenticación
 */
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback)
}

/**
 * Verifica si el usuario tiene rol de admin
 */
export const isAdmin = async (uid) => {
  if (!uid) return false

  try {
    const userData = await getCurrentUserData(uid)
    return userData?.role === 'admin'
  } catch {
    return false
  }
}
