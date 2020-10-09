const path = require('path')

module.exports = {
  root: 'src',
  outDir: path.resolve(__dirname, 'site'),
  optmizeDeps: {
    include: ['vue-router']
  }
}
