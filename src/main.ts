import './styles.css'
import { BODIES } from './core/bodies'
import { isWebGLAvailable } from './core/webgl'
import { createSolarSystem } from './scene/createScene'
import { createBodyMenu } from './ui/bodyMenu'
import { finishLoading, setAppState } from './ui/notices'

/** Si alguna textura nunca responde, el aviso de carga no se queda para siempre. */
const LOADING_NOTICE_MAX_MS = 30_000

function requireElement<T extends HTMLElement>(selector: string, type: new () => T): T {
  const element = document.querySelector(selector)
  if (!(element instanceof type)) {
    throw new Error(`Falta el elemento ${selector} en index.html`)
  }
  return element
}

function reportFatalError(error: unknown): void {
  console.error('[sistema-solar] La escena 3D dejó de funcionar.', error)
  setAppState('error')
}

function start(): void {
  if (!isWebGLAvailable()) {
    setAppState('sin-webgl')
    return
  }

  const canvas = requireElement('#escena', HTMLCanvasElement)
  const menu = createBodyMenu(
    requireElement('#menu-cuerpos', HTMLElement),
    requireElement('#estado-enfoque', HTMLElement),
    BODIES,
    {
      onSelect: (id) => view.focusOn(id),
      onOverview: () => view.showOverview(),
    },
  )
  const view = createSolarSystem(canvas, {
    onFocusChange: (id) => menu.setActive(id),
    onTexturesLoaded: finishLoading,
    onFatalError: reportFatalError,
  })
  window.setTimeout(finishLoading, LOADING_NOTICE_MAX_MS)
}

try {
  start()
} catch (error) {
  reportFatalError(error)
}
