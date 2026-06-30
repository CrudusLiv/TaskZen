module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
    ],
    jasmineHtmlReporter: {
      suppressAll: true,
    },
    reporters: ['progress', 'kjhtml'],
    browsers: ['Chrome'],
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/TaskZen'),
      subdir: '.',
      reporters: [{ type: 'lcov' }, { type: 'text-summary' }],
      check: {
        global: {
          statements: 60,
          branches: 60,
          functions: 60,
          lines: 60,
        },
      },
    },
  });
};
