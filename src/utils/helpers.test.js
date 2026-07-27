// Check del normalizado de teléfonos — la lógica de la que depende el login.
// Ejecutar: node --test src/utils/helpers.test.js
import { test } from 'node:test'
import assert from 'node:assert'
import { normalizePhone, phoneToAuthEmail, formatPhone, userContact } from './helpers.js'

test('normalizePhone lleva cualquier formato chileno a E.164', () => {
  assert.equal(normalizePhone('+569 1234 5678'), '+56912345678')
  assert.equal(normalizePhone('+56 9 1234 5678'), '+56912345678')
  assert.equal(normalizePhone('912345678'), '+56912345678')   // sin prefijo país
  assert.equal(normalizePhone('56912345678'), '+56912345678') // con país, sin +
  assert.equal(normalizePhone('9 1234 5678'), '+56912345678')
})

test('normalizePhone respeta otros países si vienen con +', () => {
  assert.equal(normalizePhone('+54 9 11 1234 5678'), '+5491112345678')
})

test('normalizePhone rechaza lo inválido', () => {
  assert.equal(normalizePhone('123'), null)
  assert.equal(normalizePhone(''), null)
  assert.equal(normalizePhone(null), null)
  assert.equal(normalizePhone('hola'), null)
})

test('el mismo número siempre produce la misma credencial', () => {
  const variantes = ['+569 1234 5678', '912345678', '56912345678']
  const correos = variantes.map(v => phoneToAuthEmail(normalizePhone(v)))
  assert.deepEqual(new Set(correos), new Set(['56912345678@detitular.app']))
})

test('formatPhone y userContact para mostrar', () => {
  assert.equal(formatPhone('+56912345678'), '+56 9 1234 5678')
  assert.equal(formatPhone(''), '')
  assert.equal(userContact({ telefono: '+56912345678' }), '+56 9 1234 5678')
  assert.equal(userContact({ email: 'admin@gmail.com' }), 'admin@gmail.com')
  assert.equal(userContact(null), '')
})
