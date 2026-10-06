export interface ContextSource {
  getContext(contextId: string): unknown
}

export type CanvasFactory = () => ContextSource

const createBrowserCanvas: CanvasFactory = () => document.createElement('canvas')

/** Three.js (desde r163) solo funciona con WebGL2. */
export function isWebGLAvailable(createCanvas: CanvasFactory = createBrowserCanvas): boolean {
  try {
    return Boolean(createCanvas().getContext('webgl2'))
  } catch {
    // Algunos navegadores lanzan un error en lugar de devolver null: también significa "no disponible".
    return false
  }
}
