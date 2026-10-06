import { describe, expect, it } from 'vitest'
import { isWebGLAvailable } from './webgl'

describe('isWebGLAvailable', () => {
  it('devuelve true si el canvas entrega un contexto WebGL2', () => {
    expect(isWebGLAvailable(() => ({ getContext: () => ({}) }))).toBe(true)
  })

  it('devuelve false si el navegador no entrega contexto', () => {
    expect(isWebGLAvailable(() => ({ getContext: () => null }))).toBe(false)
  })

  it('devuelve false si pedir el contexto lanza un error', () => {
    const throwing = () => ({
      getContext: () => {
        throw new Error('bloqueado')
      },
    })
    expect(isWebGLAvailable(throwing)).toBe(false)
  })

  it('pide WebGL2, que es lo que necesita Three.js', () => {
    const requested: string[] = []
    isWebGLAvailable(() => ({
      getContext: (contextId: string) => {
        requested.push(contextId)
        return null
      },
    }))
    expect(requested).toEqual(['webgl2'])
  })
})
