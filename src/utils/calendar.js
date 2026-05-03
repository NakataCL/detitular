// Helpers para exportar eventos al calendario del usuario (.ics)

const toICSDate = (date) =>
  date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

const escapeICS = (text = '') =>
  text
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')

const buildUid = (event) => {
  const id = event.id || `${event.title}-${event.date}`
  return `${id}@detitular`.replace(/\s+/g, '-')
}

/**
 * Genera el contenido de un archivo .ics estándar para un evento.
 */
export const generateICS = (event) => {
  const startDate = event.date?.toDate ? event.date.toDate() : new Date(event.date)
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000) // +2h por defecto

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Detitular//Academia de Futbol//ES',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${buildUid(event)}`,
    `DTSTAMP:${toICSDate(new Date())}`,
    `DTSTART:${toICSDate(startDate)}`,
    `DTEND:${toICSDate(endDate)}`,
    `SUMMARY:${escapeICS(event.title || 'Evento')}`,
    `DESCRIPTION:${escapeICS(event.description || '')}`,
    `LOCATION:${escapeICS(event.location || '')}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n')
}

/**
 * Descarga el evento como .ics — funciona en navegador.
 */
export const downloadICS = (event) => {
  const blob = new Blob([generateICS(event)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  const safeName = (event.title || 'evento').replace(/[^a-z0-9_-]+/gi, '_')
  link.download = `${safeName}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
