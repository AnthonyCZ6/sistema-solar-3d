import type { BodyId, CelestialBody } from '../core/bodies'

export interface BodyMenuHandlers {
  onSelect(id: BodyId): void
  onOverview(): void
}

export interface BodyMenu {
  /** Marca el cuerpo enfocado (null = vista general) y actualiza el indicador. */
  setActive(id: BodyId | null): void
}

const OVERVIEW_STATUS = 'Vista general'
const OVERVIEW_BUTTON_LABEL = 'Ver todo'

function createBodyButton(body: CelestialBody): HTMLButtonElement {
  const swatch = document.createElement('span')
  swatch.className = 'muestra'
  swatch.style.backgroundColor = body.fallbackColor
  swatch.setAttribute('aria-hidden', 'true')

  const label = document.createElement('span')
  label.textContent = body.name

  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'boton-cuerpo'
  button.dataset.bodyId = body.id
  button.setAttribute('aria-pressed', 'false')
  button.append(swatch, label)
  return button
}

function createOverviewButton(onOverview: () => void): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'boton-ver-todo'
  button.textContent = OVERVIEW_BUTTON_LABEL
  button.addEventListener('click', () => onOverview())
  return button
}

export function createBodyMenu(
  nav: HTMLElement,
  status: HTMLElement,
  bodies: readonly CelestialBody[],
  handlers: BodyMenuHandlers,
): BodyMenu {
  const entries = bodies.map((body) => {
    const button = createBodyButton(body)
    button.addEventListener('click', () => handlers.onSelect(body.id))
    return { body, button }
  })

  const list = document.createElement('ul')
  list.className = 'menu-lista'
  list.append(
    ...entries.map(({ button }) => {
      const item = document.createElement('li')
      item.append(button)
      return item
    }),
  )
  nav.replaceChildren(list, createOverviewButton(handlers.onOverview))

  return {
    setActive(id) {
      for (const { body, button } of entries) {
        button.setAttribute('aria-pressed', String(body.id === id))
      }
      const active = entries.find(({ body }) => body.id === id)
      status.textContent = active ? `Enfocando: ${active.body.name}` : OVERVIEW_STATUS
    },
  }
}
