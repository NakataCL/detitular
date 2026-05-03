// Componente Countdown para eventos
import { useState, useEffect } from 'react'
import { getTimeRemaining } from '../../utils/helpers'

const Countdown = ({ targetDate, onComplete = null, className = '' }) => {
  const [timeLeft, setTimeLeft] = useState(() => getTimeRemaining(targetDate))

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = getTimeRemaining(targetDate)
      setTimeLeft(remaining)

      if (remaining.expired && onComplete) {
        onComplete()
        clearInterval(timer)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [targetDate, onComplete])

  if (!timeLeft || timeLeft.expired) {
    return (
      <div className={`text-center ${className}`}>
        <span className="text-zinc-500 dark:text-zinc-400">Evento finalizado</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-center gap-1.5 sm:gap-2.5 ${className}`}>
      {timeLeft.days > 0 && (
        <TimeUnit value={timeLeft.days} label="días" />
      )}
      <TimeUnit value={timeLeft.hours} label="horas" />
      <TimeUnit value={timeLeft.minutes} label="min" />
      {timeLeft.days === 0 && (
        <TimeUnit value={timeLeft.seconds} label="seg" />
      )}
    </div>
  )
}

const TimeUnit = ({ value, label }) => (
  <div className="flex flex-col items-center">
    <div className="bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 rounded-xl px-2 sm:px-3 py-2 min-w-[2.5rem] sm:min-w-[3rem] text-center">
      <span className="text-lg font-bold tabular-nums">
        {String(value).padStart(2, '0')}
      </span>
    </div>
    <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{label}</span>
  </div>
)

Countdown.Inline = ({ targetDate, className = '' }) => {
  const [timeLeft, setTimeLeft] = useState(() => getTimeRemaining(targetDate))

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeRemaining(targetDate))
    }, 1000)

    return () => clearInterval(timer)
  }, [targetDate])

  if (!timeLeft || timeLeft.expired) {
    return <span className={`text-zinc-500 dark:text-zinc-400 ${className}`}>Finalizado</span>
  }

  return (
    <span className={`text-sm font-semibold text-zinc-900 dark:text-zinc-50 tabular-nums ${className}`}>
      {timeLeft.text}
    </span>
  )
}

export default Countdown
