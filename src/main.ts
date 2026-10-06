import './styles.css'
import { BODIES, getBody } from './core/bodies'
import { buildFactSheet } from './core/factSheet'
import { FACTS } from './core/facts'
import { panelInset } from './core/focus'
import { isWebGLAvailable } from './core/webgl'
import { createSolarSystem, type SolarSystemView } from './scene/createScene'
import { createBodyMenu } from './ui/bodyMenu'
import { createInfoPanel } from './ui/infoPanel'
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

/**
 * Mantiene el cuerpo enfocado fuera de la ficha y le pasa al CSS el alto del menú,
 * para que en celular la ficha quede justo encima de él.
 */
function keepSceneClearOfPanel(panel: HTMLElement, menu: HTMLElement, view: SolarSystemView): void {
  const update = (): void => {
    document.documentElement.style.setProperty('--alto-menu', `${menu.offsetHeight}px`)
    const viewport = { width: window.innerWidth, height: window.innerHeight }
    view.setViewInset(panelInset(panel.hidden ? null : panel.getBoundingClientRect(), viewport))
  }
  // Abrir, cerrar o cambiar de ficha cambia su tamaño; rotar la pantalla cambia todo.
  const observer = new ResizeObserver(update)
  observer.observe(panel)
  observer.observe(menu)
  window.addEventListener('resize', update)
}

function start(): void {
  if (!isWebGLAvailable()) {
    setAppState('sin-webgl')
    return
  }

  const canvas = requireElement('#escena', HTMLCanvasElement)
  const nav = requireElement('#menu-cuerpos', HTMLElement)
  const aside = requireElement('#ficha', HTMLElement)
  const menu = createBodyMenu(nav, requireElement('#estado-enfoque', HTMLElement), BODIES, {
    onSelect: (id) => view.focusOn(id),
    onOverview: () => view.showOverview(),
  })
  const panel = createInfoPanel(aside, {
    onClose: () => {
      // Si el foco estaba en la ficha, se devuelve al menú para no perderlo al ocultarla.
      const hadFocus = aside.contains(document.activeElement)
      panel.hide()
      if (hadFocus) menu.focusActive()
    },
  })
  const view = createSolarSystem(canvas, {
    onFocusChange: (id) => {
      menu.setActive(id)
      if (id) panel.show(buildFactSheet(getBody(id), FACTS[id]))
      else panel.hide()
    },
    onTexturesLoaded: finishLoading,
    onFatalError: reportFatalError,
  })
  keepSceneClearOfPanel(aside, nav, view)
  window.setTimeout(finishLoading, LOADING_NOTICE_MAX_MS)
}

try {
  start()
} catch (error) {
  reportFatalError(error)
}
