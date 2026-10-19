import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'

const root = path.dirname(fileURLToPath(import.meta.url))

const shared = {
  define: {
    __VUE_OPTIONS_API__: 'true',
    __VUE_PROD_DEVTOOLS__: 'false',
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false'
  },
  optimizeDeps: {
    rolldownOptions: {
      transform: {
        define: {
          __VUE_OPTIONS_API__: 'true',
          __VUE_PROD_DEVTOOLS__: 'false',
          __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false'
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(root, 'src')
    }
  }
}

export default defineConfig({
  ...shared,
  test: {
    projects: [
      {
        ...shared,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/shared/**/*.spec.ts']
        }
      },
      {
        ...shared,
        test: {
          name: 'browser',
          include: [
            'src/binder/**/*.spec.ts',
            'src/virtual-list/**/*.spec.ts',
            'src/resize-observer/**/*.spec.ts'
          ],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }]
          }
        }
      }
    ]
  }
})
