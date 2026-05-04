// Componente Skeleton para estados de carga
const Skeleton = ({
  className = '',
  variant = 'text',
  width,
  height,
  rounded = false
}) => {
  const variants = {
    text: 'h-4',
    title: 'h-6',
    avatar: 'w-10 h-10 rounded-full',
    thumbnail: 'w-full h-32',
    card: 'w-full h-48',
    button: 'h-10 w-24'
  }

  return (
    <div
      className={`
        skeleton
        ${variants[variant]}
        ${rounded ? 'rounded-full' : 'rounded-xl'}
        ${className}
      `}
      style={{
        width: width,
        height: height
      }}
    />
  )
}

Skeleton.EventCard = () => (
  <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200/80 dark:border-zinc-700">
    <div className="flex gap-3">
      <Skeleton variant="avatar" className="w-12 h-12 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="title" className="w-3/4" />
        <Skeleton variant="text" className="w-1/2" />
        <Skeleton variant="text" className="w-1/3" />
      </div>
    </div>
  </div>
)

Skeleton.UserItem = () => (
  <div className="flex items-center gap-3 p-3">
    <Skeleton variant="avatar" />
    <div className="flex-1 space-y-2">
      <Skeleton variant="text" className="w-1/2" />
      <Skeleton variant="text" className="w-1/3" />
    </div>
  </div>
)

Skeleton.ExperienceGrid = ({ count = 6 }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="aspect-square">
        <Skeleton variant="card" className="h-full rounded-2xl" />
      </div>
    ))}
  </div>
)

Skeleton.AlbumGrid = ({ count = 6 }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="aspect-square">
        <Skeleton variant="card" className="h-full rounded-2xl" />
      </div>
    ))}
  </div>
)

Skeleton.Profile = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-4">
      <Skeleton variant="avatar" className="w-16 h-16" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="title" className="w-1/2" />
        <Skeleton variant="text" className="w-1/3" />
      </div>
    </div>
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} variant="text" className="w-full" />
      ))}
    </div>
  </div>
)

Skeleton.Stats = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200/80 dark:border-zinc-700">
        <Skeleton variant="text" className="w-1/2 mb-2" />
        <Skeleton variant="title" className="w-3/4" />
      </div>
    ))}
  </div>
)

Skeleton.PlayerCard = () => (
  <div className="rounded-3xl bg-zinc-100 dark:bg-zinc-900 p-6 md:p-8 min-h-[220px] space-y-6">
    <div className="flex items-center gap-4">
      <Skeleton variant="avatar" className="w-16 h-16" rounded />
      <div className="flex-1 space-y-2">
        <Skeleton variant="title" className="w-2/3" />
        <Skeleton variant="text" className="w-1/3" />
      </div>
    </div>
    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-zinc-200/60 dark:border-zinc-800">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton variant="title" className="w-1/2" />
          <Skeleton variant="text" className="w-3/4" />
        </div>
      ))}
    </div>
  </div>
)

Skeleton.PlanCard = () => (
  <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200/80 dark:border-zinc-800 space-y-4">
    <div className="flex justify-between">
      <Skeleton variant="title" className="w-1/3" />
      <Skeleton variant="text" className="w-16" />
    </div>
    <Skeleton variant="text" className="w-full" />
    <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
    <Skeleton variant="text" className="w-1/2" />
  </div>
)

Skeleton.EventDetail = () => (
  <div className="space-y-6">
    <Skeleton variant="card" className="h-44 md:h-56 rounded-2xl" />
    <div className="space-y-3">
      <Skeleton variant="title" className="w-2/3" />
      <Skeleton variant="text" className="w-1/2" />
      <Skeleton variant="text" className="w-1/3" />
    </div>
    <div className="space-y-3">
      <Skeleton variant="text" className="w-full" />
      <Skeleton variant="text" className="w-3/4" />
      <Skeleton variant="text" className="w-2/3" />
    </div>
    <Skeleton variant="button" className="h-12 w-full" />
  </div>
)

export default Skeleton
