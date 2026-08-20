// Configuración de Karma.

module.exports = function (config) {
  config.set({
    basePath: '',
    // El builder de Angular añade su propio framework y plugin: aquí solo
    // se declara lo que no aporta él.
    frameworks: ['jasmine'],
    client: {
      jasmine: {
        // Orden aleatorio: si dos pruebas se estorban entre sí, se nota
        // aquí y no meses después.
        random: true,
      },
      clearContext: false,
    },
    jasmineHtmlReporter: {
      suppressAll: true,
    },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/incident-management'),
      subdir: '.',
      reporters: [
        { type: 'html' }, // navegable, para investigar un archivo concreto
        { type: 'text-summary' }, // resumen en la terminal
        { type: 'json-summary' }, // legible por herramientas
        { type: 'lcovonly' }, // formato estándar para CI
      ],
      check: {
        global: {
          statements: 50,
          branches: 50,
          functions: 50,
          lines: 50,
        },
      },
    },
    reporters: ['progress', 'kjhtml'],
    browsers: ['Chrome'],
    restartOnFileChange: true,
  });
};