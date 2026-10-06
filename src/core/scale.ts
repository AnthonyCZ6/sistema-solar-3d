/**
 * Escala didáctica: los tamaños y distancias reales no caben juntos en una
 * pantalla, así que se comprimen con exponentes menores a 1. Se conserva el
 * orden (qué es más grande o más lejano), no la proporción real.
 */
import { getBody, type CelestialBody } from './bodies'

/** Radio con el que se dibuja la Tierra; es la unidad de la escena. */
export const EARTH_DISPLAY_RADIUS = 1
/** Comprime las diferencias de tamaño (0.5 = raíz cuadrada). */
export const RADIUS_EXPONENT = 0.5
/** Ningún cuerpo se dibuja más pequeño que esto, para que se pueda ver y tocar. */
export const MIN_DISPLAY_RADIUS = 0.5
/** Unidades de escena por cada (UA ^ DISTANCE_EXPONENT). */
export const DISTANCE_SCALE = 25
/** Comprime las distancias (0.5 = raíz cuadrada). */
export const DISTANCE_EXPONENT = 0.5

const EARTH_RADIUS_KM = getBody('tierra').radiusKm

export function displayRadius(body: Pick<CelestialBody, 'radiusKm'>): number {
  const relativeToEarth = body.radiusKm / EARTH_RADIUS_KM
  const compressed = EARTH_DISPLAY_RADIUS * relativeToEarth ** RADIUS_EXPONENT
  return Math.max(compressed, MIN_DISPLAY_RADIUS)
}

/** Radio que ocupa el cuerpo en pantalla, incluyendo sus anillos. */
export function displayExtent(body: Pick<CelestialBody, 'radiusKm' | 'ring'>): number {
  return displayRadius(body) * (body.ring?.outerRadiusRatio ?? 1)
}

/** Radio de la órbita en la escena; 0 para el Sol. */
export function displayOrbitRadius(body: Pick<CelestialBody, 'orbit'>): number {
  if (!body.orbit) return 0
  return DISTANCE_SCALE * body.orbit.distanceAu ** DISTANCE_EXPONENT
}
