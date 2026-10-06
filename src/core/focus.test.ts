import { describe, expect, it } from 'vitest'
import {
  FOCUS_DISTANCE_FACTOR,
  NO_INSET,
  OVERVIEW_ELEVATION_DEG,
  easeInOutCubic,
  focusDistance,
  minZoomDistance,
  overviewCameraPosition,
  overviewDistance,
  panelInset,
  viewOffsetForInset,
  zoomForInset,
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

describe('viewOffsetForInset', () => {
  it('sin nada que tape la escena no desplaza el encuadre', () => {
    expect(viewOffsetForInset(NO_INSET)).toEqual({ x: 0, y: 0 })
  })

  it('con un panel a la derecha mueve el centro la mitad de su ancho', () => {
    expect(viewOffsetForInset({ right: 356, bottom: 0 })).toEqual({ x: 178, y: 0 })
  })

  it('con una hoja abajo mueve el centro la mitad de su alto', () => {
    expect(viewOffsetForInset({ right: 0, bottom: 340 })).toEqual({ x: 0, y: 170 })
  })

  it('rechaza medidas negativas o que no son números', () => {
    expect(() => viewOffsetForInset({ right: -1, bottom: 0 })).toThrow(RangeError)
    expect(() => viewOffsetForInset({ right: 0, bottom: Number.NaN })).toThrow(RangeError)
  })
})

describe('panelInset', () => {
  it('sin panel, o con un panel sin tamaño, no tapa nada', () => {
    const viewport = { width: 1280, height: 800 }
    expect(panelInset(null, viewport)).toEqual(NO_INSET)
    expect(panelInset({ left: 0, top: 0, width: 0, height: 0 }, viewport)).toEqual(NO_INSET)
  })

  it('una columna a la derecha (escritorio) tapa desde su borde izquierdo', () => {
    const rect = { left: 924, top: 16, width: 340, height: 700 }
    expect(panelInset(rect, { width: 1280, height: 800 })).toEqual({ right: 356, bottom: 0 })
  })

  it('una hoja inferior (celular vertical) tapa desde su borde superior', () => {
    const rect = { left: 16, top: 300, width: 328, height: 250 }
    expect(panelInset(rect, { width: 360, height: 640 })).toEqual({ right: 0, bottom: 340 })
  })

  it('un panel en la mitad derecha (celular horizontal) cuenta como columna', () => {
    const rect = { left: 370, top: 16, width: 354, height: 250 }
    expect(panelInset(rect, { width: 740, height: 360 })).toEqual({ right: 370, bottom: 0 })
  })

  it('un panel fuera de la pantalla no da medidas negativas', () => {
    const rect = { left: 1400, top: 16, width: 340, height: 700 }
    expect(panelInset(rect, { width: 1280, height: 800 })).toEqual({ right: 0, bottom: 0 })
  })
})

describe('zoomForInset', () => {
  /** Alto en píxeles del cuerpo enfocado (a la distancia de enfoque) con un zoom dado. */
  function focusedBodyPx(viewportHeight: number, zoom: number): number {
    return (viewportHeight * zoom) / (FOCUS_DISTANCE_FACTOR * HALF_FOV_TAN)
  }

  const cases = [
    { name: 'celular vertical con hoja inferior', viewport: { width: 360, height: 640 }, inset: { right: 0, bottom: 374 } },
    { name: 'ventana angosta con columna', viewport: { width: 641, height: 600 }, inset: { right: 356, bottom: 0 } },
    { name: 'tableta vertical con columna', viewport: { width: 768, height: 1024 }, inset: { right: 356, bottom: 0 } },
    { name: 'escritorio con columna', viewport: { width: 1280, height: 800 }, inset: { right: 356, bottom: 0 } },
    { name: 'celular horizontal con columna', viewport: { width: 740, height: 360 }, inset: { right: 370, bottom: 0 } },
  ]

  it('sin panel no cambia nada', () => {
    expect(zoomForInset(NO_INSET, { width: 360, height: 640 })).toBe(1)
  })

  it('nunca acerca más que sin panel', () => {
    for (const { name, viewport, inset } of cases) {
      expect(zoomForInset(inset, viewport), name).toBeLessThanOrEqual(1)
    }
  })

  it('el cuerpo enfocado cabe en la zona que no tapa el panel', () => {
    for (const { name, viewport, inset } of cases) {
      const freeSide = Math.min(viewport.width - inset.right, viewport.height - inset.bottom)
      const bodyPx = focusedBodyPx(viewport.height, zoomForInset(inset, viewport))
      expect(bodyPx, name).toBeLessThan(freeSide)
    }
  })

  it('si sobra espacio (escritorio ancho), no aleja la vista', () => {
    expect(zoomForInset({ right: 356, bottom: 0 }, { width: 1280, height: 800 })).toBe(1)
  })

  it('aunque el panel tape casi todo, el zoom no baja de un mínimo', () => {
    expect(zoomForInset({ right: 0, bottom: 639 }, { width: 360, height: 640 })).toBeGreaterThan(0.1)
  })

  it('rechaza medidas negativas y pantallas sin tamaño', () => {
    expect(() => zoomForInset({ right: -1, bottom: 0 }, { width: 360, height: 640 })).toThrow(RangeError)
    expect(() => zoomForInset({ right: 10, bottom: 0 }, { width: 360, height: 0 })).toThrow(RangeError)
  })
})
