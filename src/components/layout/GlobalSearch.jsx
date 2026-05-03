// Búsqueda global de eventos (siempre) y usuarios (sólo admin) — desktop
import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Calendar, User } from '../../utils/icons'
import { useActiveEvents } from '../../hooks/useEvents'
import { useAllUsers } from '../../hooks/usePlayer'
import { useAuth } from '../../context/AuthContext'

const DEBOUNCE_MS = 300

const GlobalSearch = () => {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [term, setTerm] = useState('')
  const [debounced, setDebounced] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  const { data: events } = useActiveEvents()
  const { data: users } = useAllUsers({ enabled: isAdmin })

  // Debounce
  useEffect(() => {
    if (!term) {
      setDebounced('')
      return
    }
    const id = setTimeout(() => setDebounced(term), DEBOUNCE_MS)
    return () => clearTimeout(id)
  }, [term])

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const results = useMemo(() => {
    const q = debounced.trim().toLowerCase()
    if (!q) return { events: [], users: [] }

    const matchedEvents = (events || [])
      .filter(e =>
        e.title?.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q)
      )
      .slice(0, 5)

    const matchedUsers = isAdmin
      ? (users || [])
          .filter(u =>
            u.nombre?.toLowerCase().includes(q) ||
            u.displayName?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q)
          )
          .slice(0, 5)
      : []

    return { events: matchedEvents, users: matchedUsers }
  }, [debounced, events, users, isAdmin])

  const total = results.events.length + results.users.length

  const handleSelect = (path) => {
    setOpen(false)
    setTerm('')
    setDebounced('')
    navigate(path)
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none"
        aria-hidden="true"
      />
      <input
        type="search"
        value={term}
        onChange={(e) => {
          setTerm(e.target.value)
          setOpen(true)
        }}
        onFocus={() => term && setOpen(true)}
        placeholder={isAdmin ? 'Buscar eventos o usuarios…' : 'Buscar eventos…'}
        aria-label="Búsqueda global"
        className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200/80 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-transparent"
      />

      {open && debounced && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-700 rounded-xl shadow-lg overflow-hidden z-30 max-h-[60vh] overflow-y-auto">
          {total === 0 ? (
            <p className="px-4 py-6 text-sm text-zinc-500 dark:text-zinc-400 text-center">
              Sin resultados para “{debounced}”
            </p>
          ) : (
            <>
              {results.events.length > 0 && (
                <ResultGroup label="Eventos">
                  {results.events.map(event => (
                    <ResultRow
                      key={event.id}
                      icon={Calendar}
                      title={event.title}
                      subtitle={event.location || 'Sin ubicación'}
                      onClick={() => handleSelect(`/eventos/${event.id}`)}
                    />
                  ))}
                </ResultGroup>
              )}
              {results.users.length > 0 && (
                <ResultGroup label="Usuarios">
                  {results.users.map(u => (
                    <ResultRow
                      key={u.id}
                      icon={User}
                      title={u.nombre || u.displayName || u.email}
                      subtitle={u.email}
                      onClick={() => handleSelect('/admin/usuarios')}
                    />
                  ))}
                </ResultGroup>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

const ResultGroup = ({ label, children }) => (
  <div className="py-1">
    <p className="px-4 pt-2 pb-1 text-[10px] uppercase tracking-[0.18em] font-bold text-zinc-500 dark:text-zinc-400">
      {label}
    </p>
    {children}
  </div>
)

const ResultRow = ({ icon: Icon, title, subtitle, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
  >
    <Icon className="w-4 h-4 text-zinc-400 flex-shrink-0" aria-hidden="true" />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">
        {title}
      </p>
      {subtitle && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
          {subtitle}
        </p>
      )}
    </div>
  </button>
)

export default GlobalSearch
