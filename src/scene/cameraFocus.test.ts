import { Object3D, PerspectiveCamera, Vector3 } from 'three'
import { describe, expect, it } from 'vitest'
import { focusDistance, minZoomDistance, overviewCameraPosition } from '../core/focus'
import {
  MAX_ZOOM_OUT_FACTOR,
  TRANSITION_SECONDS,
  createCameraRig,
  type CameraControls,
} from './cameraFocus'

const OVERVIEW_DISTANCE = 200
const OVERVIEW_MIN_DISTANCE = 15
const FRAME_SECONDS = 1 / 60
const EXTENT = 2

function setup(reducedMotion = false) {
  const camera = new PerspectiveCamera(50, 16 / 9, 0.1, 1000)
  const controls: CameraControls = {
    target: new Vector3(),
    minDistance: 0,
    maxDistance: Infinity,
    enabled: true,
    update: () => true,
  }
  const rig = createCameraRig(camera, controls, {
    overviewDistance: OVERVIEW_DISTANCE,
    overviewMinDistance: OVERVIEW_MIN_DISTANCE,
    reducedMotion,
  })
  return { camera, controls, rig }
}

function runFrames(rig: ReturnType<typeof setup>['rig'], seconds: number): void {
  const frames = Math.ceil(seconds / FRAME_SECONDS)
  for (let frame = 0; frame < frames; frame++) rig.update(FRAME_SECONDS)
}

function bodyAt(x: number, y: number, z: number): Object3D {
  const body = new Object3D()
  body.position.set(x, y, z)
  return body
}

function expectVectorClose(actual: Vector3, expected: { x: number; y: number; z: number }): void {
  expect(actual.x).toBeCloseTo(expected.x)
  expect(actual.y).toBeCloseTo(expected.y)
  expect(actual.z).toBeCloseTo(expected.z)
}

describe('createCameraRig', () => {
  it('empieza en la vista general mirando al Sol', () => {
    const { camera, controls } = setup()

    expectVectorClose(camera.position, overviewCameraPosition(OVERVIEW_DISTANCE))
    expectVectorClose(controls.target, { x: 0, y: 0, z: 0 })
    expect(controls.minDistance).toBe(OVERVIEW_MIN_DISTANCE)
    expect(controls.maxDistance).toBe(OVERVIEW_DISTANCE * MAX_ZOOM_OUT_FACTOR)
  })

  it('durante el viaje desactiva los gestos y no recorta el zoom', () => {
    const { controls, rig } = setup()

    rig.focusOn({ object: bodyAt(50, 0, 0), extent: EXTENT })
    rig.update(FRAME_SECONDS)

    expect(controls.enabled).toBe(false)
    expect(controls.minDistance).toBe(0)
  })

  it('a mitad del viaje la cámara va en camino, no ha llegado ni sigue en el inicio', () => {
    const { controls, rig } = setup()
    const body = bodyAt(50, 0, 0)

    rig.focusOn({ object: body, extent: EXTENT })
    runFrames(rig, TRANSITION_SECONDS / 2)

    const remaining = controls.target.distanceTo(body.position)
    expect(remaining).toBeGreaterThan(0)
    expect(remaining).toBeLessThan(50)
  })

  it('al llegar, queda a la distancia de enfoque, por encima del cuerpo y con los gestos activos', () => {
    const { camera, controls, rig } = setup()
    const body = bodyAt(50, 0, 0)

    rig.focusOn({ object: body, extent: EXTENT })
    runFrames(rig, TRANSITION_SECONDS + 0.1)

    expectVectorClose(controls.target, body.position)
    expect(camera.position.distanceTo(body.position)).toBeCloseTo(focusDistance(EXTENT))
    expect(camera.position.y).toBeGreaterThan(body.position.y)
    expect(controls.enabled).toBe(true)
    expect(controls.minDistance).toBe(minZoomDistance(EXTENT))
  })

  it('sigue al cuerpo cuando avanza en su órbita, conservando el ángulo de la cámara', () => {
    const { camera, controls, rig } = setup()
    const body = bodyAt(50, 0, 0)
    rig.focusOn({ object: body, extent: EXTENT })
    runFrames(rig, TRANSITION_SECONDS + 0.1)
    const offsetBefore = camera.position.clone().sub(controls.target)

    body.position.set(0, 0, -50)
    rig.update(FRAME_SECONDS)

    expectVectorClose(controls.target, body.position)
    expectVectorClose(camera.position.clone().sub(controls.target), offsetBefore)
  })

  it('"Ver todo" regresa a la vista general', () => {
    const { camera, controls, rig } = setup()
    rig.focusOn({ object: bodyAt(50, 0, 0), extent: EXTENT })
    runFrames(rig, TRANSITION_SECONDS + 0.1)

    rig.showOverview()
    runFrames(rig, TRANSITION_SECONDS + 0.1)

    expectVectorClose(camera.position, overviewCameraPosition(OVERVIEW_DISTANCE))
    expectVectorClose(controls.target, { x: 0, y: 0, z: 0 })
    expect(controls.minDistance).toBe(OVERVIEW_MIN_DISTANCE)
    expect(controls.enabled).toBe(true)
  })

  it('con movimiento reducido el viaje es instantáneo', () => {
    const { controls, rig } = setup(true)
    const body = bodyAt(50, 0, 0)

    rig.focusOn({ object: body, extent: EXTENT })
    rig.update(0)

    expectVectorClose(controls.target, body.position)
    expect(controls.enabled).toBe(true)
  })

  it('enfoca desde arriba aunque la cámara esté por debajo del plano de las órbitas', () => {
    const { camera, rig } = setup()
    camera.position.set(0, -100, 50)

    rig.focusOn({ object: bodyAt(30, 0, 0), extent: EXTENT })
    runFrames(rig, TRANSITION_SECONDS + 0.1)

    expect(camera.position.y).toBeGreaterThan(0)
  })

  it('si la cámara está justo sobre el cuerpo, usa una dirección de respaldo sin valores inválidos', () => {
    const { camera, rig } = setup()
    const body = bodyAt(camera.position.x, camera.position.y, camera.position.z)

    rig.focusOn({ object: body, extent: EXTENT })
    runFrames(rig, TRANSITION_SECONDS + 0.1)

    expect(Number.isFinite(camera.position.length())).toBe(true)
    expect(camera.position.distanceTo(body.position)).toBeCloseTo(focusDistance(EXTENT))
  })

  it('al cambiar el tamaño de pantalla en la vista general, reajusta el zoom sin cambiar el ángulo', () => {
    const { camera, controls, rig } = setup()
    camera.position.set(100, 50, 0)
    const directionBefore = camera.position.clone().normalize()
    const distanceBefore = camera.position.length()

    rig.setOverviewDistance(OVERVIEW_DISTANCE * 2)

    expect(camera.position.length()).toBeCloseTo(distanceBefore * 2)
    expectVectorClose(camera.position.clone().normalize(), directionBefore)
    expect(controls.maxDistance).toBe(OVERVIEW_DISTANCE * 2 * MAX_ZOOM_OUT_FACTOR)
  })

  it('al cambiar el tamaño de pantalla mientras sigue un cuerpo, no mueve la cámara', () => {
    const { camera, rig } = setup()
    rig.focusOn({ object: bodyAt(50, 0, 0), extent: EXTENT })
    runFrames(rig, TRANSITION_SECONDS + 0.1)
    const positionBefore = camera.position.clone()

    rig.setOverviewDistance(OVERVIEW_DISTANCE * 2)

    expectVectorClose(camera.position, positionBefore)
  })
})
