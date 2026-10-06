import { describe, expect, it } from 'vitest'
import { fixedPixelSpriteScale } from './marker'

const FOV_DEG = 50
const HALF_FOV_TAN = Math.tan(((FOV_DEG / 2) * Math.PI) / 180)

/** Inverso de la proyección de Three.js para un Sprite con sizeAttenuation = false. */
function projectedPixels(scale: number, viewportHeight: number): number {
  return (scale * viewportHeight) / (2 * HALF_FOV_TAN)
}

describe('fixedPixelSpriteScale', () => {
  it('produce un marcador del tamaño pedido en píxeles', () => {
    const scale = fixedPixelSpriteScale(28, 720, FOV_DEG)
    expect(projectedPixels(scale, 720)).toBeCloseTo(28)
  })

  it('coincide con un valor calculado a mano: 28 px, 720 px de alto y 50° de campo', () => {
    // 2 · 28 · tan(25°) / 720 = 56 · 0.466308 / 720
    expect(fixedPixelSpriteScale(28, 720, FOV_DEG)).toBeCloseTo(0.036268, 5)
  })

  it('mantiene los píxeles al cambiar el alto de la pantalla', () => {
    for (const height of [360, 720, 2160]) {
      const scale = fixedPixelSpriteScale(28, height, FOV_DEG)
      expect(projectedPixels(scale, height)).toBeCloseTo(28)
    }
  })

  it('es proporcional al tamaño pedido', () => {
    expect(fixedPixelSpriteScale(40, 720, FOV_DEG)).toBeCloseTo(
      2 * fixedPixelSpriteScale(20, 720, FOV_DEG),
    )
  })

  it('rechaza valores no positivos', () => {
    expect(() => fixedPixelSpriteScale(0, 720, FOV_DEG)).toThrow(RangeError)
    expect(() => fixedPixelSpriteScale(28, 0, FOV_DEG)).toThrow(RangeError)
    expect(() => fixedPixelSpriteScale(28, 720, 0)).toThrow(RangeError)
  })
})
