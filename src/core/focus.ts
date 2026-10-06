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

/** Curva de animación suave: lenta al inicio y al final. Acepta t fuera de 0–1. */
export function easeInOutCubic(t: number): number {
  const clamped = Math.min(Math.max(t, 0), 1)
  return clamped < 0.5 ? 4 * clamped ** 3 : 1 - (-2 * clamped + 2) ** 3 / 2
}
