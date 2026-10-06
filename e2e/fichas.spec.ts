import { expect, test, type Locator, type Page } from '@playwright/test'

/** El renderizado por software (sin GPU) tarda más en cargar las texturas. */
const LOAD_TIMEOUT_MS = 30_000
const BODY_NAMES = [
  'Sol',
  'Mercurio',
  'Venus',
  'Tierra',
  'Marte',
  'Júpiter',
  'Saturno',
  'Urano',
  'Neptuno',
]

function bodyMenu(page: Page): Locator {
  return page.getByRole('navigation', { name: 'Cuerpos celestes' })
}

function bodyButton(page: Page, name: string): Locator {
  return bodyMenu(page).getByRole('button', { name, exact: true })
}

function factSheet(page: Page): Locator {
  return page.locator('#ficha')
}

async function waitUntilLoaded(page: Page): Promise<void> {
  await expect(page.locator('body')).toHaveAttribute('data-estado', 'listo', {
    timeout: LOAD_TIMEOUT_MS,
  })
}

/**
 * Para que una captura muestre el cuerpo ya enfocado: con "reducir movimiento"
 * el viaje de cámara es instantáneo (hay que activarlo antes de cargar la página).
 */
async function enableInstantCamera(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' })
}

/** Espera dos cuadros: uno para mover la cámara y otro para dibujar la escena. */
async function waitForRenderedFrames(page: Page): Promise<void> {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      }),
  )
}

async function overlaps(first: Locator, second: Locator): Promise<boolean> {
  const [a, b] = await Promise.all([first.boundingBox(), second.boundingBox()])
  if (!a || !b) return false
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
}

async function expectSheetLeavesUiVisible(page: Page): Promise<void> {
  const sheet = factSheet(page)
  await expect(sheet).toBeVisible()
  expect(await overlaps(sheet, bodyMenu(page)), 'la ficha tapa el menú').toBe(false)
  expect(await overlaps(sheet, page.locator('.aviso-escala')), 'la ficha tapa el aviso').toBe(false)
  await expect(bodyButton(page, 'Ver todo')).toBeInViewport({ ratio: 1 })
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)
}

test.describe('Fichas informativas', () => {
  test('al elegir Júpiter se abre su ficha con sus datos y sus fuentes', async ({ page }) => {
    await page.goto('/')

    await bodyButton(page, 'Júpiter').click()

    const sheet = factSheet(page)
    await expect(sheet).toBeVisible()
    await expect(sheet.getByRole('heading', { level: 2 })).toHaveText('Júpiter')
    await expect(sheet.getByText('Gigante gaseoso')).toBeVisible()
    await expect(sheet.locator('dt', { hasText: 'Diámetro' })).toBeVisible()
    await expect(sheet.locator('a[href^="https://science.nasa.gov/"]').first()).toBeVisible()
    await expect(page.getByRole('complementary', { name: 'Júpiter' })).toBeVisible()
  })

  test('cerrar la ficha no cambia el enfoque y se puede volver a abrir', async ({ page }) => {
    await page.goto('/')
    await bodyButton(page, 'Júpiter').click()

    await factSheet(page).getByRole('button', { name: 'Cerrar ficha' }).click()

    await expect(factSheet(page)).toBeHidden()
    await expect(page.locator('#estado-enfoque')).toHaveText('Enfocando: Júpiter')
    await bodyButton(page, 'Júpiter').click()
    await expect(factSheet(page)).toBeVisible()
  })

  test('con el teclado: Escape cierra la ficha y al cerrarla el foco vuelve al menú', async ({
    page,
  }) => {
    await page.goto('/')
    const saturn = bodyButton(page, 'Saturno')
    await saturn.focus()
    await page.keyboard.press('Enter')
    await expect(factSheet(page)).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(factSheet(page)).toBeHidden()

    await page.keyboard.press('Enter')
    await factSheet(page).getByRole('button', { name: 'Cerrar ficha' }).focus()
    await page.keyboard.press('Enter')
    await expect(factSheet(page)).toBeHidden()
    await expect(saturn).toBeFocused()
  })

  test('"Ver todo" cierra la ficha y vuelve a la vista general', async ({ page }) => {
    await page.goto('/')
    await bodyButton(page, 'Marte').click()
    await expect(factSheet(page)).toBeVisible()

    await bodyButton(page, 'Ver todo').click()

    await expect(factSheet(page)).toBeHidden()
    await expect(page.locator('#estado-enfoque')).toHaveText('Vista general')
  })

  test('"Más datos" despliega las cifras técnicas', async ({ page }) => {
    await page.goto('/')
    await bodyButton(page, 'Venus').click()
    const extra = factSheet(page).locator('.ficha-datos-extra')
    await expect(extra).toBeHidden()

    await factSheet(page).getByText('Más datos').click()

    await expect(extra.locator('dt', { hasText: 'Sentido de giro' })).toBeVisible()
  })

  test('tocar el Sol en la escena abre su ficha', async ({ page }) => {
    await page.goto('/')
    await waitUntilLoaded(page)

    // En la vista general la cámara mira al Sol, que queda en el centro del canvas.
    await page.locator('#escena').click()

    await expect(factSheet(page).getByRole('heading', { level: 2 })).toHaveText('Sol')
  })

  test('los 9 cuerpos abren su ficha sin errores', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    page.on('pageerror', (error) => errors.push(error.message))
    await enableInstantCamera(page)
    await page.goto('/')
    await waitUntilLoaded(page)

    for (const name of BODY_NAMES) {
      await bodyButton(page, name).click()
      await expect(factSheet(page).getByRole('heading', { level: 2 })).toHaveText(name)
      // Evidencia para la revisión científica: cada captura muestra su cuerpo y su ficha.
      await waitForRenderedFrames(page)
      await page.screenshot({ path: test.info().outputPath(`ficha-${name}.png`) })
    }
    expect(errors).toEqual([])
  })

  test('la ficha no tapa el menú, "Ver todo" ni el aviso de escala', async ({ page }) => {
    await page.goto('/')

    await bodyButton(page, 'Júpiter').click()

    await expectSheetLeavesUiVisible(page)
  })

  test('en un celular horizontal la ficha tampoco tapa nada', async ({ page }) => {
    await page.setViewportSize({ width: 740, height: 360 })
    await enableInstantCamera(page)
    await page.goto('/')

    await bodyButton(page, 'Júpiter').click()

    await expectSheetLeavesUiVisible(page)
    await waitForRenderedFrames(page)
    await page.screenshot({ path: test.info().outputPath('ficha-horizontal.png') })
  })
})
