// Servicios de Firestore para la aplicación
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  increment,
  onSnapshot,
  Timestamp
} from 'firebase/firestore'
import { db } from './config'

// ============================================
// USUARIOS
// ============================================

/**
 * Obtiene un usuario por ID
 */
export const getUser = async (userId) => {
  const userRef = doc(db, 'users', userId)
  const userSnap = await getDoc(userRef)
  return userSnap.exists() ? { id: userSnap.id, ...userSnap.data() } : null
}

/**
 * Actualiza los datos de un usuario
 */
export const updateUser = async (userId, data) => {
  const userRef = doc(db, 'users', userId)
  await updateDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp()
  })
}

/**
 * Obtiene todos los usuarios (solo admin)
 */
export const getAllUsers = async () => {
  const usersRef = collection(db, 'users')
  const q = query(usersRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

/**
 * Actualiza el plan de un usuario
 */
export const updateUserPlan = async (userId, planData) => {
  const userRef = doc(db, 'users', userId)
  await updateDoc(userRef, {
    plan: {
      ...planData,
      activatedAt: serverTimestamp()
    },
    updatedAt: serverTimestamp()
  })
}

// ============================================
// EVENTOS
// ============================================

/**
 * Crea un nuevo evento
 */
export const createEvent = async (eventData, createdBy) => {
  const eventsRef = collection(db, 'events')
  const newEvent = {
    ...eventData,
    currentSlots: 0,
    status: 'active',
    createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }

  const docRef = await addDoc(eventsRef, newEvent)
  return { id: docRef.id, ...newEvent }
}

/**
 * Obtiene un evento por ID
 */
export const getEvent = async (eventId) => {
  const eventRef = doc(db, 'events', eventId)
  const eventSnap = await getDoc(eventRef)
  return eventSnap.exists() ? { id: eventSnap.id, ...eventSnap.data() } : null
}

/**
 * Obtiene todos los eventos activos
 */
export const getActiveEvents = async () => {
  const eventsRef = collection(db, 'events')
  const now = Timestamp.now()

  const q = query(
    eventsRef,
    where('status', '==', 'active'),
    orderBy('date', 'asc')
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

/**
 * Obtiene eventos por mes
 */
export const getEventsByMonth = async (year, month) => {
  const startDate = new Date(year, month, 1)
  const endDate = new Date(year, month + 1, 0, 23, 59, 59)

  const eventsRef = collection(db, 'events')
  const q = query(
    eventsRef,
    where('date', '>=', Timestamp.fromDate(startDate)),
    where('date', '<=', Timestamp.fromDate(endDate)),
    orderBy('date', 'asc')
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

/**
 * Obtiene todos los eventos (admin)
 */
export const getAllEvents = async () => {
  const eventsRef = collection(db, 'events')
  const q = query(eventsRef, orderBy('date', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

/**
 * Actualiza un evento
 */
export const updateEvent = async (eventId, data) => {
  const eventRef = doc(db, 'events', eventId)
  await updateDoc(eventRef, {
    ...data,
    updatedAt: serverTimestamp()
  })
}

/**
 * Elimina un evento
 */
export const deleteEvent = async (eventId) => {
  const eventRef = doc(db, 'events', eventId)
  await deleteDoc(eventRef)
}

/**
 * Obtiene el próximo evento
 */
export const getNextEvent = async () => {
  const eventsRef = collection(db, 'events')
  const now = Timestamp.now()

  const q = query(
    eventsRef,
    where('status', '==', 'active'),
    where('date', '>=', now),
    orderBy('date', 'asc'),
    limit(1)
  )

  const snapshot = await getDocs(q)
  if (snapshot.empty) return null
  const doc = snapshot.docs[0]
  return { id: doc.id, ...doc.data() }
}

// ============================================
// INSCRIPCIONES
// ============================================

/**
 * Crea una inscripción a un evento
 */
export const createRegistration = async (userId, eventId, userData) => {
  // Verificar que hay cupos disponibles
  const event = await getEvent(eventId)
  if (!event) throw new Error('Evento no encontrado')
  if (event.currentSlots >= event.maxSlots) throw new Error('No hay cupos disponibles')

  // Verificar que el usuario no esté ya inscrito
  const existing = await getUserEventRegistration(userId, eventId)
  if (existing) throw new Error('Ya estás inscrito en este evento')

  // Crear la inscripción
  const registrationsRef = collection(db, 'registrations')
  const registration = {
    userId,
    eventId,
    userName: userData?.displayName || userData?.nombre || '',
    userEmail: userData?.email || '',
    userPhoto: userData?.photoURL || '',
    registeredAt: serverTimestamp(),
    attended: false,
    status: 'confirmed'
  }

  const docRef = await addDoc(registrationsRef, registration)

  // Incrementar el contador de cupos
  const eventRef = doc(db, 'events', eventId)
  await updateDoc(eventRef, {
    currentSlots: increment(1)
  })

  return { id: docRef.id, ...registration }
}

/**
 * Obtiene la inscripción de un usuario en un evento específico
 */
export const getUserEventRegistration = async (userId, eventId) => {
  const registrationsRef = collection(db, 'registrations')
  const q = query(
    registrationsRef,
    where('userId', '==', userId),
    where('eventId', '==', eventId)
  )

  const snapshot = await getDocs(q)
  if (snapshot.empty) return null
  const doc = snapshot.docs[0]
  return { id: doc.id, ...doc.data() }
}

/**
 * Obtiene todas las inscripciones de un usuario
 */
export const getUserRegistrations = async (userId) => {
  const registrationsRef = collection(db, 'registrations')
  const q = query(
    registrationsRef,
    where('userId', '==', userId),
    orderBy('registeredAt', 'desc')
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

/**
 * Obtiene todas las inscripciones de un evento
 */
export const getEventRegistrations = async (eventId) => {
  const registrationsRef = collection(db, 'registrations')
  const q = query(
    registrationsRef,
    where('eventId', '==', eventId),
    orderBy('registeredAt', 'asc')
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

/**
 * Cancela una inscripción
 */
export const cancelRegistration = async (registrationId, eventId) => {
  // Eliminar la inscripción
  const registrationRef = doc(db, 'registrations', registrationId)
  await deleteDoc(registrationRef)

  // Decrementar el contador de cupos
  const eventRef = doc(db, 'events', eventId)
  await updateDoc(eventRef, {
    currentSlots: increment(-1)
  })
}

/**
 * Marca asistencia en una inscripción
 */
export const markAttendance = async (registrationId, attended) => {
  const registrationRef = doc(db, 'registrations', registrationId)
  await updateDoc(registrationRef, {
    attended,
    attendedAt: attended ? serverTimestamp() : null
  })
}

// ============================================
// EXPERIENCIAS
// ============================================

/**
 * Crea una nueva experiencia
 */
export const createExperience = async (experienceData, createdBy) => {
  const experiencesRef = collection(db, 'experiences')
  const newExperience = {
    ...experienceData,
    createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }

  const docRef = await addDoc(experiencesRef, newExperience)
  return { id: docRef.id, ...newExperience }
}

/**
 * Obtiene todas las experiencias
 */
export const getExperiences = async (category = null) => {
  const experiencesRef = collection(db, 'experiences')
  let q

  if (category && category !== 'all') {
    q = query(
      experiencesRef,
      where('category', '==', category),
      orderBy('createdAt', 'desc')
    )
  } else {
    q = query(experiencesRef, orderBy('createdAt', 'desc'))
  }

  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

/**
 * Obtiene experiencias con paginación
 */
export const getExperiencesPaginated = async (pageSize = 12, lastDoc = null, category = null) => {
  const experiencesRef = collection(db, 'experiences')
  let constraints = [orderBy('createdAt', 'desc'), limit(pageSize)]

  if (category && category !== 'all') {
    constraints = [where('category', '==', category), ...constraints]
  }

  if (lastDoc) {
    constraints.push(startAfter(lastDoc))
  }

  const q = query(experiencesRef, ...constraints)
  const snapshot = await getDocs(q)

  return {
    experiences: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
    hasMore: snapshot.docs.length === pageSize
  }
}

/**
 * Elimina una experiencia
 */
export const deleteExperience = async (experienceId) => {
  const experienceRef = doc(db, 'experiences', experienceId)
  await deleteDoc(experienceRef)
}

// ============================================
// ESTADÍSTICAS
// ============================================

/**
 * Obtiene estadísticas generales para el dashboard
 */
export const getStats = async () => {
  let totalPlayers = 0
  let activePlayers = 0
  let eventsThisMonth = 0
  let registrationsThisMonth = 0

  const now = new Date()

  // Jugadores y activos (una sola query, filtrar plan en memoria)
  try {
    const usersRef = collection(db, 'users')
    const usersQuery = query(usersRef, where('role', '==', 'jugador'))
    const usersSnapshot = await getDocs(usersQuery)
    totalPlayers = usersSnapshot.size
    activePlayers = usersSnapshot.docs.filter(doc => doc.data().plan?.active === true).length
  } catch (e) {
    console.error('Stats: error al obtener jugadores', e)
  }

  // Eventos del mes actual (filtrar por status activo para cumplir reglas de Firestore)
  try {
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    const eventsRef = collection(db, 'events')
    const eventsQuery = query(
      eventsRef,
      where('status', '==', 'active'),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate))
    )
    const eventsSnapshot = await getDocs(eventsQuery)
    eventsThisMonth = eventsSnapshot.size
  } catch (e) {
    console.error('Stats: error al obtener eventos del mes', e)
  }

  // Total de inscripciones del mes
  try {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const registrationsRef = collection(db, 'registrations')
    const registrationsQuery = query(
      registrationsRef,
      where('registeredAt', '>=', Timestamp.fromDate(startOfMonth))
    )
    const registrationsSnapshot = await getDocs(registrationsQuery)
    registrationsThisMonth = registrationsSnapshot.size
  } catch (e) {
    console.error('Stats: error al obtener inscripciones', e)
  }

  return {
    totalPlayers,
    activePlayers,
    eventsThisMonth,
    registrationsThisMonth
  }
}

/**
 * Obtiene estadísticas de un jugador
 */
export const getPlayerStats = async (userId) => {
  const registrations = await getUserRegistrations(userId)

  const totalRegistrations = registrations.length
  const attendedEvents = registrations.filter(r => r.attended).length
  const attendanceRate = totalRegistrations > 0
    ? Math.round((attendedEvents / totalRegistrations) * 100)
    : 0

  // Calcular racha de asistencia
  let currentStreak = 0
  const sortedRegistrations = [...registrations].sort(
    (a, b) => b.registeredAt?.toDate() - a.registeredAt?.toDate()
  )

  for (const reg of sortedRegistrations) {
    if (reg.attended) {
      currentStreak++
    } else {
      break
    }
  }

  return {
    totalRegistrations,
    attendedEvents,
    attendanceRate,
    currentStreak
  }
}

// ============================================
// SUSCRIPCIONES EN TIEMPO REAL
// ============================================

/**
 * Suscripción a cambios en los eventos activos
 */
export const subscribeToActiveEvents = (callback) => {
  const eventsRef = collection(db, 'events')
  const q = query(
    eventsRef,
    where('status', '==', 'active'),
    orderBy('date', 'asc')
  )

  return onSnapshot(q, (snapshot) => {
    const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    callback(events)
  })
}

/**
 * Suscripción a cambios en un evento específico
 */
export const subscribeToEvent = (eventId, callback) => {
  const eventRef = doc(db, 'events', eventId)
  return onSnapshot(eventRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() })
    } else {
      callback(null)
    }
  })
}

/**
 * Suscripción a las inscripciones de un usuario
 */
export const subscribeToUserRegistrations = (userId, callback) => {
  const registrationsRef = collection(db, 'registrations')
  const q = query(
    registrationsRef,
    where('userId', '==', userId),
    orderBy('registeredAt', 'desc')
  )

  return onSnapshot(q, (snapshot) => {
    const registrations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    callback(registrations)
  })
}
