# Academia de Fútbol - PWA

Aplicación web progresiva (PWA) para la gestión de una academia de fútbol. Permite gestionar eventos, inscripciones, experiencias multimedia y perfiles de jugadores.

## Características

- **PWA completa**: Instalable, funciona offline, notificaciones push
- **Mobile-first**: Diseño responsive optimizado para móviles
- **Autenticación con Google**: Login seguro via Firebase Auth
- **Gestión de eventos**: Crear, editar y gestionar eventos con inscripciones
- **Sistema de planes**: Gestión de membresías por sesiones
- **Galería multimedia**: Fotos y videos organizados por categorías
- **Panel de administración**: Dashboard completo para admins

## Stack Tecnológico

- **Frontend**: React 18 + Vite
- **PWA**: vite-plugin-pwa + Workbox
- **Estilos**: Tailwind CSS
- **Base de datos**: Firebase Firestore
- **Autenticación**: Firebase Auth (Google)
- **Storage**: Firebase Storage
- **Estado del servidor**: TanStack Query (React Query)
- **Animaciones**: Framer Motion
- **Routing**: React Router v6

## Requisitos Previos

- Node.js 18+
- Cuenta de Firebase
- Proyecto de Firebase configurado

## Configuración de Firebase

### 1. Crear proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto
3. Nombra tu proyecto (ej: "academia-futbol")
4. Desactiva Google Analytics si no lo necesitas

### 2. Habilitar Authentication

1. En la consola de Firebase, ve a **Authentication** > **Sign-in method**
2. Habilita **Google** como proveedor de autenticación
3. Configura el email de soporte y guarda

### 3. Crear base de datos Firestore

1. Ve a **Firestore Database** > **Create database**
2. Selecciona **Start in production mode**
3. Elige la ubicación más cercana a tus usuarios

### 4. Configurar Storage

1. Ve a **Storage** > **Get started**
2. Acepta las reglas por defecto (las cambiaremos después)

### 5. Obtener credenciales

1. Ve a **Project Settings** (ícono de engranaje)
2. En la sección **Your apps**, haz clic en el ícono de Web (</>)
3. Registra la app con un nombre
4. Copia las credenciales de `firebaseConfig`

## Instalación

### 1. Clonar e instalar dependencias

```bash
cd football-academy
npm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env` basado en `.env.example`:

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales de Firebase:

```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto_id
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id

VITE_ADMIN_EMAIL=tu_email_admin@gmail.com
VITE_APP_NAME=Tu Academia de Fútbol
```

### 3. Desplegar reglas de Firestore y Storage

```bash
# Instalar Firebase CLI si no lo tienes
npm install -g firebase-tools

# Iniciar sesión
firebase login

# Inicializar proyecto (selecciona Firestore y Storage)
firebase init

# Desplegar reglas
firebase deploy --only firestore:rules,storage
```

### 4. Iniciar en desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## Estructura del Proyecto

```
football-academy/
├── public/
│   └── icons/           # Iconos PWA
├── src/
│   ├── components/
│   │   ├── admin/       # Componentes del panel admin
│   │   ├── events/      # Componentes de eventos
│   │   ├── experiences/ # Componentes de galería
│   │   ├── layout/      # Layout, navegación, header
│   │   ├── profile/     # Componentes de perfil
│   │   └── ui/          # Componentes UI reutilizables
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── firebase/
│   │   ├── config.js    # Configuración Firebase
│   │   ├── auth.js      # Servicios de autenticación
│   │   ├── firestore.js # Servicios de Firestore
│   │   └── storage.js   # Servicios de Storage
│   ├── hooks/           # Custom hooks
│   ├── pages/
│   │   ├── admin/       # Páginas de administración
│   │   └── ...          # Otras páginas
│   ├── utils/
│   │   ├── constants.js # Constantes de la app
│   │   └── helpers.js   # Funciones de utilidad
│   ├── App.jsx          # Componente principal con routing
│   ├── main.jsx         # Punto de entrada
│   └── index.css        # Estilos globales con Tailwind
├── firestore.rules      # Reglas de seguridad Firestore
├── storage.rules        # Reglas de seguridad Storage
└── vite.config.js       # Configuración de Vite + PWA
```

## Despliegue en Firebase Hosting

### 1. Preparar para producción

```bash
npm run build
```

### 2. Inicializar Firebase Hosting

```bash
firebase init hosting
```

Configuración recomendada:
- Public directory: `dist`
- Single-page app: `Yes`
- Automatic deploys: `No` (opcional)

### 3. Desplegar

```bash
firebase deploy --only hosting
```

## Generar Iconos PWA

Para generar los iconos PWA, puedes usar herramientas como:
- [PWA Asset Generator](https://github.com/nickvdyck/pwa-asset-generator)
- [Real Favicon Generator](https://realfavicongenerator.net/)

Coloca los iconos generados en `/public/icons/` con los siguientes tamaños:
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## Funcionalidades por Rol

### Visitante (sin login)
- Ver página de inicio
- Ver eventos disponibles
- Ver galería de experiencias

### Jugador (logueado)
- Todo lo anterior
- Inscribirse en eventos
- Ver sus inscripciones
- Editar su perfil
- Ver su plan y estadísticas

### Administrador
- Todo lo anterior
- Panel de administración
- Crear/editar/eliminar eventos
- Gestionar usuarios
- Activar/desactivar planes
- Subir contenido a la galería
- Marcar asistencias

## Personalización

### Cambiar nombre de la academia

1. Edita `VITE_APP_NAME` en tu archivo `.env`
2. Actualiza los iconos en `/public/icons/`
3. Modifica los colores en `/src/index.css` si es necesario

### Cambiar colores del tema

Edita las variables CSS en `/src/index.css`:

```css
@theme {
  --color-primary-700: #1a472a; /* Verde oscuro */
  --color-primary-500: #2ecc71; /* Verde brillante */
  /* ... */
}
```

## Scripts Disponibles

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run preview  # Preview del build
npm run lint     # Linter ESLint
```

## Soporte

Para reportar bugs o solicitar funcionalidades, abre un issue en el repositorio.

## Licencia

MIT
