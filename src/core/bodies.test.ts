import { describe, expect, it } from 'vitest'
import { BODIES, PLANETS, SUN, getBody, isBodyId, type BodyId } from './bodies'

const EXPECTED_IDS: readonly BodyId[] = [
  'sol',
  'mercurio',
  'venus',
  'tierra',
  'marte',
  'jupiter',
  'saturno',
  'urano',
  'neptuno',
]

const EXPECTED_NAMES = [
  'Sol',
  'Mercurio',
  'Venus',
  'Tierra',
  'Marte',
  'Júpiter',
  'Saturno',
  'Urano',
  'Neptuno',
]

describe('bodies', () => {
  it('incluye el Sol y los 8 planetas en orden desde el Sol', () => {
    expect(BODIES.map((body) => body.id)).toEqual(EXPECTED_IDS)
  })

  it('usa los nombres en español', () => {
    expect(BODIES.map((body) => body.name)).toEqual(EXPECTED_NAMES)
  })

  it('el Sol es una estrella sin órbita', () => {
    expect(SUN.kind).toBe('estrella')
    expect(SUN.orbit).toBeNull()
  })

  it('cada planeta tiene órbita con distancia y periodo positivos', () => {
    expect(PLANETS).toHaveLength(8)
    for (const planet of PLANETS) {
      expect(planet.kind).toBe('planeta')
      expect(planet.orbit?.distanceAu).toBeGreaterThan(0)
      expect(planet.orbit?.periodDays).toBeGreaterThan(0)
    }
  })

  it('los planetas están ordenados por distancia creciente al Sol', () => {
    const distances = PLANETS.map((planet) => planet.orbit?.distanceAu ?? 0)
    const sorted = [...distances].sort((a, b) => a - b)
    expect(distances).toEqual(sorted)
  })

  it('los valores físicos son positivos y la inclinación del eje está entre 0° y 180°', () => {
    for (const body of BODIES) {
      expect(body.radiusKm).toBeGreaterThan(0)
      expect(body.rotationPeriodHours).toBeGreaterThan(0)
      expect(body.axialTiltDeg).toBeGreaterThanOrEqual(0)
      expect(body.axialTiltDeg).toBeLessThanOrEqual(180)
    }
  })

  it('solo Venus y Urano tienen el eje inclinado más de 90°, por eso giran al revés', () => {
    const retrograde = BODIES.filter((body) => body.axialTiltDeg > 90).map((body) => body.id)
    expect(retrograde).toEqual(['venus', 'urano'])
  })

  it('cada cuerpo tiene color de respaldo y archivo de textura', () => {
    for (const body of BODIES) {
      expect(body.fallbackColor).toMatch(/^#[0-9a-f]{6}$/i)
      expect(body.textureFile).toMatch(/\.(jpg|png)$/)
    }
  })

  it('solo Saturno tiene anillos, y su radio interior es menor que el exterior', () => {
    const withRings = BODIES.filter((body) => body.ring !== null)
    expect(withRings.map((body) => body.id)).toEqual(['saturno'])

    const ring = getBody('saturno').ring
    expect(ring?.innerRadiusRatio).toBeGreaterThan(1)
    expect(ring?.outerRadiusRatio).toBeGreaterThan(ring?.innerRadiusRatio ?? Infinity)
    expect(ring?.textureFile).toMatch(/\.png$/)
  })

  it('los datos no se pueden modificar', () => {
    expect(Object.isFrozen(BODIES)).toBe(true)
    expect(Object.isFrozen(PLANETS)).toBe(true)
    for (const body of BODIES) {
      expect(Object.isFrozen(body)).toBe(true)
      if (body.orbit) expect(Object.isFrozen(body.orbit)).toBe(true)
      if (body.ring) expect(Object.isFrozen(body.ring)).toBe(true)
    }
    expect(() => {
      ;(BODIES[0] as { name: string }).name = 'Otro'
    }).toThrow(TypeError)
  })

  it('getBody devuelve el cuerpo por su id', () => {
    expect(getBody('tierra').name).toBe('Tierra')
  })

  it('getBody lanza un error claro con un id desconocido', () => {
    expect(() => getBody('pluton' as BodyId)).toThrow(/pluton/)
  })

  it('isBodyId reconoce solo ids válidos', () => {
    expect(isBodyId('saturno')).toBe(true)
    expect(isBodyId('pluton')).toBe(false)
    expect(isBodyId(undefined)).toBe(false)
    expect(isBodyId(42)).toBe(false)
  })
})
