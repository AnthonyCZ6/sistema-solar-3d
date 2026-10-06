import { describe, expect, it } from 'vitest'
import {
  OVERVIEW_ELEVATION_DEG,
  easeInOutCubic,
  focusDistance,
  minZoomDistance,
  overviewCameraPosition,
  overviewDistance,
} from './focus'

const FOV_DEG = 50
const HALF_FOV_TAN = Math.tan(((FOV_DEG / 2) * Math.PI) / 180)

describe('focusDistance', () => {
  it('es proporcional al tamaño mostrado del cuerpo', () => {
    expect(focusDistance(2)).toBeCloseTo(2 * focusDistance(1))
  })

  it('siempre deja la cámara más lejos que el zoom mínimo', () => {
    for (const extent of [0.5, 1, 3, 10]) {
      expect(focusDistance(extent)).toBeGreaterThan(minZoomDistance(extent))
    }
  })

  it('rechaza tamaños no positivos', () => {
    expect(() => focusDistance(0)).toThrow(RangeError)
  })
})

describe('minZoomDistance', () => {
  it('mantiene la cámara fuera del cuerpo', () => {
    for (const extent of [0.5, 1, 10]) {
      expect(minZoomDistance(extent)).toBeGreaterThan(extent)
    }
  })

  it('rechaza tamaños no positivos', () => {
    expect(() => minZoomDistance(-1)).toThrow(RangeError)
  })
})

describe('overviewDistance', () => {
  it('en pantalla ancha, la órbita exterior cabe a lo alto', () => {
    const distance = overviewDistance(100, 16 / 9, FOV_DEG)
    expect(distance * HALF_FOV_TAN).toBeGreaterThanOrEqual(100)
  })

  it('en pantalla vertical (celular), la órbita exterior cabe a lo ancho', () => {
    const aspect = 0.5
    const distance = overviewDistance(100, aspect, FOV_DEG)
    expect(distance * HALF_FOV_TAN * aspect).toBeGreaterThanOrEqual(100)
  })

  it('aleja más la cámara en pantalla vertical que en pantalla ancha', () => {
    expect(overviewDistance(100, 0.5, FOV_DEG)).toBeGreaterThan(
      overviewDistance(100, 16 / 9, FOV_DEG),
    )
  })

  it('rechaza valores no positivos', () => {
    expect(() => overviewDistance(0, 1, FOV_DEG)).toThrow(RangeError)
    expect(() => overviewDistance(100, 0, FOV_DEG)).toThrow(RangeError)
  })
})

describe('overviewCameraPosition', () => {
  it('coloca la cámara a la distancia pedida y elevada sobre el plano de las órbitas', () => {
    const position = overviewCameraPosition(100)
    const elevationDeg = (Math.asin(position.y / 100) * 180) / Math.PI

    expect(Math.hypot(position.x, position.y, position.z)).toBeCloseTo(100)
    expect(position.y).toBeGreaterThan(0)
    expect(elevationDeg).toBeCloseTo(OVERVIEW_ELEVATION_DEG)
  })
})

describe('easeInOutCubic', () => {
  it('empieza en 0, pasa por 0.5 a la mitad y termina en 1', () => {
    expect(easeInOutCubic(0)).toBe(0)
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5)
    expect(easeInOutCubic(1)).toBe(1)
  })

  it('limita los valores fuera de rango', () => {
    expect(easeInOutCubic(-1)).toBe(0)
    expect(easeInOutCubic(2)).toBe(1)
  })

  it('siempre crece', () => {
    let previous = -Infinity
    for (let t = 0; t <= 1; t += 0.05) {
      const value = easeInOutCubic(t)
      expect(value).toBeGreaterThanOrEqual(previous)
      previous = value
    }
  })
})
