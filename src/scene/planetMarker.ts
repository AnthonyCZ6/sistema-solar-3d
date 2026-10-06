import { CanvasTexture, SRGBColorSpace, Sprite, SpriteMaterial } from 'three'
import type { CelestialBody } from '../core/bodies'

/** Tamaño del marcador en pantalla; también es la zona que responde al toque. */
export const MARKER_SIZE_PX = 28
const TEXTURE_SIZE = 64
/** El aro ocupa el 60 % del marcador; el resto es margen transparente para tocarlo fácil. */
const RING_RADIUS_RATIO = 0.3
const RING_LINE_WIDTH = 4
const MARKER_OPACITY = 0.85

function createRingTexture(color: string): CanvasTexture | null {
  const canvas = document.createElement('canvas')
  canvas.width = TEXTURE_SIZE
  canvas.height = TEXTURE_SIZE
  const context = canvas.getContext('2d')
  if (!context) return null

  context.strokeStyle = color
  context.lineWidth = RING_LINE_WIDTH
  context.beginPath()
  context.arc(TEXTURE_SIZE / 2, TEXTURE_SIZE / 2, TEXTURE_SIZE * RING_RADIUS_RATIO, 0, Math.PI * 2)
  context.stroke()

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

/**
 * Aro de tamaño fijo en pantalla alrededor de un planeta. De lejos, los planetas
 * interiores miden 1 o 2 píxeles; el aro permite verlos y tocarlos. Al acercarse,
 * la esfera del planeta lo tapa porque el aro está en su centro.
 * Devuelve null si el navegador no puede dibujarlo (no es imprescindible).
 */
export function createPlanetMarker(body: CelestialBody): Sprite | null {
  const texture = createRingTexture(body.fallbackColor)
  if (!texture) {
    console.warn(`[marcadores] No se pudo dibujar el marcador de ${body.name}.`)
    return null
  }
  const material = new SpriteMaterial({
    map: texture,
    sizeAttenuation: false,
    transparent: true,
    opacity: MARKER_OPACITY,
    depthWrite: false,
  })
  const marker = new Sprite(material)
  marker.userData = { bodyId: body.id }
  // Three.js recorta según la escala en el mundo (diminuta), no según los 28 px en pantalla:
  // sin esto el aro desaparece cuando el planeta queda justo fuera del borde.
  marker.frustumCulled = false
  return marker
}
