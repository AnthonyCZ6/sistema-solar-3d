/** Cálculos de cámara: a qué distancia enfocar y desde dónde mostrar todo. */
import { assertPositive } from './validation'

/** Al enfocar, la cámara queda a esta cantidad de "tamaños" del cuerpo. */
export const FOCUS_DISTANCE_FACTOR = 4
/** Lo más cerca que se puede acercar la cámara, en "tamaños" del cuerpo. */
export const MIN_ZOOM_FACTOR = 1.5
/** Margen alrededor de la órbita exterior en la vista general. */
export const OVERVIEW_MARGIN = 1.1
/** Ángulo de la cámara sobre el plano de las órbitas en la vista general. */
export const OVERVIEW_ELEVATION_DEG = 35

const DEG_TO_RAD = Math.PI / 180

export interface Point3 {
  readonly x: number
  readonly y: number
  readonly z: number
}

/** Distancia de la cámara al enfocar un cuerpo de radio visible `extent`. */
export function focusDistance(extent: number): number {
  assertPositive(extent, 'El tamaño del cuerpo')
  return extent * FOCUS_DISTANCE_FACTOR
}

/** Distancia mínima de zoom para no meter la cámara dentro del cuerpo. */
export function minZoomDistance(extent: number): number {
  assertPositive(extent, 'El tamaño del cuerpo')
  return extent * MIN_ZOOM_FACTOR
}

/**
 * Distancia a la que la órbita exterior cabe completa en pantalla.
 * En pantallas verticales (celular) limita el ancho, no el alto.
 */
export function overviewDistance(outerRadius: number, aspect: number, verticalFovDeg: number): number {
  assertPositive(outerRadius, 'El radio de la órbita exterior')
  assertPositive(aspect, 'La proporción de la pantalla')
  assertPositive(verticalFovDeg, 'El campo de visión')
  const halfFovTan = Math.tan((verticalFovDeg / 2) * DEG_TO_RAD)
  const limitingHalfTan = halfFovTan * Math.min(aspect, 1)
  return (outerRadius * OVERVIEW_MARGIN) / limitingHalfTan
}

/** Posición de la cámara en la vista general, elevada sobre el plano de las órbitas. */
export function overviewCameraPosition(distance: number): Point3 {
  const elevation = OVERVIEW_ELEVATION_DEG * DEG_TO_RAD
  return { x: 0, y: distance * Math.sin(elevation), z: distance * Math.cos(elevation) }
}

/** Píxeles de la pantalla que tapa un panel, a la derecha o abajo. */
export interface ViewInset {
  readonly right: number
  readonly bottom: number
}

export const NO_INSET: ViewInset = Object.freeze({ right: 0, bottom: 0 })

export interface ScreenRect {
  readonly left: number
  readonly top: number
  readonly width: number
  readonly height: number
}

export interface Viewport {
  readonly width: number
  readonly height: number
}

function assertNonNegative(value: number, label: string): void {
  if (!(value >= 0) || !Number.isFinite(value)) {
    throw new RangeError(`${label} debe ser un número mayor o igual a 0 (recibido: ${value})`)
  }
}

/**
 * Cuánto mover el encuadre (en píxeles, para `camera.setViewOffset`) para que
 * el centro de la vista quede en el centro de la zona que el panel no tapa.
 */
export function viewOffsetForInset(inset: ViewInset): { x: number; y: number } {
  assertNonNegative(inset.right, 'El ancho tapado')
  assertNonNegative(inset.bottom, 'El alto tapado')
  return { x: inset.right / 2, y: inset.bottom / 2 }
}

/** Aunque un panel tape casi toda la pantalla, la escena no se aleja más que esto. */
export const MIN_INSET_ZOOM = 0.25

/**
 * Zoom de la cámara (`camera.zoom`) para que el cuerpo enfocado ocupe de la zona libre
 * lo mismo que ocupa del alto de la pantalla sin panel. Nunca acerca: como mucho vale 1.
 */
export function zoomForInset(inset: ViewInset, viewport: Viewport): number {
  assertNonNegative(inset.right, 'El ancho tapado')
  assertNonNegative(inset.bottom, 'El alto tapado')
  assertPositive(viewport.width, 'El ancho de la pantalla')
  assertPositive(viewport.height, 'El alto de la pantalla')
  if (inset.right === 0 && inset.bottom === 0) return 1
  const freeSide = Math.min(viewport.width - inset.right, viewport.height - inset.bottom)
  return Math.min(1, Math.max(MIN_INSET_ZOOM, freeSide / viewport.height))
}

/**
 * Qué tapa un panel: si deja más espacio libre a su izquierda es una columna
 * a la derecha (escritorio o celular horizontal); si deja más arriba, una hoja inferior.
 */
export function panelInset(panel: ScreenRect | null, viewport: Viewport): ViewInset {
  if (!panel || panel.width <= 0 || panel.height <= 0) return NO_INSET
  const freeAreaLeft = panel.left * viewport.height
  const freeAreaAbove = panel.top * viewport.width
  if (freeAreaLeft >= freeAreaAbove) {
    return { right: Math.max(0, viewport.width - panel.left), bottom: 0 }
  }
  return { right: 0, bottom: Math.max(0, viewport.height - panel.top) }
}

/** Curva de animación suave: lenta al inicio y al final. Acepta t fuera de 0–1. */
export function easeInOutCubic(t: number): number {
  const clamped = Math.min(Math.max(t, 0), 1)
  return clamped < 0.5 ? 4 * clamped ** 3 : 1 - (-2 * clamped + 2) ** 3 / 2
}
