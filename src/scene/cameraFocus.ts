import { Vector3, type Object3D, type PerspectiveCamera } from 'three'
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import {
  easeInOutCubic,
  focusDistance,
  minZoomDistance,
  overviewCameraPosition,
} from '../core/focus'

const TRANSITION_SECONDS = 1.5
/** Al enfocar, la cámara mira al cuerpo un poco desde arriba. */
const MIN_FOCUS_ELEVATION = 0.3
/** Cuánto más lejos que la vista general se puede alejar el estudiante. */
const MAX_ZOOM_OUT_FACTOR = 1.5
const FALLBACK_FOCUS_DIRECTION = new Vector3(0, 1, 1).normalize()

export interface FocusTarget {
  readonly object: Object3D
  readonly extent: number
}

export interface CameraRigOptions {
  readonly overviewDistance: number
  /** Zoom mínimo en la vista general (para no entrar en el Sol). */
  readonly overviewMinDistance: number
  /** Si el usuario pidió reducir el movimiento, los viajes de cámara son instantáneos. */
  readonly reducedMotion: boolean
}

export interface CameraRig {
  focusOn(target: FocusTarget): void
  showOverview(): void
  setOverviewDistance(distance: number): void
  update(deltaSeconds: number): void
}

interface Transition {
  readonly fromCamera: Vector3
  readonly fromTarget: Vector3
  readonly endMinDistance: number
  elapsed: number
}

/**
 * Controla los viajes de la cámara: hacia un cuerpo (y lo sigue en su órbita)
 * o de vuelta a la vista general. Entre viajes, el estudiante mueve la cámara
 * libremente con OrbitControls.
 */
export function createCameraRig(
  camera: PerspectiveCamera,
  controls: OrbitControls,
  options: CameraRigOptions,
): CameraRig {
  const duration = options.reducedMotion ? 0 : TRANSITION_SECONDS
  const goalTarget = new Vector3()
  const goalCamera = new Vector3()
  const overviewPosition = new Vector3()
  const scratch = new Vector3()
  let overviewDistance = options.overviewDistance
  let followed: FocusTarget | null = null
  let focusOffset = new Vector3()
  let transition: Transition | null = null

  function computeGoal(): void {
    if (followed) {
      followed.object.getWorldPosition(goalTarget)
      goalCamera.copy(goalTarget).add(focusOffset)
      return
    }
    goalTarget.set(0, 0, 0)
    goalCamera.copy(overviewPosition)
  }

  function startTransition(endMinDistance: number): void {
    transition = {
      fromCamera: camera.position.clone(),
      fromTarget: controls.target.clone(),
      endMinDistance,
      elapsed: 0,
    }
    // Durante el viaje, OrbitControls no debe recortar la distancia ni recibir gestos.
    controls.minDistance = 0
    controls.enabled = false
  }

  function focusDirection(bodyPosition: Vector3): Vector3 {
    const direction = camera.position.clone().sub(bodyPosition)
    if (direction.lengthSq() === 0) return FALLBACK_FOCUS_DIRECTION.clone()
    direction.normalize()
    direction.y = Math.max(direction.y, MIN_FOCUS_ELEVATION)
    return direction.normalize()
  }

  function focusOn(target: FocusTarget): void {
    followed = target
    const bodyPosition = target.object.getWorldPosition(new Vector3())
    focusOffset = focusDirection(bodyPosition).multiplyScalar(focusDistance(target.extent))
    startTransition(minZoomDistance(target.extent))
  }

  function showOverview(): void {
    followed = null
    startTransition(options.overviewMinDistance)
  }

  function setOverviewDistance(distance: number): void {
    const previous = overviewDistance
    overviewDistance = distance
    const position = overviewCameraPosition(distance)
    overviewPosition.set(position.x, position.y, position.z)
    controls.maxDistance = distance * MAX_ZOOM_OUT_FACTOR

    // Al girar el celular, reajusta el zoom de la vista general para que la órbita
    // exterior siga cabiendo, sin cambiar el ángulo que eligió el estudiante.
    if (!followed && !transition) {
      scratch.subVectors(camera.position, controls.target).multiplyScalar(distance / previous)
      camera.position.copy(controls.target).add(scratch)
    }
  }

  function advanceTransition(current: Transition, deltaSeconds: number): void {
    current.elapsed += deltaSeconds
    const progress = duration === 0 ? 1 : easeInOutCubic(current.elapsed / duration)
    controls.target.lerpVectors(current.fromTarget, goalTarget, progress)
    camera.position.lerpVectors(current.fromCamera, goalCamera, progress)
    if (progress >= 1) {
      controls.minDistance = current.endMinDistance
      controls.enabled = true
      transition = null
    }
  }

  function update(deltaSeconds: number): void {
    computeGoal()
    if (transition) {
      advanceTransition(transition, deltaSeconds)
    } else if (followed) {
      // Acompaña al cuerpo en su órbita sin quitarle al estudiante el control de la cámara.
      scratch.copy(goalTarget).sub(controls.target)
      controls.target.add(scratch)
      camera.position.add(scratch)
    }
    controls.update()
  }

  controls.target.set(0, 0, 0)
  setOverviewDistance(overviewDistance)
  camera.position.copy(overviewPosition)
  controls.minDistance = options.overviewMinDistance

  return { focusOn, showOverview, setOverviewDistance, update }
}
