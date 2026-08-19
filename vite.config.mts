import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  root: 'src',
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false,
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false
  },
  build: {
    outDir: path.resolve(import.meta.dirname, 'site')
  }
})
