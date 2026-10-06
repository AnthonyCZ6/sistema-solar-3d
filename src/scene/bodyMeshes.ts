import {
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  RingGeometry,
  SRGBColorSpace,
  SphereGeometry,
  Vector3,
  type TextureLoader,
} from 'three'
import type { CelestialBody, RingData } from '../core/bodies'
import { displayExtent, displayRadius } from '../core/scale'

const SPHERE_SEGMENTS = 64
const RING_SEGMENTS = 128
const RING_FALLBACK_OPACITY = 0.6
const DEG_TO_RAD = Math.PI / 180

export type TextureUrlResolver = (file: string) => string

export interface BodyObject {
  readonly body: CelestialBody
  /** Se mueve por la órbita; no gira. La cámara lo sigue al enfocar. */
  readonly anchor: Group
  /** Gira sobre el eje inclinado del cuerpo. */
  readonly spinner: Mesh
  /** Mallas que responden a clic o toque. */
  readonly pickables: readonly Mesh[]
  /** Radio visible, incluyendo anillos. */
  readonly extent: number
}

type TexturedMaterial = MeshBasicMaterial | MeshStandardMaterial

function loadTextureInto(
  material: TexturedMaterial,
  url: string,
  loader: TextureLoader,
  label: string,
): void {
  loader.load(
    url,
    (texture) => {
      texture.colorSpace = SRGBColorSpace
      material.map = texture
      material.color.set(0xffffff)
      material.opacity = 1
      material.needsUpdate = true
    },
    undefined,
    () => console.warn(`[texturas] No se pudo cargar ${label}; se usa su color de respaldo.`),
  )
}

function createSphere(body: CelestialBody, loader: TextureLoader, resolveUrl: TextureUrlResolver): Mesh {
  const geometry = new SphereGeometry(displayRadius(body), SPHERE_SEGMENTS, SPHERE_SEGMENTS / 2)
  // El Sol emite su propia luz: no lo afecta la iluminación de la escena.
  const material =
    body.kind === 'estrella'
      ? new MeshBasicMaterial({ color: body.fallbackColor })
      : new MeshStandardMaterial({ color: body.fallbackColor, roughness: 1, metalness: 0 })
  loadTextureInto(material, resolveUrl(body.textureFile), loader, `la textura de ${body.name}`)

  const mesh = new Mesh(geometry, material)
  mesh.userData = { bodyId: body.id }
  return mesh
}

/** La textura del anillo es una franja: el eje U va del borde interior al exterior. */
function mapRingUvsRadially(geometry: RingGeometry, inner: number, outer: number): void {
  const positions = geometry.getAttribute('position')
  const uvs = geometry.getAttribute('uv')
  const vertex = new Vector3()
  for (let index = 0; index < positions.count; index++) {
    vertex.fromBufferAttribute(positions, index)
    uvs.setXY(index, (vertex.length() - inner) / (outer - inner), 0.5)
  }
  uvs.needsUpdate = true
}

function createRing(
  ring: RingData,
  body: CelestialBody,
  loader: TextureLoader,
  resolveUrl: TextureUrlResolver,
): Mesh {
  const planetRadius = displayRadius(body)
  const inner = planetRadius * ring.innerRadiusRatio
  const outer = planetRadius * ring.outerRadiusRatio
  const geometry = new RingGeometry(inner, outer, RING_SEGMENTS)
  mapRingUvsRadially(geometry, inner, outer)

  const material = new MeshBasicMaterial({
    color: body.fallbackColor,
    side: DoubleSide,
    transparent: true,
    opacity: RING_FALLBACK_OPACITY,
  })
  loadTextureInto(material, resolveUrl(ring.textureFile), loader, `los anillos de ${body.name}`)

  const mesh = new Mesh(geometry, material)
  // RingGeometry nace en el plano XY; se acuesta sobre el ecuador del planeta.
  mesh.rotation.x = -Math.PI / 2
  mesh.userData = { bodyId: body.id }
  return mesh
}

export function createBodyObject(
  body: CelestialBody,
  loader: TextureLoader,
  resolveUrl: TextureUrlResolver,
): BodyObject {
  const spinner = createSphere(body, loader, resolveUrl)
  const ring = body.ring ? createRing(body.ring, body, loader, resolveUrl) : null

  // El eje inclinado mantiene su orientación mientras el planeta recorre la órbita.
  const tilt = new Group()
  tilt.rotation.z = body.axialTiltDeg * DEG_TO_RAD
  tilt.add(spinner)
  if (ring) tilt.add(ring)

  const anchor = new Group()
  anchor.add(tilt)

  return {
    body,
    anchor,
    spinner,
    pickables: ring ? [spinner, ring] : [spinner],
    extent: displayExtent(body),
  }
}
