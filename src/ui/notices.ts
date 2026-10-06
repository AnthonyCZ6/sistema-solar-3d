/**
 * Estado visible de la página. Se guarda en `body[data-estado]` y el CSS
 * decide qué mostrar: aviso de carga, escena 3D o un mensaje de problema.
 */
export type AppState = 'cargando' | 'listo' | 'sin-webgl' | 'error'

export function setAppState(state: AppState): void {
  document.body.dataset.estado = state
}

/** Quita el aviso de carga solo si sigue cargando; nunca tapa un mensaje de error. */
export function finishLoading(): void {
  if (document.body.dataset.estado === 'cargando') setAppState('listo')
}
