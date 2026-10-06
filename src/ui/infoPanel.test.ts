// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getBody, type BodyId } from '../core/bodies'
import { buildFactSheet, type FactSheet } from '../core/factSheet'
import { FACTS } from '../core/facts'
import { createInfoPanel } from './infoPanel'

function sheetFor(id: BodyId): FactSheet {
  return buildFactSheet(getBody(id), FACTS[id])
}

function setup() {
  const aside = document.createElement('aside')
  document.body.append(aside)
  const onClose = vi.fn()
  const panel = createInfoPanel(aside, { onClose })
  return { aside, onClose, panel }
}

function pressKey(key: string): void {
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
}

function textsOf(root: ParentNode, selector: string): string[] {
  return [...root.querySelectorAll(selector)].map((element) => element.textContent ?? '')
}

afterEach(() => {
  document.body.replaceChildren()
})

describe('createInfoPanel', () => {
  it('empieza oculta', () => {
    const { aside, panel } = setup()

    expect(aside.hidden).toBe(true)
    expect(panel.isOpen()).toBe(false)
  })

  it('muestra el título en un h2 con id fijo y el tipo del cuerpo', () => {
    const { aside, panel } = setup()

    panel.show(sheetFor('jupiter'))

    expect(aside.hidden).toBe(false)
    expect(panel.isOpen()).toBe(true)
    expect(aside.querySelector('h2')?.id).toBe('ficha-titulo')
    expect(aside.querySelector('h2')?.textContent).toBe('Júpiter')
    expect(aside.querySelector('.ficha-tipo')?.textContent).toBe('Gigante gaseoso')
    expect(aside.querySelector('.ficha-resumen')?.textContent).toBe(FACTS.jupiter.summary)
  })

  it('pinta los datos clave como lista de definiciones, siempre a la vista', () => {
    const { aside, panel } = setup()
    const sheet = sheetFor('jupiter')

    panel.show(sheet)

    const keyList = aside.querySelector('.ficha-datos')
    expect(keyList?.tagName).toBe('DL')
    expect(keyList?.closest('details')).toBeNull()
    expect(textsOf(keyList as Element, 'dt')).toEqual(sheet.keyFacts.map((row) => row.label))
    expect(textsOf(keyList as Element, 'dd')).toEqual(sheet.keyFacts.map((row) => row.value))
  })

  it('"Más datos" es un desplegable cerrado con el resto de las cifras', () => {
    const { aside, panel } = setup()
    const sheet = sheetFor('jupiter')

    panel.show(sheet)

    const details = aside.querySelector('details')
    expect(details?.open).toBe(false)
    expect(details?.querySelector('summary')?.textContent).toBe('Más datos')
    expect(textsOf(details as Element, 'dt')).toEqual(sheet.moreFacts.map((row) => row.label))
  })

  it('titula los datos curiosos en singular o en plural', () => {
    const { aside, panel } = setup()

    panel.show(sheetFor('jupiter'))
    expect(aside.querySelector('.ficha-curiosidades h3')?.textContent).toBe('Datos curiosos')
    expect(textsOf(aside, '.ficha-curiosidades li')).toEqual(FACTS.jupiter.curiosities)

    panel.show(sheetFor('tierra'))
    expect(aside.querySelector('.ficha-curiosidades h3')?.textContent).toBe('Dato curioso')
  })

  it('enlaza las fuentes en una pestaña nueva, sin dar acceso a esta página', () => {
    const { aside, panel } = setup()
    const sheet = sheetFor('saturno')

    panel.show(sheet)

    const links = [...aside.querySelectorAll<HTMLAnchorElement>('.ficha-fuentes a')]
    expect(links.map((link) => link.href)).toEqual(sheet.sources.map((source) => source.url))
    expect(links.map((link) => link.textContent)).toEqual(sheet.sources.map((source) => source.label))
    for (const link of links) {
      expect(link.target).toBe('_blank')
      expect(link.rel).toBe('noopener noreferrer')
    }
    expect(aside.querySelector('.ficha-consulta')?.textContent).toBe(sheet.checkedOn)
  })

  it('al mostrar otro cuerpo reemplaza el contenido y cierra "Más datos"', () => {
    const { aside, panel } = setup()
    panel.show(sheetFor('jupiter'))
    const details = aside.querySelector('details')
    if (details) details.open = true

    panel.show(sheetFor('marte'))

    expect(aside.querySelectorAll('h2')).toHaveLength(1)
    expect(aside.querySelector('h2')?.textContent).toBe('Marte')
    expect(aside.querySelector('details')?.open).toBe(false)
  })

  it('el botón "Cerrar ficha" avisa que se quiere cerrar', () => {
    const { aside, onClose, panel } = setup()
    panel.show(sheetFor('venus'))

    const close = aside.querySelector<HTMLButtonElement>('button[aria-label="Cerrar ficha"]')
    close?.click()

    expect(close?.type).toBe('button')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('la tecla Escape avisa que se quiere cerrar solo si la ficha está abierta', () => {
    const { onClose, panel } = setup()

    pressKey('Escape')
    expect(onClose).not.toHaveBeenCalled()

    panel.show(sheetFor('venus'))
    pressKey('Enter')
    expect(onClose).not.toHaveBeenCalled()
    pressKey('Escape')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('hide la oculta', () => {
    const { aside, panel } = setup()
    panel.show(sheetFor('venus'))

    panel.hide()

    expect(aside.hidden).toBe(true)
    expect(panel.isOpen()).toBe(false)
  })

  it('muestra los textos como texto y nunca crea elementos a partir de ellos', () => {
    const { aside, panel } = setup()
    const malicious = '<img src=x onerror="alert(1)">'
    const sheet: FactSheet = {
      ...sheetFor('venus'),
      title: malicious,
      summary: malicious,
      curiosities: [malicious],
    }

    panel.show(sheet)

    expect(aside.querySelector('img')).toBeNull()
    expect(aside.querySelector('h2')?.textContent).toBe(malicious)
  })
})
