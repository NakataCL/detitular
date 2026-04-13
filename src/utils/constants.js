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
    color: '#dc2626',
    bgClass: 'badge-partido'
  },
  torneo: {
    label: 'Torneo',
    color: '#f39c12',
    bgClass: 'badge-torneo'
  },
  entrenamiento: {
    label: 'Entrenamiento',
    color: '#3498db',
    bgClass: 'badge-entrenamiento'
  },
  otro: {
    label: 'Otro',
    color: '#9b59b6',
    bgClass: 'badge-otro'
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

// Categorías de experiencias
export const EXPERIENCE_CATEGORIES = [
  { value: 'all', label: 'Todas' },
  { value: 'partidos', label: 'Partidos' },
  { value: 'entrenamientos', label: 'Entrenamientos' },
  { value: 'torneos', label: 'Torneos' },
  { value: 'highlights', label: 'Highlights' }
]

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
    label: 'Registros',
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
