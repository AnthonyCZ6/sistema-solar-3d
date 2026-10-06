import { defineConfig } from 'vitest/config'

export default defineConfig({
  // En GitHub Pages la web vive en /<repo>/: el workflow lo indica con BASE_PATH.
  // En local y en las pruebas sigue en la raíz.
  base: process.env.BASE_PATH ?? '/',
  build: {
    // Three.js ocupa ~550 kB minificado (~140 kB gzip); el aviso por defecto (500 kB) no aplica.
    chunkSizeWarningLimit: 700,
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      // El resto de src/scene necesita WebGL real: lo cubren las pruebas E2E.
      include: ['src/core/**/*.ts', 'src/ui/**/*.ts', 'src/scene/cameraFocus.ts'],
      exclude: ['src/**/*.test.ts'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
})
