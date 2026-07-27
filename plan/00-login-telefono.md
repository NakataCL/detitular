# Plan: login solo con número de teléfono (sin SMS, sin costo)

## Contexto

Hoy el único acceso a la app es **Google OAuth** (`signInWithPopup`, `src/firebase/auth.js:23`). El problema real: los jugadores de la academia no manejan Gmail — se coordinan por WhatsApp y su identidad natural es el número de celular.

Se evaluaron tres caminos y se descartaron dos:

| Camino | Por qué se descartó |
|---|---|
| Firebase Phone Auth (OTP por SMS) | Exige plan **Blaze** con tarjeta. 10 SMS/día gratis, después ~US$0.06 por mensaje ([pricing](https://firebase.google.com/pricing)). |
| Migrar a Supabase | Supabase **no envía SMS**: obliga a conectar Twilio/MessageBird y se paga igual. Además implicaría reescribir `firestore.js` (~1000 líneas), los `onSnapshot` y las 125 líneas de `firestore.rules` a Postgres + RLS. Semanas de trabajo para cambiar un botón. |

**Decisión tomada:** el número de teléfono **es** la credencial. El jugador escribe `+56 9 1234 5678`, entra. Si es nuevo, se le piden nombre completo y posición. La sesión queda persistida indefinidamente en el navegador. Desde otro navegador, vuelve a entrar con solo el número. Costo: **$0**, el proyecto sigue en plan Spark.

### Cómo se implementa sin pagar

Firebase no ofrece "login con teléfono" sin SMS, pero sí ofrece Email/Password gratis e ilimitado. El truco: derivar un **correo sintético interno** desde el número.

```
+56 9 1234 5678  →  56912345678@detitular.app  +  password "dt-56912345678"
```

El jugador nunca ve ese correo. Por dentro es una cuenta Firebase normal → `request.auth.uid` real → **todas las reglas de `firestore.rules` siguen funcionando sin cambios estructurales**, y `AuthContext`, `ProtectedRoute` y los hooks no se enteran de nada.

### ⚠️ Modelo de seguridad que estás aceptando

El número **no queda verificado**: quien conozca el número de otro jugador puede entrar como él y ver/cancelar sus inscripciones. Es una decisión consciente para mantenerlo gratis, y para una academia de ~30 personas que ya se conocen por WhatsApp es un riesgo razonable.

**Lo que este plan sí protege (no negociable):**

1. **El admin nunca es alcanzable por teléfono.** Sigue entrando con Google. Un correo sintético `@detitular.app` jamás puede igualar tu Gmail, y las reglas fuerzan `role: 'jugador'` en toda cuenta creada por esta vía.
2. **Se cierra la escalada de privilegios existente.** Hoy `firestore.rules:24` (`allow read, write: if request.auth.uid == userId`) permite que cualquier usuario se escriba `role: 'admin'` a sí mismo. Es un hoyo que ya existe; con login abierto por teléfono se vuelve trivial de explotar. Se corrige en el paso 8.
3. **Se corrige el fallback de admin en el cliente** (`AuthContext.jsx:90`), que compara emails sin verificar que la variable de entorno exista.

Ruta de salida si algún día quieres verificación real: la estructura de datos que deja este plan (teléfono normalizado a E.164 en `users.telefono`) es **idéntica** a la que usaría Firebase Phone Auth. Activar OTP después no pierde cuentas ni migra datos — solo cambia la función de login.

---

## Paso 0 — Consola de Firebase (antes de tocar código)

Proyecto `detitular-c413f`:

1. **Authentication → Sign-in method → habilitar "Correo electrónico/contraseña".** Dejar Google habilitado (lo usa el admin).
2. No habilitar "Vínculo de correo electrónico (acceso sin contraseña)".
3. Verificar que `localhost`, `nakatacl.github.io` y el dominio de Hosting sigan en **Authorized domains**.

> `npm run dev` no sirve para probar hasta que el proveedor esté habilitado — devuelve `auth/operation-not-allowed`.

---

## Paso 1 — Normalización del teléfono (`src/utils/helpers.js`)

Ya existe `isValidPhone` en la línea 263, pero es demasiado laxa (`length >= 8` y una regex que acepta casi todo). Se reemplaza por tres funciones junto a ella:

```js
// Normaliza a E.164. Sin prefijo país explícito asume Chile (+56).
// ponytail: prefijo fijo +56, no libphonenumber-js. Cambiar si la academia
// se abre a otros países.
export const normalizePhone = (input) => {
  const raw = String(input || '').trim()
  const digits = raw.replace(/\D/g, '')
  if (!digits) return null
  const e164 = raw.startsWith('+') ? `+${digits}` : `+56${digits.replace(/^56/, '')}`
  return /^\+[1-9]\d{7,14}$/.test(e164) ? e164 : null
}

// Correo interno derivado del número. El usuario nunca lo ve.
export const phoneToAuthEmail = (e164) => `${e164.slice(1)}@detitular.app`

// Formato para mostrar: +56 9 1234 5678
export const formatPhone = (e164) => { /* agrupa dígitos, devuelve el original si no matchea */ }
```

**Además** — con correos sintéticos, las pantallas que hoy muestran `{user.email}` renderizarían `56912345678@detitular.app`. Una función más resuelve los 10 call sites:

```js
export const userContact = (u) => u?.telefono || u?.email || ''
```

**Check ejecutable** (Paso 12) — `normalizePhone` es la única lógica no trivial del plan.

---

## Paso 2 — Login por teléfono (`src/firebase/auth.js`)

Añadir junto a `signInWithGoogle` (que se conserva intacta para el admin):

```js
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'

export const signInWithPhone = async (rawPhone) => {
  const telefono = normalizePhone(rawPhone)
  if (!telefono) throw new Error('Número inválido')

  const email = phoneToAuthEmail(telefono)
  // ponytail: contraseña derivada del número — el número ES la credencial,
  // por diseño. Migrar a OTP si se necesita verificación real.
  const password = `dt-${telefono.slice(1)}`

  try {
    // Crear primero: distingue nuevo de existente sin depender de
    // auth/user-not-found, que la protección de enumeración de Firebase
    // enmascara como auth/invalid-credential.
    const { user } = await createUserWithEmailAndPassword(auth, email, password)
    await handleUserAfterAuth(user, { telefono })
    return { user, isNewUser: true }
  } catch (error) {
    if (error.code !== 'auth/email-already-in-use') throw error
    const { user } = await signInWithEmailAndPassword(auth, email, password)
    await handleUserAfterAuth(user, { telefono })
    return { user, isNewUser: false }
  }
}
```

**Modificar `handleUserAfterAuth(user, extra = {})`** (línea 38) — cambio mínimo, dos puntos:

- Al crear (línea 46-70): `telefono: extra.telefono || ''`, y `role` sigue saliendo de `user.email === ADMIN_EMAIL` (un correo sintético nunca iguala tu Gmail → siempre `'jugador'`). Dejar `email: user.email || ''` para no escribir `null`.
- Al actualizar existente (línea 78): añadir `...(extra.telefono ? { telefono: extra.telefono } : {})`.

---

## Paso 3 — Contexto (`src/context/AuthContext.jsx`)

1. Exponer `loginWithPhone` junto al `login` de Google:
   ```js
   const loginWithPhone = async (phone) => {
     setError(null)
     try { return await signInWithPhone(phone) }
     catch (err) { setError(err.message); throw err }
   }
   ```
2. Exponer `needsOnboarding` para el paso 5:
   ```js
   const needsOnboarding = !!user && !!userData && !userData.nombre
   ```
   (`userData` debe existir: mientras es `null` todavía está cargando y no se debe redirigir.)
3. **Corregir la línea 90** — hoy compara con una env var que puede ser `undefined`:
   ```js
   const isAdmin = userData?.role === 'admin' || (!!adminEmail && user?.email === adminEmail)
   ```
4. Borrar el comentario obsoleto de las líneas 58-59 (habla de un flujo de redirect que ya no existe).

---

## Paso 4 — Pantalla de login (`src/pages/Login.jsx`)

El botón de Google (líneas 77-103) deja de ser el protagonista:

```
┌──────────────────────────────┐
│  Entrar                      │
│                              │
│  Tu número de celular        │
│  ┌──────┬─────────────────┐  │
│  │ +56  │ 9 1234 5678     │  │   input type="tel"
│  └──────┴─────────────────┘  │   inputMode="numeric"
│                              │   autoComplete="tel"
│  [      Continuar       ]    │
│                              │
│  Con tu número basta. No     │
│  necesitas contraseña.       │
└──────────────────────────────┘
        Soy administrador ·         ← link discreto, revela Google
```

- Reutilizar `Button`, `Card`, `Input` de `src/components/ui/`.
- Validar con `normalizePhone` **antes** de llamar; error inline, no toast.
- Estado `submitting` → botón deshabilitado (evita doble creación de cuenta).
- Al volver: `isNewUser` → `navigate('/bienvenido')`; si no → destino original (`location.state.from`, ya implementado en las líneas 15-20).
- El botón de Google se conserva completo, oculto tras un `useState` que activa el link "Soy administrador".

---

## Paso 5 — Onboarding (`src/pages/Onboarding.jsx`, nuevo)

Ruta `/bienvenido`. Dos campos obligatorios, nada más:

- **Nombre completo** — `Input` de `src/components/ui/`.
- **Posición preferencial** — `select` alimentado por `POSITIONS` de `src/utils/constants.js:125` (11 opciones, ya existe).

Al guardar: `updateUser(user.uid, { nombre, posicionPrincipal })` (`src/firebase/firestore.js:43`) → `refreshUserData()` → `navigate('/', { replace: true })`.

**Sin botón de "saltar"**: sin nombre el jugador aparece como "Jugador" en la lista de asistentes y no lo puedes identificar para el partido.

---

## Paso 6 — Forzar el onboarding (`src/components/layout/ProtectedRoute.jsx`)

Una sola condición, en el único punto por donde pasan todas las rutas privadas — así no importa por dónde entró el jugador:

```jsx
if (needsOnboarding && location.pathname !== '/bienvenido') {
  return <Navigate to="/bienvenido" replace />
}
```

Registrar `/bienvenido` en `src/App.jsx` como ruta protegida (junto a `/registros` y `/perfil`, líneas 52 y 60).

---

## Paso 7 — Puntos que abren Google directo

Dos lugares llaman `login()` inline y abrirían el popup de Google saltándose la pantalla nueva. Cambiar ambos por `navigate('/login')`:

- `src/components/layout/Header.jsx:29-35` — botón "Entrar" móvil.
- `src/pages/Home.jsx:25-31` — CTA "¿Listo para jugar?" (líneas 177-203, cambiar también el texto "Continuar con Google").

`Topbar.jsx:80-95`, `BottomNav.jsx:63` y `QuickRegisterSheet.jsx:32` ya navegan a `/login` — no se tocan.

---

## Paso 8 — Reglas de seguridad (`firestore.rules`)

Reemplazar el bloque `match /users/{userId}` (líneas 23-27). Hoy el `write` del dueño no restringe campos → autoescalada a admin.

```js
match /users/{userId} {
  allow read: if request.auth != null;

  // Alta propia: siempre como jugador, nunca admin.
  allow create: if request.auth.uid == userId
    && request.resource.data.role == 'jugador';

  // Edición propia: no puede tocar rol, plan ni uid.
  allow update: if request.auth.uid == userId
    && !request.resource.data.diff(resource.data).affectedKeys()
         .hasAny(['role', 'plan', 'uid']);

  allow write: if isAdmin();
}
```

`isAdmin()` (línea 6) **no se toca**: sigue funcionando porque tú entras con Google y tu token trae `token.email`. Las cuentas por teléfono nunca igualan ese email y su `role` es `'jugador'` por regla.

Desplegar: `firebase deploy --only firestore:rules`.

---

## Paso 9 — Mostrar teléfono en vez de correo sintético

Aplicar `userContact(u)` (paso 1) en los sitios donde hoy se pinta el email — patrón idéntico en todos, `{user.email}` → `{userContact(user)}`:

- `src/pages/admin/AdminUsuarios.jsx:401, 450, 499`
- `src/components/events/EventAttendeesManager.jsx:314, 316`
- `src/components/layout/GlobalSearch.jsx:122-123`
- `src/pages/Perfil.jsx:57`

Y en los **filtros de búsqueda**, añadir el teléfono al `includes` (el admin va a buscar por número):

- `src/pages/admin/AdminUsuarios.jsx:51` (actualizar también el placeholder de la línea 168)
- `src/hooks/usePlayer.js:222`
- `src/components/layout/GlobalSearch.jsx:59`
- `src/components/events/EventAttendeesManager.jsx:77`

**Bonus de alto valor**, ya que coordinas por WhatsApp: en `createRegistration` (`src/firebase/firestore.js:357`) añadir `userTelefono: userData?.telefono || ''` junto al `userEmail` existente, y mostrarlo en la lista de asistentes de `EventAttendeesManager.jsx:234`. Así tienes el número a mano al armar el equipo.

---

## Paso 10 — Sesión persistente

**No requiere código.** El SDK de Firebase ya usa `browserLocalPersistence` (IndexedDB) por defecto: la sesión sobrevive cerrar el navegador y reiniciar el equipo. Basta con **no** llamar a `setPersistence` con otro valor.

Límite conocido: Safari/iOS (ITP) puede purgar IndexedDB tras ~7 días sin abrir la app. Si pasa, el jugador vuelve a escribir su número — 3 segundos, sin código de verificación. No se mitiga; se acepta.

---

## Paso 11 — Cuentas Google existentes

Un jugador que ya entró con Google y ahora entra por teléfono obtiene un `uid` nuevo → perfil nuevo, historial de inscripciones separado. Al ejecutar, revisar `/admin/usuarios` para ver cuántas cuentas reales hay:

- **Pocas (lo esperable):** que vuelvan a entrar por número y borrar los perfiles huérfanos desde el panel de admin. Cero código.
- **Muchas:** recién ahí evaluar un script de migración. No escribirlo por adelantado.

Tu cuenta admin **no se toca**: sigue entrando con Google y conserva su `uid`, su `role: 'admin'` y todo el historial.

---

## Paso 12 — Verificación

**Check automático** (única lógica no trivial del plan) — `src/utils/helpers.test.js`, con el runner nativo de Node, sin instalar nada:

```js
import { test } from 'node:test'
import assert from 'node:assert'
import { normalizePhone, phoneToAuthEmail } from './helpers.js'

test('normalizePhone', () => {
  assert.equal(normalizePhone('+569 1234 5678'), '+56912345678')
  assert.equal(normalizePhone('912345678'), '+56912345678')   // sin prefijo
  assert.equal(normalizePhone('56912345678'), '+56912345678') // sin el +
  assert.equal(normalizePhone('+54 9 11 1234 5678'), '+5491112345678') // otro país
  assert.equal(normalizePhone('123'), null)
  assert.equal(normalizePhone(''), null)
  assert.equal(phoneToAuthEmail('+56912345678'), '56912345678@detitular.app')
})
```

Ejecutar: `node --test src/utils/helpers.test.js` (requiere el PATH de nvm: `~/.nvm/versions/node/v24.15.0/bin`).

**Prueba manual end-to-end** con `npm run dev`:

1. `/login` → escribir `+569 1234 5678` → debe crear cuenta y caer en `/bienvenido`.
2. Intentar navegar a `/registros` sin completar el onboarding → debe rebotar a `/bienvenido`.
3. Completar nombre + posición → aterriza en `/` con el nombre visible en el header.
4. Cerrar la pestaña, reabrir `localhost:5173` → **debe entrar directo**, sin pedir nada.
5. Ventana de incógnito → mismo número → entra a la **misma** cuenta, sin onboarding.
6. Inscribirse a un evento → confirmar en `/admin/usuarios` y en la lista de asistentes que se ve el **teléfono**, no `...@detitular.app`.
7. Entrar con Google (link "Soy administrador") → `/admin` accesible, todo el historial intacto.
8. **Prueba de seguridad:** desde la consola del navegador con sesión de jugador, intentar
   `updateDoc(doc(db,'users',uid), { role: 'admin' })` → debe fallar con *Missing or insufficient permissions*.
9. Verificar en Firebase Console → Authentication que los usuarios aparecen como `56912345678@detitular.app` con proveedor Email.

---

## Resumen de archivos

| Archivo | Cambio |
|---|---|
| `src/utils/helpers.js` | + `normalizePhone`, `phoneToAuthEmail`, `formatPhone`, `userContact`; reemplaza `isValidPhone:263` |
| `src/firebase/auth.js` | + `signInWithPhone`; `handleUserAfterAuth` acepta `{ telefono }` |
| `src/context/AuthContext.jsx` | + `loginWithPhone`, `needsOnboarding`; corrige `isAdmin` (línea 90) |
| `src/pages/Login.jsx` | Input de teléfono como principal; Google tras link de admin |
| `src/pages/Onboarding.jsx` | **Nuevo** — nombre + posición |
| `src/App.jsx` | + ruta protegida `/bienvenido` |
| `src/components/layout/ProtectedRoute.jsx` | Redirige a `/bienvenido` si falta el nombre |
| `src/components/layout/Header.jsx`, `src/pages/Home.jsx` | `login()` inline → `navigate('/login')` |
| `firestore.rules` | Bloqueo de autoescalada de `role`/`plan` |
| `src/firebase/firestore.js` | `createRegistration` guarda `userTelefono` |
| ~10 sitios de display/búsqueda | `user.email` → `userContact(user)` |
| `src/utils/helpers.test.js` | **Nuevo** — check de `normalizePhone` |

Sin dependencias nuevas. Sin cambio de plan de facturación. `npm run lint` debe pasar limpio antes de desplegar.

> Si quieres seguir tu flujo de tablero (`plan/NN-*.md`), el paso 0 de la ejecución puede copiar este documento a `plan/00-login-telefono.md` y partirlo por tareas.
