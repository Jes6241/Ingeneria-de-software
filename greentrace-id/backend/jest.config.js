'use strict';

/** Configuración de Jest para el backend (entorno Node). */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true,
  // Evita que los cron jobs o la conexión mantengan el proceso vivo.
  forceExit: true,
};
