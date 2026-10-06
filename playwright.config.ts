import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const isCI = Boolean(process.env.CI)

// WebGL por software para que la escena 3D funcione en Chromium sin GPU.
const webglArgs = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']

export default defineConfig({
  testDir: './e2e',
  // El renderizado por software es lento: deja margen sobre la espera de carga (30 s).
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'escritorio',
      use: { ...devices['Desktop Chrome'], launchOptions: { args: webglArgs } },
    },
    {
      name: 'celular',
      use: { ...devices['Pixel 7'], launchOptions: { args: webglArgs } },
    },
  ],
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    // Siempre compila de nuevo: reutilizar un servidor abierto probaría un build viejo.
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
