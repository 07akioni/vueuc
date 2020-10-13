process.env.CHROME_BIN = require('puppeteer').executablePath()

module.exports = function (config) {
  config.set({
    singleRun: true,
    browsers: ['ChromeHeadless'],
    frameworks: ['jasmine', 'karma-typescript'],
    basePath: './',
    files: [
      'src/**/*.ts'
    ],
    exclude: [
      'src/**/demo/**/*',
      'src/test-shared'
    ],
    preprocessors: {
      'src/**/*.ts': 'karma-typescript'
    },
    reporters: ['spec', 'karma-typescript'],
    karmaTypescriptConfig: {
      tsconfig: './tsconfig.json',
      reports: {
        text: null,
        html: {
          directory: 'coverage',
          subdirectory: 'html'
        },
        lcovonly: {
          directory: 'coverage',
          subdirectory: 'lcov'
        }
      }
    }
  })
}
