// Self-check de la clasificación de convocatorias: node src/utils/rankRegistrations.test.mjs
import assert from 'node:assert/strict'
import { rankRegistrations } from './helpers.js'

const reg = (id, userId, minutes) => ({
  id,
  userId,
  registeredAt: new Date(2026, 0, 1, 10, minutes)
})

// 4 de campo (inscritos en orden a1..a4) + 3 arqueros (g1..g3)
const registrations = [
  reg('a3', 'u3', 30),
  reg('g2', 'p2', 5),
  reg('a1', 'u1', 10),
  reg('g3', 'p3', 1),
  reg('a4', 'u4', 40),
  reg('a2', 'u2', 20),
  reg('g1', 'p1', 15)
]

const positions = { p1: 'portero', p2: 'portero', p3: 'portero', u1: 'delantero-centro' }
const selectedIds = (rows) => rows.filter(r => r.selected).map(r => r.id)

// --- Por orden de inscripción: 2 plazas de campo + 2 de arquero ---
const porOrden = rankRegistrations(registrations, { mode: 'orden', maxSlots: 2, positions })

assert.deepEqual(selectedIds(porOrden).sort(), ['a1', 'a2', 'g2', 'g3'])
// Los arqueros van primero y con su propio ranking, no compiten con los de campo.
assert.deepEqual(porOrden.map(r => r.id), ['g3', 'g2', 'g1', 'a1', 'a2', 'a3', 'a4'])
assert.equal(porOrden.find(r => r.id === 'g1').selectionRank, 3)
assert.equal(porOrden.find(r => r.id === 'a1').selectionRank, 1)
assert.equal(porOrden.find(r => r.id === 'a1').isGoalkeeper, false)
assert.equal(porOrden.find(r => r.id === 'g1').isGoalkeeper, true)

// --- Por entrenamientos: manda el contador, empate por hora de inscripción ---
const trainingCounts = { u1: 0, u2: 5, u3: 5, u4: 9, p1: 7, p2: 0, p3: 0 }
const porEntreno = rankRegistrations(registrations, {
  mode: 'entrenamiento',
  trainingCounts,
  maxSlots: 2,
  positions
})

// u4 (9) > u2 y u3 (5, desempata quien se inscribió antes) > u1 (0)
assert.deepEqual(
  porEntreno.filter(r => !r.isGoalkeeper).map(r => r.id),
  ['a4', 'a2', 'a3', 'a1']
)
assert.deepEqual(selectedIds(porEntreno).sort(), ['a2', 'a4', 'g1', 'g3'])
assert.equal(porEntreno.find(r => r.id === 'a4').trainingCount, 9)

// --- Sin inscritos no revienta ---
assert.deepEqual(rankRegistrations([], { maxSlots: 20 }), [])

console.log('rankRegistrations OK')
