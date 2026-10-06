// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { BODIES } from '../core/bodies'
import { createBodyMenu } from './bodyMenu'

function setup() {
  const nav = document.createElement('nav')
  const status = document.createElement('p')
  const onSelect = vi.fn()
  const onOverview = vi.fn()
  const menu = createBodyMenu(nav, status, BODIES, { onSelect, onOverview })
  return { nav, status, onSelect, onOverview, menu }
}

function bodyButtons(nav: HTMLElement): HTMLButtonElement[] {
  return [...nav.querySelectorAll<HTMLButtonElement>('.boton-cuerpo')]
}

function buttonFor(nav: HTMLElement, id: string): HTMLButtonElement {
  const button = nav.querySelector<HTMLButtonElement>(`[data-body-id="${id}"]`)
  if (!button) throw new Error(`No hay botón para ${id}`)
  return button
}

describe('createBodyMenu', () => {
  it('crea un botón por cuerpo, en orden, con su nombre y sin marcar', () => {
    const { nav } = setup()
    const buttons = bodyButtons(nav)

    expect(buttons.map((button) => button.textContent)).toEqual(BODIES.map((body) => body.name))
    for (const button of buttons) {
      expect(button.type).toBe('button')
      expect(button.getAttribute('aria-pressed')).toBe('false')
    }
  })

  it('la muestra de color es decorativa y queda oculta para lectores de pantalla', () => {
    const { nav } = setup()
    const swatch = buttonFor(nav, 'marte').querySelector<HTMLElement>('.muestra')

    expect(swatch?.getAttribute('aria-hidden')).toBe('true')
    expect(swatch?.style.backgroundColor).not.toBe('')
  })

  it('termina con el botón "Ver todo"', () => {
    const { nav } = setup()
    const last = nav.lastElementChild

    expect(last?.textContent).toBe('Ver todo')
    expect(last?.tagName).toBe('BUTTON')
  })

  it('al pulsar un cuerpo avisa cuál se eligió', () => {
    const { nav, onSelect, onOverview } = setup()

    buttonFor(nav, 'jupiter').click()

    expect(onSelect).toHaveBeenCalledExactlyOnceWith('jupiter')
    expect(onOverview).not.toHaveBeenCalled()
  })

  it('al pulsar "Ver todo" pide la vista general', () => {
    const { nav, onSelect, onOverview } = setup()

    nav.querySelector<HTMLButtonElement>('.boton-ver-todo')?.click()

    expect(onOverview).toHaveBeenCalledOnce()
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('setActive marca solo el cuerpo enfocado y actualiza el indicador', () => {
    const { nav, status, menu } = setup()

    menu.setActive('saturno')

    const pressed = bodyButtons(nav).filter((button) => button.getAttribute('aria-pressed') === 'true')
    expect(pressed.map((button) => button.dataset.bodyId)).toEqual(['saturno'])
    expect(status.textContent).toBe('Enfocando: Saturno')
  })

  it('setActive(null) vuelve a la vista general', () => {
    const { nav, status, menu } = setup()
    menu.setActive('tierra')

    menu.setActive(null)

    const pressed = bodyButtons(nav).map((button) => button.getAttribute('aria-pressed'))
    expect(pressed.every((value) => value === 'false')).toBe(true)
    expect(status.textContent).toBe('Vista general')
  })

  it('reemplaza lo que hubiera antes dentro del menú', () => {
    const nav = document.createElement('nav')
    const previous = document.createElement('span')
    nav.append(previous)

    createBodyMenu(nav, document.createElement('p'), BODIES, {
      onSelect: () => undefined,
      onOverview: () => undefined,
    })

    expect(previous.parentElement).toBeNull()
    expect(nav.children).toHaveLength(2)
  })
})
