import { BufferGeometry, LineBasicMaterial, LineLoop, Vector3 } from 'three'
import { orbitalPosition } from '../core/orbit'

const ORBIT_SEGMENTS = 256
const ORBIT_COLOR = 0xffffff
const ORBIT_OPACITY = 0.18

/** Círculo tenue que marca el camino de un planeta alrededor del Sol. */
export function createOrbitLine(radius: number): LineLoop {
  const points = Array.from({ length: ORBIT_SEGMENTS }, (_, index) => {
    const { x, z } = orbitalPosition(radius, (index / ORBIT_SEGMENTS) * Math.PI * 2)
    return new Vector3(x, 0, z)
  })
  const geometry = new BufferGeometry().setFromPoints(points)
  const material = new LineBasicMaterial({
    color: ORBIT_COLOR,
    transparent: true,
    opacity: ORBIT_OPACITY,
  })
  return new LineLoop(geometry, material)
}
