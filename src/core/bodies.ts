/**
 * Datos físicos del Sol y los 8 planetas.
 *
 * Fuentes: NASA Planetary Fact Sheet y NASA Sun Fact Sheet
 * (https://nssdc.gsfc.nasa.gov/planetary/factsheet/).
 *
 * La rotación retrógrada (Venus, Urano) se expresa con una inclinación del eje
 * mayor a 90°, por eso los periodos de rotación son siempre positivos.
 */

export type BodyId =
  | 'sol'
  | 'mercurio'
  | 'venus'
  | 'tierra'
  | 'marte'
  | 'jupiter'
  | 'saturno'
  | 'urano'
  | 'neptuno'

export type BodyKind = 'estrella' | 'planeta'

export interface OrbitData {
  /** Distancia media al Sol en unidades astronómicas. */
  readonly distanceAu: number
  /** Tiempo en dar una vuelta al Sol, en días terrestres. */
  readonly periodDays: number
}

export interface RingData {
  /** Radio interior de los anillos dividido entre el radio del planeta. */
  readonly innerRadiusRatio: number
  /** Radio exterior de los anillos dividido entre el radio del planeta. */
  readonly outerRadiusRatio: number
  readonly textureFile: string
}

export interface CelestialBody {
  readonly id: BodyId
  readonly name: string
  readonly kind: BodyKind
  /** Radio ecuatorial en kilómetros. */
  readonly radiusKm: number
  readonly orbit: OrbitData | null
  /** Tiempo en girar sobre su eje, en horas. */
  readonly rotationPeriodHours: number
  /** Inclinación del eje respecto a su órbita, en grados (0–180). */
  readonly axialTiltDeg: number
  /** Color que se usa si la textura no carga. */
  readonly fallbackColor: string
  readonly textureFile: string
  readonly ring: RingData | null
}

const RAW_BODIES: readonly CelestialBody[] = [
  {
    id: 'sol',
    name: 'Sol',
    kind: 'estrella',
    radiusKm: 695_700,
    orbit: null,
    rotationPeriodHours: 609.12,
    axialTiltDeg: 7.25,
    fallbackColor: '#ffcc33',
    textureFile: '2k_sun.jpg',
    ring: null,
  },
  {
    id: 'mercurio',
    name: 'Mercurio',
    kind: 'planeta',
    radiusKm: 2_439.5,
    orbit: { distanceAu: 0.387, periodDays: 88.0 },
    rotationPeriodHours: 1_407.6,
    axialTiltDeg: 0.034,
    fallbackColor: '#9e9e9e',
    textureFile: '2k_mercury.jpg',
    ring: null,
  },
  {
    id: 'venus',
    name: 'Venus',
    kind: 'planeta',
    radiusKm: 6_051.8,
    orbit: { distanceAu: 0.723, periodDays: 224.7 },
    rotationPeriodHours: 5_832.5,
    axialTiltDeg: 177.4,
    fallbackColor: '#e8cda2',
    textureFile: '2k_venus_atmosphere.jpg',
    ring: null,
  },
  {
    id: 'tierra',
    name: 'Tierra',
    kind: 'planeta',
    radiusKm: 6_378.1,
    orbit: { distanceAu: 1.0, periodDays: 365.2 },
    rotationPeriodHours: 23.9,
    axialTiltDeg: 23.4,
    fallbackColor: '#2f6db5',
    textureFile: '2k_earth_daymap.jpg',
    ring: null,
  },
  {
    id: 'marte',
    name: 'Marte',
    kind: 'planeta',
    radiusKm: 3_396.2,
    orbit: { distanceAu: 1.524, periodDays: 687.0 },
    rotationPeriodHours: 24.6,
    axialTiltDeg: 25.2,
    fallbackColor: '#c1440e',
    textureFile: '2k_mars.jpg',
    ring: null,
  },
  {
    id: 'jupiter',
    name: 'Júpiter',
    kind: 'planeta',
    radiusKm: 71_492,
    orbit: { distanceAu: 5.204, periodDays: 4_331 },
    rotationPeriodHours: 9.9,
    axialTiltDeg: 3.1,
    fallbackColor: '#d8ca9d',
    textureFile: '2k_jupiter.jpg',
    ring: null,
  },
  {
    id: 'saturno',
    name: 'Saturno',
    kind: 'planeta',
    radiusKm: 60_268,
    orbit: { distanceAu: 9.572, periodDays: 10_747 },
    rotationPeriodHours: 10.7,
    axialTiltDeg: 26.7,
    fallbackColor: '#e3d29b',
    textureFile: '2k_saturn.jpg',
    // Del borde interior del anillo C (74 658 km) al exterior del anillo A (136 775 km).
    ring: { innerRadiusRatio: 1.24, outerRadiusRatio: 2.27, textureFile: '2k_saturn_ring_alpha.png' },
  },
  {
    id: 'urano',
    name: 'Urano',
    kind: 'planeta',
    radiusKm: 25_559,
    orbit: { distanceAu: 19.16, periodDays: 30_589 },
    rotationPeriodHours: 17.2,
    axialTiltDeg: 97.8,
    fallbackColor: '#9fd8e0',
    textureFile: '2k_uranus.jpg',
    ring: null,
  },
  {
    id: 'neptuno',
    name: 'Neptuno',
    kind: 'planeta',
    radiusKm: 24_764,
    orbit: { distanceAu: 30.18, periodDays: 59_800 },
    rotationPeriodHours: 16.1,
    axialTiltDeg: 28.3,
    fallbackColor: '#3f54ba',
    textureFile: '2k_neptune.jpg',
    ring: null,
  },
]

function freezeBody(body: CelestialBody): CelestialBody {
  return Object.freeze({
    ...body,
    orbit: body.orbit ? Object.freeze({ ...body.orbit }) : null,
    ring: body.ring ? Object.freeze({ ...body.ring }) : null,
  })
}

/** El Sol y los 8 planetas, en orden desde el Sol. */
export const BODIES: readonly CelestialBody[] = Object.freeze(RAW_BODIES.map(freezeBody))

/** Solo los planetas, en orden desde el Sol. */
export const PLANETS: readonly CelestialBody[] = Object.freeze(
  BODIES.filter((body) => body.kind === 'planeta'),
)

export function getBody(id: BodyId): CelestialBody {
  const body = BODIES.find((candidate) => candidate.id === id)
  if (!body) {
    throw new Error(`Cuerpo celeste desconocido: ${id}`)
  }
  return body
}

/** Valida un id que llega de fuera (por ejemplo, del objeto 3D que se tocó). */
export function isBodyId(value: unknown): value is BodyId {
  return BODIES.some((body) => body.id === value)
}

export const SUN: CelestialBody = getBody('sol')
