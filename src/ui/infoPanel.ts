import type { FactRow, FactSheet } from '../core/factSheet'
import type { FactSource } from '../core/facts'

export interface InfoPanelHandlers {
  /** El estudiante pidió cerrar la ficha (botón o tecla Escape). */
  onClose(): void
}

export interface InfoPanel {
  /** Muestra la ficha; si ya había otra, la reemplaza. */
  show(sheet: FactSheet): void
  hide(): void
  isOpen(): boolean
}

/** El `<aside>` de index.html usa este id en `aria-labelledby`. */
const TITLE_ID = 'ficha-titulo'
const CLOSE_LABEL = 'Cerrar ficha'
const MORE_FACTS_LABEL = 'Más datos'
const SOURCES_TITLE = 'Fuentes'

/** Crea un elemento con clase y texto. Usa `textContent`: el texto nunca se interpreta como HTML. */
function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const created = document.createElement(tag)
  if (className) created.className = className
  if (text !== undefined) created.textContent = text
  return created
}

function createCloseButton(onClose: () => void): HTMLButtonElement {
  const icon = element('span', undefined, '×')
  icon.setAttribute('aria-hidden', 'true')
  const close = element('button', 'ficha-cerrar')
  close.type = 'button'
  close.setAttribute('aria-label', CLOSE_LABEL)
  close.append(icon)
  close.addEventListener('click', () => onClose())
  return close
}

function createHeader(sheet: FactSheet, onClose: () => void): HTMLElement {
  const title = element('h2', undefined, sheet.title)
  title.id = TITLE_ID
  const titles = element('div', 'ficha-titulos')
  titles.append(title, element('p', 'ficha-tipo', sheet.categoryLabel))

  const header = element('header', 'ficha-encabezado')
  header.append(titles, createCloseButton(onClose))
  return header
}

function createFactList(rows: readonly FactRow[], className: string): HTMLDListElement {
  const list = element('dl', className)
  list.append(
    ...rows.map(({ label, value }) => {
      const group = element('div')
      group.append(element('dt', undefined, label), element('dd', undefined, value))
      return group
    }),
  )
  return list
}

function createCuriosities(curiosities: readonly string[]): HTMLElement {
  const list = element('ul')
  list.append(...curiosities.map((text) => element('li', undefined, text)))
  const section = element('section', 'ficha-curiosidades')
  section.append(
    element('h3', undefined, curiosities.length === 1 ? 'Dato curioso' : 'Datos curiosos'),
    list,
  )
  return section
}

function createMoreFacts(rows: readonly FactRow[]): HTMLDetailsElement {
  const details = element('details', 'ficha-mas')
  details.append(
    element('summary', undefined, MORE_FACTS_LABEL),
    createFactList(rows, 'ficha-datos-extra'),
  )
  return details
}

function createSourceLink({ label, url }: FactSource): HTMLLIElement {
  const link = element('a', undefined, label)
  link.href = url
  link.target = '_blank'
  // La página enlazada no puede controlar esta pestaña ni saber desde dónde se llegó.
  link.rel = 'noopener noreferrer'
  const item = element('li')
  item.append(link)
  return item
}

function createSources(sheet: FactSheet): HTMLElement {
  const list = element('ul')
  list.append(...sheet.sources.map(createSourceLink))
  const footer = element('footer', 'ficha-fuentes')
  footer.append(
    element('h3', undefined, SOURCES_TITLE),
    list,
    element('p', 'ficha-consulta', sheet.checkedOn),
  )
  return footer
}

/** Ficha informativa de un cuerpo, dentro del `<aside>` que recibe. */
export function createInfoPanel(aside: HTMLElement, handlers: InfoPanelHandlers): InfoPanel {
  aside.hidden = true
  const isOpen = (): boolean => !aside.hidden

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) handlers.onClose()
  })

  return {
    show(sheet) {
      aside.replaceChildren(
        createHeader(sheet, handlers.onClose),
        element('p', 'ficha-resumen', sheet.summary),
        createFactList(sheet.keyFacts, 'ficha-datos'),
        createCuriosities(sheet.curiosities),
        createMoreFacts(sheet.moreFacts),
        createSources(sheet),
      )
      aside.dataset.bodyId = sheet.bodyId
      aside.hidden = false
      aside.scrollTop = 0
    },
    hide() {
      aside.hidden = true
    },
    isOpen,
  }
}
