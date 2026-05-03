// Tarjeta del plan activo del jugador
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Calendar, AlertTriangle, CheckCircle, CalendarPlus } from '../../utils/icons'
import { Card, Badge, Button } from '../ui'
import { PLANS } from '../../utils/constants'
import { formatDate } from '../../utils/helpers'
import { useActiveEvents } from '../../hooks/useEvents'
import { useMyRegistrations } from '../../hooks/useRegistrations'
import PlanReserveSheet from './PlanReserveSheet'

const PlanCard = ({ plan, onSelectPlan = null }) => {
  const [reserveOpen, setReserveOpen] = useState(false)
  const { data: activeEvents } = useActiveEvents()
  const { data: myRegs } = useMyRegistrations()

  const planExpiresAt = plan?.expiresAt?.toDate
    ? plan.expiresAt.toDate()
    : plan?.expiresAt ? new Date(plan.expiresAt) : null

  const eligibleEvents = useMemo(() => {
    if (!plan?.active || !planExpiresAt || !activeEvents) return []
    const registeredIds = new Set((myRegs || []).map(r => r.eventId))
    return activeEvents
      .filter(e => !registeredIds.has(e.id))
      .filter(e => !e.isPrivate)
      .filter(e => (e.currentSlots || 0) < (e.maxSlots || 0))
      .filter(e => {
        const d = e.date?.toDate ? e.date.toDate() : new Date(e.date)
        return d <= planExpiresAt
      })
      .sort((a, b) => {
        const da = a.date?.toDate?.() || new Date(a.date)
        const db = b.date?.toDate?.() || new Date(b.date)
        return da - db
      })
  }, [plan?.active, planExpiresAt, activeEvents, myRegs])

  if (!plan || !plan.active) {
    return (
      <Card className="border-dashed border-2 border-zinc-300 dark:border-zinc-600">
        <div className="text-center py-6">
          <CreditCard className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
            Sin plan activo
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            Selecciona un plan para comenzar a inscribirte en eventos
          </p>
          {onSelectPlan && (
            <Button onClick={onSelectPlan}>
              Ver planes disponibles
            </Button>
          )}
        </div>
      </Card>
    )
  }

  const planInfo = PLANS[plan.type] || { name: plan.type, sessions: plan.totalSessions }
  const sessionsRemaining = plan.totalSessions - (plan.sessionsUsed || 0)
  const progressPercent = ((plan.sessionsUsed || 0) / plan.totalSessions) * 100

  const daysUntilExpiry = planExpiresAt
    ? Math.ceil((planExpiresAt - new Date()) / (1000 * 60 * 60 * 24))
    : null
  const isLowSessions = sessionsRemaining <= 2
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 7

  const showReserveBand =
    sessionsRemaining > 0 && eligibleEvents.length > 0

  return (
    <>
      <Card className="relative overflow-hidden">
        {/* Fondo decorativo */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />

        <div className="relative">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <Badge variant="primary" className="mb-2">
                Plan Activo
              </Badge>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                {planInfo.name}
              </h3>
            </div>
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>

          {/* Sesiones */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Sesiones utilizadas</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-50 tabular-nums">
                {plan.sessionsUsed || 0} / {plan.totalSessions}
              </span>
            </div>
            <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={`h-full rounded-full ${
                  isLowSessions
                    ? 'bg-gradient-to-r from-orange-500 to-red-500'
                    : 'bg-gradient-to-r from-primary-500 to-primary-600'
                }`}
              />
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {sessionsRemaining > 0
                ? `${sessionsRemaining} sesiones disponibles`
                : 'Sin sesiones disponibles'}
            </p>
          </div>

          {/* Fecha de vencimiento */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-zinc-400" aria-hidden="true" />
            <span className="text-zinc-500 dark:text-zinc-400">
              Vence el {formatDate(plan.expiresAt, 'd MMM yyyy')}
            </span>
          </div>

          {/* Banda accionable: cruzar sesiones restantes con eventos disponibles */}
          {showReserveBand && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/70 dark:border-emerald-900/40">
              <p className="text-sm text-emerald-900 dark:text-emerald-200 mb-3">
                Reserva tus <strong>{sessionsRemaining}</strong> {sessionsRemaining === 1 ? 'sesión restante' : 'sesiones restantes'}: hay <strong>{eligibleEvents.length}</strong> {eligibleEvents.length === 1 ? 'evento disponible' : 'eventos disponibles'} antes del vencimiento.
              </p>
              <Button
                size="sm"
                icon={CalendarPlus}
                onClick={() => setReserveOpen(true)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                Reservar
              </Button>
            </div>
          )}

          {/* Alertas */}
          {(isLowSessions || isExpiringSoon) && !showReserveBand && (
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                {isLowSessions && (
                  <p className="text-amber-700 dark:text-amber-400">
                    ¡Te quedan pocas sesiones!
                  </p>
                )}
                {isExpiringSoon && (
                  <p className="text-amber-700 dark:text-amber-400">
                    Tu plan vence en {daysUntilExpiry} días
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      <PlanReserveSheet
        isOpen={reserveOpen}
        onClose={() => setReserveOpen(false)}
        events={eligibleEvents}
        sessionsRemaining={sessionsRemaining}
      />
    </>
  )
}

export default PlanCard
