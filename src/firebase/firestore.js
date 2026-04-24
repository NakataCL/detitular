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
  arrayUnion,
  arrayRemove,
  runTransaction,
  writeBatch,
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

/**
 * Elimina el documento de un usuario en Firestore (solo admin)
 * Nota: no elimina la cuenta de Firebase Auth, solo los datos del perfil.
 */
export const deleteUser = async (userId) => {
  const userRef = doc(db, 'users', userId)
  await deleteDoc(userRef)
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
    isPrivate: eventData.isPrivate === true,
    registeredUserIds: [],
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
 * Obtiene los eventos activos PÚBLICOS (visibles para cualquiera).
 * Las reglas de Firestore requieren filtrar por isPrivate==false para usuarios no-admin/no-miembros.
 */
export const getPublicActiveEvents = async () => {
  const eventsRef = collection(db, 'events')
  const q = query(
    eventsRef,
    where('status', '==', 'active'),
    where('isPrivate', '==', false),
    orderBy('date', 'asc')
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

/**
 * Obtiene todos los eventos activos sin filtro de privacidad (sólo admin puede leer esto).
 */
export const getAllActiveEvents = async () => {
  const eventsRef = collection(db, 'events')
  const q = query(
    eventsRef,
    where('status', '==', 'active'),
    orderBy('date', 'asc')
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

/**
 * Obtiene los eventos activos a los que el usuario tiene acceso privado (está en registeredUserIds).
 * Incluye eventos públicos en los que también está registrado; el merge en el hook deduplica.
 */
export const getMyAccessibleActiveEvents = async (uid) => {
  if (!uid) return []
  const eventsRef = collection(db, 'events')
  const q = query(
    eventsRef,
    where('status', '==', 'active'),
    where('registeredUserIds', 'array-contains', uid),
    orderBy('date', 'asc')
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

/**
 * Obtiene eventos por mes — versión pública (sin eventos privados).
 */
export const getEventsByMonthPublic = async (year, month) => {
  const startDate = new Date(year, month, 1)
  const endDate = new Date(year, month + 1, 0, 23, 59, 59)

  const eventsRef = collection(db, 'events')
  const q = query(
    eventsRef,
    where('isPrivate', '==', false),
    where('date', '>=', Timestamp.fromDate(startDate)),
    where('date', '<=', Timestamp.fromDate(endDate)),
    orderBy('date', 'asc')
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

/**
 * Obtiene eventos privados del mes a los que el usuario está invitado.
 */
export const getEventsByMonthForUser = async (year, month, uid) => {
  if (!uid) return []
  const startDate = new Date(year, month, 1)
  const endDate = new Date(year, month + 1, 0, 23, 59, 59)

  const eventsRef = collection(db, 'events')
  const q = query(
    eventsRef,
    where('registeredUserIds', 'array-contains', uid),
    where('date', '>=', Timestamp.fromDate(startDate)),
    where('date', '<=', Timestamp.fromDate(endDate)),
    orderBy('date', 'asc')
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

/**
 * Eventos del mes sin filtro de privacidad (sólo admin).
 */
export const getEventsByMonthAdmin = async (year, month) => {
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
 * Próximo evento público (visible para anónimos y no-miembros).
 */
export const getNextPublicEvent = async () => {
  const eventsRef = collection(db, 'events')
  const now = Timestamp.now()

  const q = query(
    eventsRef,
    where('status', '==', 'active'),
    where('isPrivate', '==', false),
    where('date', '>=', now),
    orderBy('date', 'asc'),
    limit(1)
  )

  const snapshot = await getDocs(q)
  if (snapshot.empty) return null
  const d = snapshot.docs[0]
  return { id: d.id, ...d.data() }
}

/**
 * Próximo evento para un usuario autenticado: combina públicos con privados
 * a los que el usuario está invitado y devuelve el de fecha más próxima.
 */
export const getNextEventForUser = async (uid) => {
  const now = Timestamp.now()
  const eventsRef = collection(db, 'events')

  const publicPromise = getNextPublicEvent()

  const privatePromise = uid
    ? getDocs(query(
        eventsRef,
        where('status', '==', 'active'),
        where('registeredUserIds', 'array-contains', uid),
        where('date', '>=', now),
        orderBy('date', 'asc'),
        limit(1)
      )).then((snap) => {
        if (snap.empty) return null
        const d = snap.docs[0]
        return { id: d.id, ...d.data() }
      })
    : Promise.resolve(null)

  const [pub, priv] = await Promise.all([publicPromise, privatePromise])
  if (!pub) return priv
  if (!priv) return pub
  if (pub.id === priv.id) return pub
  const pubDate = pub.date?.toDate?.() || new Date(pub.date)
  const privDate = priv.date?.toDate?.() || new Date(priv.date)
  return pubDate <= privDate ? pub : priv
}

/**
 * Próximo evento sin filtro de privacidad (sólo admin).
 */
export const getNextEventAdmin = async () => {
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
  const d = snapshot.docs[0]
  return { id: d.id, ...d.data() }
}

// ============================================
// INSCRIPCIONES
// ============================================

/**
 * Crea una inscripción a un evento de forma atómica.
 * - Usuario normal: sólo puede auto-inscribirse a eventos públicos (las reglas lo validan).
 * - Admin: puede inscribir a cualquiera pasando `registeredBy: 'admin'` y `addedByUid`.
 */
export const createRegistration = async (
  userId,
  eventId,
  userData,
  { registeredBy = 'self', addedByUid = null } = {}
) => {
  const eventRef = doc(db, 'events', eventId)
  const registrationRef = doc(collection(db, 'registrations'))

  const payload = {
    userId,
    eventId,
    userName: userData?.displayName || userData?.nombre || '',
    userEmail: userData?.email || '',
    userPhoto: userData?.photoURL || '',
    registeredAt: serverTimestamp(),
    attended: false,
    status: 'confirmed',
    registeredBy,
    addedByUid
  }

  await runTransaction(db, async (tx) => {
    const eventSnap = await tx.get(eventRef)
    if (!eventSnap.exists()) throw new Error('Evento no encontrado')

    const event = eventSnap.data()
    const currentSlots = event.currentSlots || 0
    const maxSlots = event.maxSlots || 0
    const alreadyMembers = event.registeredUserIds || []

    if (currentSlots >= maxSlots) {
      throw new Error('No hay cupos disponibles')
    }
    if (alreadyMembers.includes(userId)) {
      throw new Error('Ya estás inscrito en este evento')
    }
    if (event.isPrivate === true && registeredBy !== 'admin') {
      throw new Error('Este evento es privado. Contacta al administrador para inscribirte.')
    }

    tx.set(registrationRef, payload)
    tx.update(eventRef, {
      currentSlots: increment(1),
      registeredUserIds: arrayUnion(userId),
      updatedAt: serverTimestamp()
    })
  })

  return { id: registrationRef.id, ...payload }
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
 * Cancela una inscripción de forma atómica.
 * Requiere `userId` para mantener sincronizado `registeredUserIds` en el evento.
 */
export const cancelRegistration = async (registrationId, eventId, userId) => {
  const registrationRef = doc(db, 'registrations', registrationId)
  const eventRef = doc(db, 'events', eventId)

  await runTransaction(db, async (tx) => {
    const regSnap = await tx.get(registrationRef)
    if (!regSnap.exists()) {
      // Nada que hacer — la inscripción ya no existe.
      return
    }
    const regUserId = userId || regSnap.data().userId

    tx.delete(registrationRef)
    tx.update(eventRef, {
      currentSlots: increment(-1),
      registeredUserIds: arrayRemove(regUserId),
      updatedAt: serverTimestamp()
    })
  })
}

/**
 * El admin inscribe a un usuario en un evento (público o privado).
 * Crea el registro con `registeredBy: 'admin'` y actualiza `registeredUserIds` atómicamente.
 */
export const adminAddUserToEvent = async (eventId, user, adminUid) => {
  const userData = {
    displayName: user.displayName || user.nombre || '',
    nombre: user.nombre,
    email: user.email || '',
    photoURL: user.photoURL || ''
  }
  return createRegistration(
    user.uid || user.id,
    eventId,
    userData,
    { registeredBy: 'admin', addedByUid: adminUid }
  )
}

/**
 * El admin remueve a un usuario de un evento (borra la inscripción y desincroniza el array).
 */
export const adminRemoveUserFromEvent = async (registrationId, eventId, userId) => {
  return cancelRegistration(registrationId, eventId, userId)
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
      where('isPrivate', '==', false),
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
 * Suscripción a cambios en los eventos activos PÚBLICOS.
 */
export const subscribeToPublicActiveEvents = (callback) => {
  const eventsRef = collection(db, 'events')
  const q = query(
    eventsRef,
    where('status', '==', 'active'),
    where('isPrivate', '==', false),
    orderBy('date', 'asc')
  )

  return onSnapshot(q, (snapshot) => {
    const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    callback(events)
  })
}

/**
 * Suscripción a eventos activos visibles para un usuario (públicos + sus privados).
 * Mantiene dos listeners internos y deduplica en el callback.
 */
export const subscribeToUserActiveEvents = (uid, callback) => {
  const eventsRef = collection(db, 'events')
  let publicEvents = []
  let accessibleEvents = []

  const emit = () => {
    const byId = new Map()
    ;[...publicEvents, ...accessibleEvents].forEach(e => byId.set(e.id, e))
    const merged = [...byId.values()].sort((a, b) => {
      const aDate = a.date?.toDate?.() || new Date(a.date)
      const bDate = b.date?.toDate?.() || new Date(b.date)
      return aDate - bDate
    })
    callback(merged)
  }

  const unsubPublic = onSnapshot(
    query(eventsRef,
      where('status', '==', 'active'),
      where('isPrivate', '==', false),
      orderBy('date', 'asc')
    ),
    (snapshot) => {
      publicEvents = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      emit()
    }
  )

  const unsubAccessible = uid
    ? onSnapshot(
        query(eventsRef,
          where('status', '==', 'active'),
          where('registeredUserIds', 'array-contains', uid),
          orderBy('date', 'asc')
        ),
        (snapshot) => {
          accessibleEvents = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
          emit()
        }
      )
    : () => {}

  return () => {
    unsubPublic()
    unsubAccessible()
  }
}

/**
 * Suscripción a cambios en un evento específico. Mapea permission-denied a `null`
 * para que el consumidor trate al evento como "no encontrado" (UX de eventos privados).
 */
export const subscribeToEvent = (eventId, callback) => {
  const eventRef = doc(db, 'events', eventId)
  return onSnapshot(
    eventRef,
    (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() })
      } else {
        callback(null)
      }
    },
    (err) => {
      if (err?.code === 'permission-denied') {
        callback(null)
      } else {
        console.error('subscribeToEvent error:', err)
        callback(null)
      }
    }
  )
}

// ============================================
// BACKFILL / MIGRACIÓN
// ============================================

/**
 * Migración one-shot (ejecutable por admin) para eventos legacy que no tienen
 * los campos `isPrivate` o `registeredUserIds`. Reconstruye `registeredUserIds`
 * a partir de las inscripciones existentes de cada evento.
 *
 * Devuelve `{ migrated, skipped }`.
 */
export const migrateLegacyEvents = async () => {
  const eventsRef = collection(db, 'events')
  const snapshot = await getDocs(eventsRef)

  let migrated = 0
  let skipped = 0
  const BATCH_LIMIT = 400

  let batch = writeBatch(db)
  let opsInBatch = 0

  for (const eventDoc of snapshot.docs) {
    const data = eventDoc.data()
    const needsIsPrivate = data.isPrivate === undefined
    const needsRegisteredArray = !Array.isArray(data.registeredUserIds)

    if (!needsIsPrivate && !needsRegisteredArray) {
      skipped++
      continue
    }

    // Reconstruir registeredUserIds desde las inscripciones
    const regs = await getEventRegistrations(eventDoc.id)
    const uids = [...new Set(regs.map(r => r.userId).filter(Boolean))]

    batch.update(eventDoc.ref, {
      ...(needsIsPrivate ? { isPrivate: false } : {}),
      ...(needsRegisteredArray ? { registeredUserIds: uids } : {}),
      updatedAt: serverTimestamp()
    })
    opsInBatch++
    migrated++

    if (opsInBatch >= BATCH_LIMIT) {
      await batch.commit()
      batch = writeBatch(db)
      opsInBatch = 0
    }
  }

  if (opsInBatch > 0) await batch.commit()

  return { migrated, skipped }
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
