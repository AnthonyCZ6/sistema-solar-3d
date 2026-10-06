// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest'
import { finishLoading, setAppState } from './notices'

describe('estado de la página', () => {
  beforeEach(() => {
    setAppState('cargando')
  })

  it('setAppState guarda el estado en body[data-estado]', () => {
    setAppState('sin-webgl')

    expect(document.body.dataset.estado).toBe('sin-webgl')
  })

  it('finishLoading quita el aviso de carga', () => {
    finishLoading()

    expect(document.body.dataset.estado).toBe('listo')
  })

  it('finishLoading no tapa un mensaje de error', () => {
    setAppState('error')

    finishLoading()

    expect(document.body.dataset.estado).toBe('error')
  })
})
