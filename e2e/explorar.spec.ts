import { expect, test, type Page } from '@playwright/test'

const BODY_COUNT = 9
/** El renderizado por software (sin GPU) tarda más en cargar las texturas. */
const LOAD_TIMEOUT_MS = 30_000

function bodyMenu(page: Page) {
  return page.getByRole('navigation', { name: 'Cuerpos celestes' })
}

async function waitUntilLoaded(page: Page): Promise<void> {
  await expect(page.locator('body')).toHaveAttribute('data-estado', 'listo', {
    timeout: LOAD_TIMEOUT_MS,
  })
}

function collectErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}

test.describe('Explorar el sistema solar', () => {
  test('carga la escena 3D sin errores, con los 9 cuerpos y el aviso de escala', async ({
    page,
  }) => {
    const errors = collectErrors(page)

    await page.goto('/')

    await waitUntilLoaded(page)
    await expect(page.locator('#escena')).toBeVisible()
    await expect(bodyMenu(page).locator('.boton-cuerpo')).toHaveCount(BODY_COUNT)
    await expect(page.getByText('Escala didáctica')).toBeVisible()
    await expect(page.locator('#estado-enfoque')).toHaveText('Vista general')
    await page.screenshot({ path: test.info().outputPath('vista-general.png') })
    expect(errors).toEqual([])
  })

  test('enfoca Júpiter desde el menú y vuelve a la vista general', async ({ page }) => {
    await page.goto('/')
    const status = page.locator('#estado-enfoque')
    const jupiter = bodyMenu(page).getByRole('button', { name: 'Júpiter' })

    await jupiter.click()
    await expect(status).toHaveText('Enfocando: Júpiter')
    await expect(jupiter).toHaveAttribute('aria-pressed', 'true')

    await bodyMenu(page).getByRole('button', { name: 'Ver todo' }).click()
    await expect(status).toHaveText('Vista general')
    await expect(jupiter).toHaveAttribute('aria-pressed', 'false')
  })

  test('el menú funciona solo con el teclado', async ({ page }) => {
    await page.goto('/')
    const saturn = bodyMenu(page).getByRole('button', { name: 'Saturno' })

    await saturn.focus()
    await expect(saturn).toBeFocused()
    await page.keyboard.press('Enter')

    await expect(page.locator('#estado-enfoque')).toHaveText('Enfocando: Saturno')
  })

  test('tocar el Sol en la escena lo enfoca', async ({ page }) => {
    await page.goto('/')
    await waitUntilLoaded(page)

    // En la vista general la cámara mira al Sol, que queda en el centro del canvas.
    await page.locator('#escena').click()

    await expect(page.locator('#estado-enfoque')).toHaveText('Enfocando: Sol')
  })

  test('la página no se desplaza a lo ancho y "Ver todo" siempre está a la vista', async ({
    page,
  }) => {
    await page.goto('/')

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
    await expect(bodyMenu(page).getByRole('button', { name: 'Ver todo' })).toBeInViewport({
      ratio: 1,
    })
  })

  test('en un celular horizontal el menú sigue siendo usable', async ({ page }) => {
    await page.setViewportSize({ width: 740, height: 360 })
    await page.goto('/')

    await expect(bodyMenu(page).getByRole('button', { name: 'Ver todo' })).toBeInViewport({
      ratio: 1,
    })
    await bodyMenu(page).getByRole('button', { name: 'Sol' }).click()
    await expect(page.locator('#estado-enfoque')).toHaveText('Enfocando: Sol')
  })

  test('si una textura no carga, el planeta se muestra con su color y la página sigue', async ({
    page,
  }) => {
    const pageErrors: string[] = []
    const warnings: string[] = []
    page.on('pageerror', (error) => pageErrors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'warning') warnings.push(message.text())
    })
    await page.route('**/textures/2k_mars.jpg', (route) => route.abort())

    await page.goto('/')
    await waitUntilLoaded(page)

    expect(pageErrors).toEqual([])
    expect(warnings.some((text) => text.includes('Marte'))).toBe(true)
    await bodyMenu(page).getByRole('button', { name: 'Marte' }).click()
    await expect(page.locator('#estado-enfoque')).toHaveText('Enfocando: Marte')
  })

  test('muestra un mensaje claro si el navegador no soporta WebGL', async ({ page }) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext
      Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
        value(this: HTMLCanvasElement, contextId: string, options?: unknown) {
          if (contextId.startsWith('webgl')) return null
          return Reflect.apply(original, this, [contextId, options])
        },
      })
    })

    await page.goto('/')

    await expect(
      page.getByRole('heading', { name: 'Tu navegador no puede mostrar 3D' }),
    ).toBeVisible()
    await expect(page.locator('#escena')).toBeHidden()
    await expect(bodyMenu(page)).toBeHidden()
  })
})
