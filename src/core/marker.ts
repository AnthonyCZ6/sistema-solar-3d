import { assertPositive } from './validation'

const DEG_TO_RAD = Math.PI / 180

/**
 * Escala de un Sprite de Three.js con `sizeAttenuation: false` para que mida
 * `pixelSize` píxeles de alto, sin importar qué tan lejos esté de la cámara.
 */
export function fixedPixelSpriteScale(
  pixelSize: number,
  viewportHeight: number,
  verticalFovDeg: number,
): number {
  assertPositive(pixelSize, 'El tamaño del marcador')
  assertPositive(viewportHeight, 'El alto de la pantalla')
  assertPositive(verticalFovDeg, 'El campo de visión')
  return (2 * pixelSize * Math.tan((verticalFovDeg / 2) * DEG_TO_RAD)) / viewportHeight
}
