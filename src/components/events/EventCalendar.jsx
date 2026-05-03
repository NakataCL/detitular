// Calendario de eventos
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from '../../utils/icons'
import { MONTHS_ES, DAYS_ES, EVENT_TYPES } from '../../utils/constants'
import { Skeleton } from '../ui'

const EventCalendar = ({ events = [], isLoading = false, onDateSelect = null, onEventClick = null }) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Filtrar eventos del mes actual y agrupar por día
  const eventsByDay = useMemo(() => {
    if (!events?.length) return {}

    return events.reduce((acc, event) => {
      const date = event.date?.toDate ? event.date.toDate() : new Date(event.date)
      if (date.getFullYear() === year && date.getMonth() === month) {
        const day = date.getDate()
        if (!acc[day]) acc[day] = []
        acc[day].push(event)
      }
      return acc
    }, {})
  }, [events, year, month])

  const isToday = (y, m, d) => {
    const today = new Date()
    return today.getFullYear() === y && today.getMonth() === m && today.getDate() === d
  }

  // Generar días del calendario
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()

    const days = []

    // Días vacíos antes del primer día del mes
    for (let i = 0; i < startingDay; i++) {
      days.push({ day: null, events: [] })
    }

    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        events: eventsByDay[day] || [],
        isToday: isToday(year, month, day)
      })
    }

    return days
  }, [year, month, eventsByDay])

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const handleDayClick = (day) => {
    if (!day.day) return

    const date = new Date(year, month, day.day)
    setSelectedDate(day.day)

    if (day.events.length > 0 && onDateSelect) {
      onDateSelect(date, day.events)
    }
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 overflow-hidden">
      {/* Header del calendario */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
        <button
          onClick={goToPrevMonth}
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-50">
          {MONTHS_ES[month]} {year}
        </h2>

        <button
          onClick={goToNextMonth}
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 border-b border-zinc-100 dark:border-zinc-800">
        {DAYS_ES.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-medium text-zinc-500 dark:text-zinc-400"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grid de días */}
      {isLoading ? (
        <div className="grid grid-cols-7 gap-1 p-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1 p-2">
          {calendarDays.map((dayData, index) => (
            <motion.button
              key={index}
              whileTap={{ scale: dayData.day ? 0.95 : 1 }}
              onClick={() => handleDayClick(dayData)}
              disabled={!dayData.day}
              className={`
                aspect-square flex flex-col items-center justify-center rounded-lg
                text-sm transition-colors relative
                ${!dayData.day ? 'cursor-default' : 'cursor-pointer'}
                ${dayData.isToday
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 font-semibold'
                  : dayData.day
                    ? 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                    : 'text-zinc-300 dark:text-zinc-600'
                }
                ${selectedDate === dayData.day && !dayData.isToday
                  ? 'ring-2 ring-primary-500'
                  : ''
                }
              `}
            >
              {dayData.day}

              {/* Indicadores de eventos */}
              {dayData.events.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {dayData.events.slice(0, 3).map((event, i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: EVENT_TYPES[event.type]?.color || '#9b59b6' }}
                    />
                  ))}
                </div>
              )}
            </motion.button>
          ))}
        </div>
      )}

      {/* Eventos del día seleccionado */}
      <AnimatePresence>
        {selectedDate && eventsByDay[selectedDate]?.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-zinc-100 dark:border-zinc-800 overflow-hidden"
          >
            <div className="p-4 space-y-2">
              <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Eventos del {selectedDate} de {MONTHS_ES[month]}
              </h3>
              {eventsByDay[selectedDate].map((event) => (
                <button
                  key={event.id}
                  onClick={() => onEventClick?.(event)}
                  className="w-full text-left p-3 rounded-lg bg-zinc-50 dark:bg-zinc-700/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: EVENT_TYPES[event.type]?.color }}
                    />
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                      {event.title}
                    </span>
                  </div>
                  {event.location && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 ml-4">
                      {event.location}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default EventCalendar
