import {
  AmbientLight,
  EquirectangularReflectionMapping,
  LoadingManager,
  PerspectiveCamera,
  PointLight,
  Raycaster,
  SRGBColorSpace,
  Scene,
  TextureLoader,
  Vector2,
  WebGLRenderer,
  type Object3D,
} from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { BODIES, PLANETS, SUN, isBodyId, type BodyId } from '../core/bodies'
import { minZoomDistance, overviewDistance } from '../core/focus'
import { initialOrbitalAngle, orbitalAngle, orbitalPosition, spinAngle } from '../core/orbit'
import { displayExtent, displayOrbitRadius } from '../core/scale'
import { createBodyObject, type BodyObject } from './bodyMeshes'
import { createCameraRig, type CameraRig } from './cameraFocus'
import { createOrbitLine } from './orbitLines'

const FOV_DEG = 50
const NEAR_PLANE = 0.1
const FAR_PLANE_FACTOR = 4
/** Más de 2 píxeles físicos por píxel CSS cuesta mucho y casi no se nota. */
const MAX_PIXEL_RATIO = 2
/** Evita saltos grandes cuando la pestaña estuvo en segundo plano. */
const MAX_FRAME_DELTA_SECONDS = 0.1
/** Si el puntero se movió más que esto, fue un arrastre de cámara y no un clic. */
const CLICK_TOLERANCE_PX = 6
const SUN_LIGHT_INTENSITY = 2.5
/** Luz de relleno para que el lado nocturno de los planetas no quede negro. */
const AMBIENT_LIGHT_INTENSITY = 0.12
const BACKGROUND_INTENSITY = 0.45
const BACKGROUND_TEXTURE = '2k_stars_milky_way.jpg'

export interface SolarSystemEvents {
  onFocusChange(id: BodyId | null): void
  onTexturesLoaded(): void
  /** La escena dejó de funcionar (error en la animación o se perdió el contexto WebGL). */
  onFatalError(error: unknown): void
}

/** Datos de movimiento de cada cuerpo que no cambian entre cuadros. */
interface BodyMotion {
  readonly object: BodyObject
  readonly orbitRadius: number
  readonly initialAngle: number
}

export interface SolarSystemView {
  focusOn(id: BodyId): void
  showOverview(): void
}

function textureUrl(file: string): string {
  return `${import.meta.env.BASE_URL}textures/${file}`
}

function setStarBackground(scene: Scene, loader: TextureLoader): void {
  loader.load(
    textureUrl(BACKGROUND_TEXTURE),
    (texture) => {
      texture.mapping = EquirectangularReflectionMapping
      texture.colorSpace = SRGBColorSpace
      scene.background = texture
      scene.backgroundIntensity = BACKGROUND_INTENSITY
    },
    undefined,
    () => console.warn('[texturas] No se pudo cargar el fondo de estrellas; se usa fondo negro.'),
  )
}

function planMotions(objects: readonly BodyObject[]): readonly BodyMotion[] {
  return objects.map((object) => ({
    object,
    orbitRadius: displayOrbitRadius(object.body),
    initialAngle: initialOrbitalAngle(PLANETS.indexOf(object.body)),
  }))
}

function placeBodies(motions: readonly BodyMotion[], elapsedSeconds: number): void {
  for (const { object, orbitRadius, initialAngle } of motions) {
    const { body, anchor, spinner } = object
    spinner.rotation.y = spinAngle(body.rotationPeriodHours, elapsedSeconds)
    if (!body.orbit) continue
    const angle = orbitalAngle(body.orbit.periodDays, elapsedSeconds, initialAngle)
    const { x, z } = orbitalPosition(orbitRadius, angle)
    anchor.position.set(x, 0, z)
  }
}

function enablePicking(
  canvas: HTMLCanvasElement,
  camera: PerspectiveCamera,
  pickables: readonly Object3D[],
  onPick: (id: BodyId) => void,
): void {
  const raycaster = new Raycaster()
  const pointer = new Vector2()
  let downPointerId: number | null = null
  let downX = 0
  let downY = 0

  canvas.addEventListener('pointerdown', (event) => {
    // Solo cuenta el botón principal o el primer dedo: el botón derecho y los
    // pellizcos mueven la cámara y no deben enfocar nada.
    downPointerId = event.isPrimary && event.button === 0 ? event.pointerId : null
    downX = event.clientX
    downY = event.clientY
  })
  canvas.addEventListener('pointerup', (event) => {
    if (event.pointerId !== downPointerId) return
    downPointerId = null
    if (Math.hypot(event.clientX - downX, event.clientY - downY) > CLICK_TOLERANCE_PX) return
    const rect = canvas.getBoundingClientRect()
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    )
    raycaster.setFromCamera(pointer, camera)
    const [hit] = raycaster.intersectObjects([...pickables], false)
    const id: unknown = hit?.object.userData.bodyId
    if (isBodyId(id)) onPick(id)
  })
}

function createView(
  objects: readonly BodyObject[],
  rig: CameraRig,
  events: SolarSystemEvents,
): SolarSystemView {
  const byId = new Map(objects.map((object) => [object.body.id, object]))
  return {
    focusOn(id) {
      const target = byId.get(id)
      if (!target) throw new Error(`No hay objeto 3D para ${id}`)
      rig.focusOn({ object: target.anchor, extent: target.extent })
      events.onFocusChange(id)
    },
    showOverview() {
      rig.showOverview()
      events.onFocusChange(null)
    },
  }
}

function startLoop(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: PerspectiveCamera,
  motions: readonly BodyMotion[],
  rig: CameraRig,
  onFatalError: (error: unknown) => void,
): void {
  let simulatedSeconds = 0
  let previousTime: number | null = null
  renderer.setAnimationLoop((time: number) => {
    try {
      const delta =
        previousTime === null ? 0 : Math.min((time - previousTime) / 1000, MAX_FRAME_DELTA_SECONDS)
      previousTime = time
      simulatedSeconds += delta
      placeBodies(motions, simulatedSeconds)
      rig.update(delta)
      renderer.render(scene, camera)
    } catch (error) {
      // Un error aquí se repetiría en cada cuadro: se detiene la animación y se avisa una vez.
      renderer.setAnimationLoop(null)
      onFatalError(error)
    }
  })
}

/** Crea la escena 3D del sistema solar sobre el canvas y la pone en marcha. */
export function createSolarSystem(
  canvas: HTMLCanvasElement,
  events: SolarSystemEvents,
): SolarSystemView {
  const renderer = new WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO))

  const scene = new Scene()
  const loader = new TextureLoader(new LoadingManager(() => events.onTexturesLoaded()))
  setStarBackground(scene, loader)
  scene.add(
    new AmbientLight(0xffffff, AMBIENT_LIGHT_INTENSITY),
    new PointLight(0xffffff, SUN_LIGHT_INTENSITY, 0, 0),
  )

  const objects = BODIES.map((body) => createBodyObject(body, loader, textureUrl))
  scene.add(
    ...objects.map((object) => object.anchor),
    ...PLANETS.map((planet) => createOrbitLine(displayOrbitRadius(planet))),
  )
  const motions = planMotions(objects)
  placeBodies(motions, 0)

  const camera = new PerspectiveCamera(FOV_DEG, window.innerWidth / window.innerHeight, NEAR_PLANE)
  const controls = new OrbitControls(camera, canvas)
  controls.enableDamping = true
  const outerRadius = Math.max(...PLANETS.map(displayOrbitRadius))
  const rig = createCameraRig(camera, controls, {
    overviewDistance: overviewDistance(outerRadius, camera.aspect, FOV_DEG),
    overviewMinDistance: minZoomDistance(displayExtent(SUN)),
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  })

  const view = createView(objects, rig, events)
  enablePicking(canvas, camera, objects.flatMap((object) => object.pickables), (id) => view.focusOn(id))

  const fitToViewport = (): void => {
    renderer.setSize(window.innerWidth, window.innerHeight)
    camera.aspect = window.innerWidth / window.innerHeight
    const distance = overviewDistance(outerRadius, camera.aspect, FOV_DEG)
    camera.far = distance * FAR_PLANE_FACTOR
    camera.updateProjectionMatrix()
    rig.setOverviewDistance(distance)
  }
  window.addEventListener('resize', fitToViewport)
  fitToViewport()

  // En celulares el sistema puede quitarle la GPU a la pestaña; sin esto quedaría congelada.
  canvas.addEventListener('webglcontextlost', () => {
    renderer.setAnimationLoop(null)
    events.onFatalError(new Error('Se perdió el contexto WebGL'))
  })

  startLoop(renderer, scene, camera, motions, rig, (error) => events.onFatalError(error))
  return view
}
