// Constantes de la aplicación

// Nombre de la app (puede ser sobrescrito por variable de entorno)
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Academia de Fútbol'
export const APP_SHORT_NAME = import.meta.env.VITE_APP_SHORT_NAME || 'FutbolAcademy'

// Colores del tema
export const THEME_COLORS = {
  primary: {
    dark: '#7f1d1d',
    main: '#dc2626',
    light: '#fecaca'
  },
  accent: {
    gold: '#f39c12',
    red: '#e74c3c',
    blue: '#3498db'
  }
}

// Tipos de eventos
export const EVENT_TYPES = {
  partido: {
    label: 'Partido',
    short: 'PAR',
    color: '#dc2626',
    bgClass: 'badge-partido',
    bannerClass: 'bg-red-700',
    ctaClass: 'bg-red-700 hover:bg-red-800 text-white'
  },
  torneo: {
    label: 'Torneo',
    short: 'TOR',
    color: '#f39c12',
    bgClass: 'badge-torneo',
    bannerClass: 'bg-amber-600',
    ctaClass: 'bg-amber-600 hover:bg-amber-700 text-white'
  },
  entrenamiento: {
    label: 'Entrenamiento',
    short: 'ENT',
    color: '#3498db',
    bgClass: 'badge-entrenamiento',
    bannerClass: 'bg-blue-600',
    ctaClass: 'bg-blue-600 hover:bg-blue-700 text-white'
  },
  otro: {
    label: 'Otro',
    short: 'OTR',
    color: '#9b59b6',
    bgClass: 'badge-otro',
    bannerClass: 'bg-violet-600',
    ctaClass: 'bg-violet-600 hover:bg-violet-700 text-white'
  }
}

// Estados de inscripción
export const REGISTRATION_STATUS = {
  abierto: {
    label: 'Abierto',
    class: 'status-abierto'
  },
  lleno: {
    label: 'Lleno',
    class: 'status-lleno'
  },
  inscrito: {
    label: 'Inscrito',
    class: 'status-inscrito'
  },
  cerrado: {
    label: 'Cerrado',
    class: 'status-cerrado'
  }
}

// Planes disponibles
export const PLANS = {
  basic: {
    id: 'basic',
    name: 'Plan Básico',
    sessions: 8,
    description: '8 sesiones por mes'
  },
  standard: {
    id: 'standard',
    name: 'Plan Estándar',
    sessions: 12,
    description: '12 sesiones por mes'
  },
  premium: {
    id: 'premium',
    name: 'Plan Premium',
    sessions: 16,
    description: '16 sesiones por mes'
  }
}

// Posiciones de fútbol
export const POSITIONS = [
  { value: 'portero', label: 'Portero' },
  { value: 'defensa-central', label: 'Defensa Central' },
  { value: 'lateral-derecho', label: 'Lateral Derecho' },
  { value: 'lateral-izquierdo', label: 'Lateral Izquierdo' },
  { value: 'mediocampista-defensivo', label: 'Mediocampista Defensivo' },
  { value: 'mediocampista-central', label: 'Mediocampista Central' },
  { value: 'mediocampista-ofensivo', label: 'Mediocampista Ofensivo' },
  { value: 'extremo-derecho', label: 'Extremo Derecho' },
  { value: 'extremo-izquierdo', label: 'Extremo Izquierdo' },
  { value: 'delantero-centro', label: 'Delantero Centro' },
  { value: 'segundo-delantero', label: 'Segundo Delantero' }
]

// Pie hábil
export const FOOT_OPTIONS = [
  { value: 'derecho', label: 'Derecho' },
  { value: 'izquierdo', label: 'Izquierdo' },
  { value: 'ambidiestro', label: 'Ambidiestro' }
]

// Categorías de experiencias / álbumes (singular, alineadas con EVENT_TYPES)
export const EXPERIENCE_CATEGORIES = [
  { value: 'partido', label: 'Partidos' },
  { value: 'torneo', label: 'Torneos' },
  { value: 'entrenamiento', label: 'Entrenamientos' },
  { value: 'otro', label: 'Otros' }
]

// Centinela usado en la URL para listar las experiencias sin álbum (solo admin)
export const UNCLASSIFIED_ALBUM_ID = '__unclassified__'

// Gradientes Tailwind por categoría — usados en portadas de álbum sin foto
// y en el hero del detalle. Mantener sincronizado con EXPERIENCE_CATEGORIES.
export const ALBUM_GRADIENTS = {
  partido: 'from-red-700 to-red-900',
  torneo: 'from-amber-600 to-amber-800',
  entrenamiento: 'from-blue-700 to-blue-900',
  otro: 'from-violet-700 to-violet-900'
}

// Mapa para migrar valores legacy ('partidos', 'highlights', etc.) → nuevos
export const LEGACY_CATEGORY_MAP = {
  partidos: 'partido',
  torneos: 'torneo',
  entrenamientos: 'entrenamiento',
  highlights: 'otro'
}

// Rutas de navegación
export const NAV_ITEMS = [
  {
    path: '/',
    label: 'Inicio',
    icon: 'Home',
    public: true
  },
  {
    path: '/registros',
    label: 'Mis convocatorias',
    icon: 'ClipboardList',
    public: false
  },
  {
    path: '/eventos',
    label: 'Eventos',
    icon: 'Calendar',
    public: true
  },
  {
    path: '/experiencias',
    label: 'Experiencias',
    icon: 'Film',
    public: true
  },
  {
    path: '/perfil',
    label: 'Perfil',
    icon: 'User',
    public: false
  }
]

// Días de la semana en español
export const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
export const DAYS_FULL_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

// Meses en español
export const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]
