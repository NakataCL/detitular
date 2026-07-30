import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft,
  faArrowRight,
  faArrowTrendUp,
  faBell,
  faBellSlash,
  faBolt,
  faTriangleExclamation,
  faCalendarDays,
  faCalendarPlus,
  faCamera,
  faCheck,
  faChevronLeft,
  faChevronRight,
  faCircleCheck,
  faCircleExclamation,
  faClipboardList,
  faClock,
  faCreditCard,
  faDownload,
  faEllipsisVertical,
  faExpand,
  faEye,
  faFileLines,
  faFilm,
  faFire,
  faFloppyDisk,
  faHouse,
  faImage,
  faLink,
  faList,
  faLock,
  faLocationDot,
  faMagnifyingGlass,
  faMagnifyingGlassMinus,
  faMagnifyingGlassPlus,
  faPenToSquare,
  faPhone,
  faPlay,
  faPlus,
  faRightFromBracket,
  faRightToBracket,
  faShareNodes,
  faShieldHalved,
  faSpinner,
  faTrash,
  faTrophy,
  faUpload,
  faUser,
  faUsers,
  faVideo,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'

const createIcon = (faIcon, displayName) => {
  const IconComponent = ({ className, strokeWidth, fill, size, ...props }) => (
    <FontAwesomeIcon icon={faIcon} className={className} {...props} />
  )
  IconComponent.displayName = displayName
  return IconComponent
}

// ponytail: glifo inline en vez de instalar @fortawesome/free-brands-svg-icons
export const Instagram = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true" {...props}>
    <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.8 3.8 0 0 1-1.38-.9 3.8 3.8 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07M12 0C8.74 0 8.33.01 7.05.07c-1.28.06-2.15.26-2.91.56-.79.3-1.46.72-2.13 1.38A5.9 5.9 0 0 0 .63 4.14c-.3.76-.5 1.63-.56 2.91C.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.28.26 2.15.56 2.91.3.79.72 1.46 1.38 2.13.67.67 1.34 1.08 2.13 1.38.76.3 1.63.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.28-.06 2.15-.26 2.91-.56.79-.3 1.46-.71 2.13-1.38a5.9 5.9 0 0 0 1.38-2.13c.3-.76.5-1.63.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.28-.26-2.15-.56-2.91a5.9 5.9 0 0 0-1.38-2.13A5.9 5.9 0 0 0 19.86.63c-.76-.3-1.63-.5-2.91-.56C15.67.01 15.26 0 12 0m0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32m0 10.16a4 4 0 1 1 0-8 4 4 0 0 1 0 8m7.85-10.4a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0" />
  </svg>
)

export const Youtube = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true" {...props}>
    <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.08 0 12 0 12s0 3.92.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.92 24 12 24 12s0-3.92-.5-5.81M9.55 15.57V8.43L15.82 12z" />
  </svg>
)

export const AlertCircle = createIcon(faCircleExclamation, 'AlertCircle')
export const AlertTriangle = createIcon(faTriangleExclamation, 'AlertTriangle')
export const ArrowLeft = createIcon(faArrowLeft, 'ArrowLeft')
export const ArrowRight = createIcon(faArrowRight, 'ArrowRight')
export const Bell = createIcon(faBell, 'Bell')
export const BellOff = createIcon(faBellSlash, 'BellOff')
export const Calendar = createIcon(faCalendarDays, 'Calendar')
export const CalendarPlus = createIcon(faCalendarPlus, 'CalendarPlus')
export const Camera = createIcon(faCamera, 'Camera')
export const Check = createIcon(faCheck, 'Check')
export const CheckCircle = createIcon(faCircleCheck, 'CheckCircle')
export const ChevronLeft = createIcon(faChevronLeft, 'ChevronLeft')
export const ChevronRight = createIcon(faChevronRight, 'ChevronRight')
export const ClipboardList = createIcon(faClipboardList, 'ClipboardList')
export const Clock = createIcon(faClock, 'Clock')
export const CreditCard = createIcon(faCreditCard, 'CreditCard')
export const Download = createIcon(faDownload, 'Download')
export const Edit2 = createIcon(faPenToSquare, 'Edit2')
export const Eye = createIcon(faEye, 'Eye')
export const FileText = createIcon(faFileLines, 'FileText')
export const Film = createIcon(faFilm, 'Film')
export const Flame = createIcon(faFire, 'Flame')
export const Home = createIcon(faHouse, 'Home')
export const Image = createIcon(faImage, 'Image')
export const Link = createIcon(faLink, 'Link')
export const List = createIcon(faList, 'List')
export const Lock = createIcon(faLock, 'Lock')
export const Loader2 = createIcon(faSpinner, 'Loader2')
export const LogIn = createIcon(faRightToBracket, 'LogIn')
export const LogOut = createIcon(faRightFromBracket, 'LogOut')
export const MapPin = createIcon(faLocationDot, 'MapPin')
export const Maximize2 = createIcon(faExpand, 'Maximize2')
export const MoreVertical = createIcon(faEllipsisVertical, 'MoreVertical')
export const Phone = createIcon(faPhone, 'Phone')
export const Play = createIcon(faPlay, 'Play')
export const Plus = createIcon(faPlus, 'Plus')
export const Save = createIcon(faFloppyDisk, 'Save')
export const Search = createIcon(faMagnifyingGlass, 'Search')
export const Share2 = createIcon(faShareNodes, 'Share2')
export const Shield = createIcon(faShieldHalved, 'Shield')
export const Trash2 = createIcon(faTrash, 'Trash2')
export const TrendingUp = createIcon(faArrowTrendUp, 'TrendingUp')
export const Trophy = createIcon(faTrophy, 'Trophy')
export const Upload = createIcon(faUpload, 'Upload')
export const User = createIcon(faUser, 'User')
export const Users = createIcon(faUsers, 'Users')
export const Video = createIcon(faVideo, 'Video')
export const X = createIcon(faXmark, 'X')
export const Zap = createIcon(faBolt, 'Zap')
export const ZoomIn = createIcon(faMagnifyingGlassPlus, 'ZoomIn')
export const ZoomOut = createIcon(faMagnifyingGlassMinus, 'ZoomOut')

// WifiOff - SVG inline (not available in FA free)
const WifiOffComponent = ({ className, strokeWidth, fill, size, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size || 24}
    height={size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth || 2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
    <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
    <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
    <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <line x1="12" y1="20" x2="12.01" y2="20" />
  </svg>
)
WifiOffComponent.displayName = 'WifiOff'
export const WifiOff = WifiOffComponent
