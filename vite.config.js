const path = require('path')

/**
 * @type import('vite').UserConfig
 */
module.exports = {
  root: 'src',
  build: {
    outDir: path.resolve(__dirname, 'site')
  }
}
