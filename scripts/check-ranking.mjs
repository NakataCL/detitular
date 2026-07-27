// Chequeo del ranking de convocatoria por entrenamientos: node scripts/check-ranking.mjs
import assert from 'node:assert/strict'
import { rankRegistrations } from '../src/utils/helpers.js'

const ts = (iso) => ({ toDate: () => new Date(iso) })

const regs = [
  { id: 'a', userId: 'ana', registeredAt: ts('2026-07-01T10:00:00Z') },
  { id: 'b', userId: 'beto', registeredAt: ts('2026-07-01T09:00:00Z') },
  { id: 'c', userId: 'caro', registeredAt: ts('2026-07-01T08:00:00Z') },
  { id: 'd', userId: 'dani', registeredAt: '2026-07-01T11:00:00Z' } // sin Timestamp
]

const counts = { ana: 5, beto: 2, caro: 2 } // dani sin entrenamientos

const ranked = rankRegistrations(regs, counts, 2)

// Más entrenamientos primero; empate (beto/caro) por orden de inscripción.
assert.deepEqual(ranked.map(r => r.userId), ['ana', 'caro', 'beto', 'dani'])
assert.deepEqual(ranked.map(r => r.selectionRank), [1, 2, 3, 4])
assert.deepEqual(ranked.map(r => r.selected), [true, true, false, false])
assert.equal(ranked.at(-1).trainingCount, 0)

// No muta la entrada.
assert.equal(regs[0].userId, 'ana')
assert.equal(regs[0].selected, undefined)

// Sin cupos nadie queda titular; con cupos de sobra, todos.
assert.deepEqual(rankRegistrations(regs, counts, 0).map(r => r.selected), [false, false, false, false])
assert.deepEqual(rankRegistrations(regs, counts, 99).map(r => r.selected), [true, true, true, true])

console.log('ok — ranking de convocatoria')
