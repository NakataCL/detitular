import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft,
  faArrowRight,
  faArrowTrendUp,
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

export const AlertCircle = createIcon(faCircleExclamation, 'AlertCircle')
export const AlertTriangle = createIcon(faTriangleExclamation, 'AlertTriangle')
export const ArrowLeft = createIcon(faArrowLeft, 'ArrowLeft')
export const ArrowRight = createIcon(faArrowRight, 'ArrowRight')
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
