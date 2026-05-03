// Helpers para enlaces geográficos universales (Google Maps, etc.)

/**
 * Devuelve un enlace universal a Google Maps que abre la app nativa
 * en iOS y Android, o el sitio web en escritorio.
 */
export const buildGeoLink = (location) => {
  if (!location) return null
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
}
