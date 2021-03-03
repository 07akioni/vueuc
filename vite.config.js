const path = require('path')

/**
 * @type import('vite').UserConfig
 */
module.exports = {
  root: 'src',
  define: {
    __VUE_PROD_DEVTOOLS__: false
  },
  build: {
    outDir: path.resolve(__dirname, 'site')
  }
}
