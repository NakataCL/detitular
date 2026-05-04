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
 * Crea una experiencia. Si experienceData.albumId está presente, actualiza
 * atómicamente itemCount y previewUrls del álbum (max 4 URLs en preview).
 */
export const createExperience = async (experienceData, createdBy) => {
  const albumId = experienceData?.albumId || null
  const expRef = doc(collection(db, 'experiences'))
  const payload = {
    ...experienceData,
    albumId,
    createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }

  if (!albumId) {
    await setDoc(expRef, payload)
    return { id: expRef.id, ...payload }
  }

  const albumRef = doc(db, 'albums', albumId)
  await runTransaction(db, async (tx) => {
    const albumSnap = await tx.get(albumRef)
    if (!albumSnap.exists()) throw new Error('El álbum ya no existe')

    const album = albumSnap.data()
    const previewUrls = Array.isArray(album.previewUrls) ? album.previewUrls : []
    const albumUpdates = {
      itemCount: increment(1),
      updatedAt: serverTimestamp()
    }
    if (
      previewUrls.length < 4 &&
      payload.mediaUrl &&
      !previewUrls.includes(payload.mediaUrl)
    ) {
      albumUpdates.previewUrls = arrayUnion(payload.mediaUrl)
    }

    tx.set(expRef, payload)
    tx.update(albumRef, albumUpdates)
  })

  return { id: expRef.id, ...payload }
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
 * Elimina una experiencia. Si tenía albumId, decrementa itemCount del álbum
 * y, si su URL estaba en previewUrls, la quita atómicamente.
 */
export const deleteExperience = async (experienceId) => {
  const experienceRef = doc(db, 'experiences', experienceId)

  const expSnap = await getDoc(experienceRef)
  if (!expSnap.exists()) return
  const exp = expSnap.data()
  const albumId = exp.albumId || null

  if (!albumId) {
    await deleteDoc(experienceRef)
    return
  }

  const albumRef = doc(db, 'albums', albumId)
  await runTransaction(db, async (tx) => {
    const albumSnap = await tx.get(albumRef)
    tx.delete(experienceRef)
    if (!albumSnap.exists()) return

    const album = albumSnap.data()
    const previewUrls = Array.isArray(album.previewUrls) ? album.previewUrls : []
    const albumUpdates = {
      itemCount: increment(-1),
      updatedAt: serverTimestamp()
    }
    if (exp.mediaUrl && previewUrls.includes(exp.mediaUrl)) {
      albumUpdates.previewUrls = arrayRemove(exp.mediaUrl)
    }
    tx.update(albumRef, albumUpdates)
  })
}

// ============================================
// ÁLBUMES
// ============================================

/**
 * Crea un nuevo álbum.
 */
export const createAlbum = async (albumData, createdBy) => {
  const albumsRef = collection(db, 'albums')
  const newAlbum = {
    title: albumData.title,
    description: albumData.description || '',
    category: albumData.category,
    eventId: albumData.eventId || null,
    date: albumData.date || serverTimestamp(),
    coverPhotoId: null,
    coverUrl: null,
    previewUrls: [],
    itemCount: 0,
    isPublic: albumData.isPublic !== false,
    createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }
  const docRef = await addDoc(albumsRef, newAlbum)
  return { id: docRef.id, ...newAlbum }
}

/**
 * Obtiene álbumes filtrados. Filtros opcionales: category, year, eventId, max.
 */
export const getAlbums = async ({ category = null, year = null, eventId = null, max = null } = {}) => {
  const albumsRef = collection(db, 'albums')
  const constraints = []

  if (category) constraints.push(where('category', '==', category))
  if (eventId) constraints.push(where('eventId', '==', eventId))
  if (year) {
    const start = new Date(year, 0, 1)
    const end = new Date(year, 11, 31, 23, 59, 59)
    constraints.push(where('date', '>=', Timestamp.fromDate(start)))
    constraints.push(where('date', '<=', Timestamp.fromDate(end)))
  }
  constraints.push(orderBy('date', 'desc'))
  if (max) constraints.push(limit(max))

  const q = query(albumsRef, ...constraints)
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
}

/**
 * Obtiene un álbum por ID.
 */
export const getAlbumById = async (albumId) => {
  const ref = doc(db, 'albums', albumId)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

/**
 * Lista experiencias asociadas a un álbum, ordenadas por createdAt desc.
 */
export const getAlbumExperiences = async (albumId, max = null) => {
  const experiencesRef = collection(db, 'experiences')
  const constraints = [
    where('albumId', '==', albumId),
    orderBy('createdAt', 'desc')
  ]
  if (max) constraints.push(limit(max))
  const q = query(experiencesRef, ...constraints)
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
}

/**
 * Lista experiencias sin álbum (campo albumId == null). Solo accesible a admin
 * a nivel de UI; las reglas son públicas para experiences.
 */
export const getUnclassifiedExperiences = async (max = null) => {
  const experiencesRef = collection(db, 'experiences')
  const constraints = [
    where('albumId', '==', null),
    orderBy('createdAt', 'desc')
  ]
  if (max) constraints.push(limit(max))
  const q = query(experiencesRef, ...constraints)
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
}

/**
 * Actualiza campos de un álbum.
 */
export const updateAlbum = async (albumId, updates) => {
  const ref = doc(db, 'albums', albumId)
  await updateDoc(ref, {
    ...updates,
    updatedAt: serverTimestamp()
  })
}

/**
 * Define la portada del álbum tomando la URL de una experiencia hermana.
 */
export const setAlbumCover = async (albumId, experienceId) => {
  const expSnap = await getDoc(doc(db, 'experiences', experienceId))
  if (!expSnap.exists()) throw new Error('Foto no encontrada')
  const exp = expSnap.data()
  if (exp.albumId !== albumId) throw new Error('La foto no pertenece a este álbum')
  await updateAlbum(albumId, {
    coverPhotoId: experienceId,
    coverUrl: exp.mediaUrl || null
  })
}

/**
 * Elimina un álbum y todas sus experiencias asociadas. Procesa en lotes de 400
 * para no superar el límite de operaciones por batch.
 */
export const deleteAlbum = async (albumId) => {
  const experiencesRef = collection(db, 'experiences')
  const q = query(experiencesRef, where('albumId', '==', albumId))
  const snapshot = await getDocs(q)

  let batch = writeBatch(db)
  let opsInBatch = 0
  const BATCH_LIMIT = 400

  for (const expDoc of snapshot.docs) {
    batch.delete(expDoc.ref)
    opsInBatch++
    if (opsInBatch >= BATCH_LIMIT) {
      await batch.commit()
      batch = writeBatch(db)
      opsInBatch = 0
    }
  }

  batch.delete(doc(db, 'albums', albumId))
  opsInBatch++
  await batch.commit()
}

/**
 * Mueve un set de experiencias a un álbum destino. Si targetAlbumId es null
 * convierte en "sin clasificar". Recalcula itemCount y previewUrls de los
 * álbumes implicados al final.
 */
export const moveExperiencesToAlbum = async (experienceIds, targetAlbumId) => {
  if (!Array.isArray(experienceIds) || experienceIds.length === 0) return

  // 1. Leer experiencias para conocer su albumId actual
  const expRefs = experienceIds.map(id => doc(db, 'experiences', id))
  const expSnaps = await Promise.all(expRefs.map(r => getDoc(r)))
  const experiences = expSnaps
    .map((snap, i) => snap.exists() ? { id: experienceIds[i], ref: expRefs[i], ...snap.data() } : null)
    .filter(Boolean)

  // 2. Batch update de albumId en cada experiencia
  let batch = writeBatch(db)
  let opsInBatch = 0
  const BATCH_LIMIT = 400

  for (const exp of experiences) {
    batch.update(exp.ref, {
      albumId: targetAlbumId || null,
      updatedAt: serverTimestamp()
    })
    opsInBatch++
    if (opsInBatch >= BATCH_LIMIT) {
      await batch.commit()
      batch = writeBatch(db)
      opsInBatch = 0
    }
  }
  if (opsInBatch > 0) await batch.commit()

  // 3. Recalcular itemCount/previewUrls de los álbumes afectados
  const affectedAlbumIds = new Set()
  experiences.forEach(e => {
    if (e.albumId) affectedAlbumIds.add(e.albumId)
  })
  if (targetAlbumId) affectedAlbumIds.add(targetAlbumId)

  await Promise.all(
    [...affectedAlbumIds].map(id => rebuildAlbumDenormalized(id))
  )
}

/**
 * Recalcula itemCount y previewUrls de un álbum a partir del estado actual de
 * sus experiencias. Útil tras moves o cualquier operación que afecte el set.
 */
export const rebuildAlbumDenormalized = async (albumId) => {
  const experiencesRef = collection(db, 'experiences')
  const totalQ = query(experiencesRef, where('albumId', '==', albumId))
  const totalSnap = await getDocs(totalQ)
  const itemCount = totalSnap.size

  const previewQ = query(
    experiencesRef,
    where('albumId', '==', albumId),
    orderBy('createdAt', 'desc'),
    limit(4)
  )
  const previewSnap = await getDocs(previewQ)
  const previewUrls = previewSnap.docs
    .map(d => d.data().mediaUrl)
    .filter(Boolean)

  await updateDoc(doc(db, 'albums', albumId), {
    itemCount,
    previewUrls,
    updatedAt: serverTimestamp()
  })
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
 * Migración one-shot para experiencias legacy:
 *  - Asegura que todas tengan el campo `albumId` (default null) para que la
 *    query `where('albumId','==',null)` las indexe.
 *  - Normaliza categorías plurales antiguas a singulares
 *    ('partidos' → 'partido', 'highlights' → 'otro', ...).
 * Devuelve { migrated, skipped }.
 */
export const migrateLegacyExperiences = async () => {
  const LEGACY_CATEGORY_MAP = {
    partidos: 'partido',
    torneos: 'torneo',
    entrenamientos: 'entrenamiento',
    highlights: 'otro'
  }

  const experiencesRef = collection(db, 'experiences')
  const snapshot = await getDocs(experiencesRef)

  let migrated = 0
  let skipped = 0
  const BATCH_LIMIT = 400

  let batch = writeBatch(db)
  let opsInBatch = 0

  for (const expDoc of snapshot.docs) {
    const data = expDoc.data()
    const needsAlbumId = data.albumId === undefined
    const newCategory = LEGACY_CATEGORY_MAP[data.category]
    const needsCategory = !!newCategory

    if (!needsAlbumId && !needsCategory) {
      skipped++
      continue
    }

    batch.update(expDoc.ref, {
      ...(needsAlbumId ? { albumId: null } : {}),
      ...(needsCategory ? { category: newCategory } : {}),
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

// ============================================
// LISTA DE ESPERA (WAITLISTS)
// ============================================

/**
 * Apunta al usuario actual a la lista de espera de un evento.
 * No-op si ya estaba apuntado.
 */
export const addToWaitlist = async (eventId, userId) => {
  // Buscar entrada existente
  const ref = collection(db, 'waitlists')
  const q = query(
    ref,
    where('eventId', '==', eventId),
    where('userId', '==', userId)
  )
  const snap = await getDocs(q)
  if (!snap.empty) {
    return { id: snap.docs[0].id, ...snap.docs[0].data() }
  }

  const docRef = await addDoc(ref, {
    eventId,
    userId,
    notified: false,
    createdAt: serverTimestamp()
  })
  return { id: docRef.id, eventId, userId, notified: false }
}

/**
 * Saca al usuario de la lista de espera (por id de entrada).
 */
export const removeFromWaitlist = async (entryId) => {
  await deleteDoc(doc(db, 'waitlists', entryId))
}

/**
 * Devuelve las entradas de waitlist del usuario.
 */
export const getMyWaitlistEntries = async (userId) => {
  const ref = collection(db, 'waitlists')
  const q = query(ref, where('userId', '==', userId))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

/**
 * Devuelve la lista de espera de un evento, ordenada por createdAt asc.
 */
export const getEventWaitlist = async (eventId) => {
  const ref = collection(db, 'waitlists')
  const q = query(
    ref,
    where('eventId', '==', eventId),
    orderBy('createdAt', 'asc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}
