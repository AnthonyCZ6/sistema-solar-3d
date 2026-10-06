/**
 * Movimiento de los planetas en el tiempo de la simulación.
 * Órbitas circulares y en un mismo plano (simplificación didáctica).
 * El plano de las órbitas es XZ; Y apunta al norte de la eclíptica.
 */
import { getBody } from './bodies'
import { assertPositive } from './validation'

const TWO_PI = Math.PI * 2
/** Ángulo áureo: reparte los planetas alrededor del Sol sin que queden alineados. */
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

/** Segundos reales que tarda la Tierra en dar una vuelta al Sol. */
export const SECONDS_PER_EARTH_YEAR = 60
/**
 * Segundos reales que tarda la Tierra en girar sobre su eje. Es una escala
 * distinta a la orbital: a la misma escala giraría 6 veces por segundo.
 */
export const SECONDS_PER_EARTH_DAY = 4

export interface OrbitalPoint {
  readonly x: number
  readonly z: number
}

function requireEarthOrbitDays(): number {
  const orbit = getBody('tierra').orbit
  if (!orbit) throw new Error('Faltan los datos de la órbita de la Tierra')
  return orbit.periodDays
}

const EARTH_ORBIT_DAYS = requireEarthOrbitDays()
const EARTH_ROTATION_HOURS = getBody('tierra').rotationPeriodHours

function normalizeAngle(angle: number): number {
  const wrapped = angle % TWO_PI
  return wrapped < 0 ? wrapped + TWO_PI : wrapped
}

/** Ángulo de la órbita (radianes, 0–2π) tras `elapsedSeconds` de simulación. */
export function orbitalAngle(periodDays: number, elapsedSeconds: number, initialAngle = 0): number {
  assertPositive(periodDays, 'El periodo orbital')
  const periodSeconds = SECONDS_PER_EARTH_YEAR * (periodDays / EARTH_ORBIT_DAYS)
  return normalizeAngle(initialAngle + TWO_PI * (elapsedSeconds / periodSeconds))
}

/** Punto de la órbita; avanza en sentido antihorario visto desde arriba. */
export function orbitalPosition(radius: number, angle: number): OrbitalPoint {
  return { x: radius * Math.cos(angle), z: -radius * Math.sin(angle) }
}

/** Ángulo de rotación sobre su eje (radianes, 0–2π) tras `elapsedSeconds`. */
export function spinAngle(rotationPeriodHours: number, elapsedSeconds: number): number {
  assertPositive(rotationPeriodHours, 'El periodo de rotación')
  const spinSeconds = SECONDS_PER_EARTH_DAY * (rotationPeriodHours / EARTH_ROTATION_HOURS)
  return normalizeAngle(TWO_PI * (elapsedSeconds / spinSeconds))
}

/** Ángulo de partida del planeta número `index`, para que no salgan alineados. */
export function initialOrbitalAngle(index: number): number {
  return normalizeAngle(index * GOLDEN_ANGLE)
}
