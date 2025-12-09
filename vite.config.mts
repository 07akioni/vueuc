import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  root: 'src',
  define: {
    __VUE_PROD_DEVTOOLS__: false
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: path.resolve(__dirname, 'site')
  },
  test: {
    globals: true,
    root: __dirname,
    environment: 'jsdom',
    setupFiles: path.resolve(__dirname, 'vitest.setup.ts'),
    include: ['src/**/*.{test,spec}.{ts,js}']
  }
})
