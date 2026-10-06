import { describe, expect, it } from 'vitest'
import { BODIES, PLANETS, SUN, getBody } from './bodies'
import {
  MIN_DISPLAY_RADIUS,
  displayExtent,
  displayOrbitRadius,
  displayRadius,
} from './scale'

const EARTH = getBody('tierra')

describe('displayRadius (tamaño didáctico)', () => {
  it('la Tierra mide 1 unidad y sirve de referencia', () => {
    expect(displayRadius(EARTH)).toBeCloseTo(1)
  })

  it('el Sol es el cuerpo más grande', () => {
    for (const planet of PLANETS) {
      expect(displayRadius(SUN)).toBeGreaterThan(displayRadius(planet))
    }
  })

  it('respeta el orden real de tamaños', () => {
    const byRealSize = [...BODIES].sort((a, b) => b.radiusKm - a.radiusKm).map((b) => b.id)
    const byDisplaySize = [...BODIES]
      .sort((a, b) => displayRadius(b) - displayRadius(a))
      .map((b) => b.id)
    expect(byDisplaySize).toEqual(byRealSize)
  })

  it('comprime las diferencias: el Sol se ve menos de 109 veces más grande que la Tierra', () => {
    const realRatio = SUN.radiusKm / EARTH.radiusKm
    expect(displayRadius(SUN) / displayRadius(EARTH)).toBeLessThan(realRatio)
  })

  it('ningún cuerpo queda por debajo del tamaño mínimo visible', () => {
    for (const body of BODIES) {
      expect(displayRadius(body)).toBeGreaterThanOrEqual(MIN_DISPLAY_RADIUS)
    }
  })

  it('aplica el tamaño mínimo a un cuerpo diminuto', () => {
    const tiny = { ...getBody('mercurio'), radiusKm: 1 }
    expect(displayRadius(tiny)).toBe(MIN_DISPLAY_RADIUS)
  })
})

describe('displayExtent (tamaño incluyendo anillos)', () => {
  it('incluye los anillos de Saturno', () => {
    const saturn = getBody('saturno')
    expect(displayExtent(saturn)).toBeGreaterThan(displayRadius(saturn))
  })

  it('es igual al radio en cuerpos sin anillos', () => {
    const jupiter = getBody('jupiter')
    expect(displayExtent(jupiter)).toBe(displayRadius(jupiter))
  })
})

describe('displayOrbitRadius (distancia didáctica)', () => {
  it('el Sol está en el centro', () => {
    expect(displayOrbitRadius(SUN)).toBe(0)
  })

  it('respeta el orden de distancias', () => {
    const radii = PLANETS.map(displayOrbitRadius)
    for (let i = 1; i < radii.length; i++) {
      expect(radii[i]).toBeGreaterThan(radii[i - 1] ?? Infinity)
    }
  })

  it('las órbitas vecinas no se tocan, contando el tamaño de cada planeta y los anillos', () => {
    for (let i = 0; i < PLANETS.length - 1; i++) {
      const inner = PLANETS[i]
      const outer = PLANETS[i + 1]
      if (!inner || !outer) throw new Error('faltan planetas')
      const innerEdge = displayOrbitRadius(inner) + displayExtent(inner)
      const outerEdge = displayOrbitRadius(outer) - displayExtent(outer)
      expect(outerEdge, `${inner.name} y ${outer.name} se tocan`).toBeGreaterThan(innerEdge)
    }
  })

  it('la órbita de Mercurio queda fuera del Sol', () => {
    const mercury = getBody('mercurio')
    expect(displayOrbitRadius(mercury) - displayExtent(mercury)).toBeGreaterThan(
      displayRadius(SUN),
    )
  })
})
