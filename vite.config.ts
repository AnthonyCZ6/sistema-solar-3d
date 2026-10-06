import { defineConfig } from 'vitest/config'

export default defineConfig({
  build: {
    // Three.js ocupa ~550 kB minificado (~140 kB gzip); el aviso por defecto (500 kB) no aplica.
    chunkSizeWarningLimit: 700,
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/core/**/*.ts'],
      exclude: ['src/core/**/*.test.ts'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
})
