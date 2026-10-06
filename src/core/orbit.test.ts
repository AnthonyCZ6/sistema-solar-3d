import { describe, expect, it } from 'vitest'
import { PLANETS, getBody, type BodyId } from './bodies'
import {
  SECONDS_PER_EARTH_DAY,
  SECONDS_PER_EARTH_YEAR,
  initialOrbitalAngle,
  orbitalAngle,
  orbitalPosition,
  spinAngle,
} from './orbit'

const TWO_PI = Math.PI * 2

function periodDaysOf(id: BodyId): number {
  const orbit = getBody(id).orbit
  if (!orbit) throw new Error(`${id} no tiene órbita`)
  return orbit.periodDays
}

describe('orbitalPosition', () => {
  it('en el ángulo 0 está sobre el eje X positivo', () => {
    const position = orbitalPosition(10, 0)
    expect(position.x).toBeCloseTo(10)
    expect(position.z).toBeCloseTo(0)
  })

  it('avanza en sentido antihorario visto desde arriba (z negativo a 90°)', () => {
    const position = orbitalPosition(10, Math.PI / 2)
    expect(position.x).toBeCloseTo(0)
    expect(position.z).toBeCloseTo(-10)
  })

  it('siempre está a la distancia indicada del centro', () => {
    for (const angle of [0, 1, 2.5, 4, 6]) {
      const position = orbitalPosition(7, angle)
      expect(Math.hypot(position.x, position.z)).toBeCloseTo(7)
    }
  })
})

describe('orbitalAngle', () => {
  it('en t=0 devuelve el ángulo inicial', () => {
    expect(orbitalAngle(365.2, 0, 1.2)).toBeCloseTo(1.2)
  })

  it('la Tierra da una vuelta completa en SECONDS_PER_EARTH_YEAR', () => {
    const earthDays = periodDaysOf('tierra')
    const start = orbitalPosition(1, orbitalAngle(earthDays, 0))
    const half = orbitalPosition(1, orbitalAngle(earthDays, SECONDS_PER_EARTH_YEAR / 2))
    const end = orbitalPosition(1, orbitalAngle(earthDays, SECONDS_PER_EARTH_YEAR))

    expect(half.x).toBeCloseTo(-1)
    expect(end.x).toBeCloseTo(start.x)
    expect(end.z).toBeCloseTo(start.z)
  })

  it('cada planeta vuelve al mismo punto tras su periodo', () => {
    const earthDays = periodDaysOf('tierra')
    const initialAngle = 0.7
    for (const planet of PLANETS) {
      const periodDays = periodDaysOf(planet.id)
      const periodSeconds = (SECONDS_PER_EARTH_YEAR * periodDays) / earthDays
      const start = orbitalPosition(1, orbitalAngle(periodDays, 0, initialAngle))
      const end = orbitalPosition(1, orbitalAngle(periodDays, periodSeconds, initialAngle))
      expect(end.x, planet.name).toBeCloseTo(start.x)
      expect(end.z, planet.name).toBeCloseTo(start.z)
    }
  })

  it('Mercurio avanza más rápido que Neptuno', () => {
    expect(orbitalAngle(periodDaysOf('mercurio'), 1)).toBeGreaterThan(
      orbitalAngle(periodDaysOf('neptuno'), 1),
    )
  })

  it('devuelve ángulos entre 0 y 2π aunque pase mucho tiempo', () => {
    const angle = orbitalAngle(periodDaysOf('mercurio'), 12_345.6, 5)
    expect(angle).toBeGreaterThanOrEqual(0)
    expect(angle).toBeLessThan(TWO_PI)
  })

  it('rechaza periodos no positivos', () => {
    expect(() => orbitalAngle(0, 1)).toThrow(RangeError)
  })
})

describe('spinAngle (rotación sobre su eje)', () => {
  it('la Tierra da una vuelta sobre su eje en SECONDS_PER_EARTH_DAY', () => {
    const hours = getBody('tierra').rotationPeriodHours
    const full = spinAngle(hours, SECONDS_PER_EARTH_DAY)
    const half = spinAngle(hours, SECONDS_PER_EARTH_DAY / 2)

    expect(Math.cos(full)).toBeCloseTo(1)
    expect(Math.sin(full)).toBeCloseTo(0)
    expect(Math.cos(half)).toBeCloseTo(-1)
  })

  it('Júpiter gira más rápido que la Tierra', () => {
    const jupiter = spinAngle(getBody('jupiter').rotationPeriodHours, 0.5)
    const earth = spinAngle(getBody('tierra').rotationPeriodHours, 0.5)
    expect(jupiter).toBeGreaterThan(earth)
  })

  it('rechaza periodos no positivos', () => {
    expect(() => spinAngle(-3, 1)).toThrow(RangeError)
  })
})

describe('initialOrbitalAngle', () => {
  it('reparte los planetas en ángulos distintos entre 0 y 2π', () => {
    const angles = PLANETS.map((_, index) => initialOrbitalAngle(index))
    const distinct = new Set(angles.map((angle) => angle.toFixed(3)))

    expect(distinct.size).toBe(PLANETS.length)
    for (const angle of angles) {
      expect(angle).toBeGreaterThanOrEqual(0)
      expect(angle).toBeLessThan(TWO_PI)
    }
  })
})
