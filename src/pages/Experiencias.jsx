// Galería: lista de álbumes (con sección "Sin clasificar" para admins)
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Plus, Image as ImageIcon } from '../utils/icons'
import { Button, Skeleton, EmptyState } from '../components/ui'
import { AlbumCard, AlbumCreateModal } from '../components/experiences'
import { useAlbums, useUnclassifiedExperiences } from '../hooks/useAlbums'
import { useAuth } from '../context/AuthContext'
import { EXPERIENCE_CATEGORIES, UNCLASSIFIED_ALBUM_ID } from '../utils/constants'

const ALL = 'all'

const Experiencias = () => {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()

  const [category, setCategory] = useState(ALL)
  const [year, setYear] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)

  const { data: albums, isLoading } = useAlbums({
    category: category === ALL ? null : category,
    year
  })
  const { data: unclassified } = useUnclassifiedExperiences()

  const totalAlbums = albums?.length || 0
  const totalPhotos = useMemo(() => {
    const fromAlbums = (albums || []).reduce((sum, a) => sum + (a.itemCount || 0), 0)
    const fromUnclassified = isAdmin ? unclassified?.length || 0 : 0
    return fromAlbums + fromUnclassified
  }, [albums, unclassified, isAdmin])

  const years = useMemo(() => {
    const set = new Set()
    ;(albums || []).forEach((a) => {
      if (a.date) {
        const d = a.date.toDate ? a.date.toDate() : new Date(a.date)
        if (!isNaN(d)) set.add(d.getFullYear())
      }
    })
    return [...set].sort((a, b) => b - a)
  }, [albums])

  const showUnclassifiedCard = isAdmin && (unclassified?.length || 0) > 0

  return (
    <div className="px-4 sm:px-6 md:px-12 pt-8 sm:pt-10 pb-12 md:pt-14 md:pb-20 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Galería
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            {totalAlbums} {totalAlbums === 1 ? 'álbum' : 'álbumes'} · {totalPhotos} fotos
          </p>
        </div>
        {isAdmin && (
          <Button
            icon={Plus}
            size="sm"
            onClick={() => setCreateOpen(true)}
          >
            Álbum
          </Button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 mb-6">
        <FilterChip active={category === ALL} onClick={() => setCategory(ALL)}>
          Todas
        </FilterChip>
        {EXPERIENCE_CATEGORIES.map((cat) => (
          <FilterChip
            key={cat.value}
            active={category === cat.value}
            onClick={() => setCategory(cat.value)}
          >
            {cat.label}
          </FilterChip>
        ))}
      </div>

      {years.length > 0 && (
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 mb-10">
          <FilterChip active={year === null} onClick={() => setYear(null)}>
            Todos los años
          </FilterChip>
          {years.map((y) => (
            <FilterChip
              key={y}
              active={year === y}
              onClick={() => setYear(y)}
            >
              {y}
            </FilterChip>
          ))}
        </div>
      )}

      {/* Grilla */}
      {isLoading ? (
        <Skeleton.AlbumGrid count={8} />
      ) : totalAlbums === 0 && !showUnclassifiedCard ? (
        <EmptyState
          icon="experiences"
          title="Sin álbumes todavía"
          description={
            isAdmin
              ? 'Crea el primer álbum para empezar.'
              : 'Aún no se han publicado álbumes.'
          }
        />
      ) : (
        <motion.div
          layout
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4"
        >
          {showUnclassifiedCard && (
            <UnclassifiedCard
              count={unclassified.length}
              onClick={() => navigate(`/experiencias/${UNCLASSIFIED_ALBUM_ID}`)}
            />
          )}
          {(albums || []).map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </motion.div>
      )}

      <AlbumCreateModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  )
}

const FilterChip = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
      active
        ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900'
        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
    }`}
  >
    {children}
  </button>
)

const UnclassifiedCard = ({ count, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={`${count} fotos sin clasificar`}
    className="relative aspect-square rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex flex-col items-center justify-center gap-2 text-zinc-500 dark:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950"
  >
    <ImageIcon className="w-8 h-8" />
    <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
      Sin clasificar
    </div>
    <div className="text-xs">{count} {count === 1 ? 'foto' : 'fotos'}</div>
  </button>
)

export default Experiencias
