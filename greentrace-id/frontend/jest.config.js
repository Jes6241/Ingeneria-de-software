/** Configuración de Jest para el frontend (entorno jsdom). */
export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  testMatch: ['**/__tests__/**/*.test.{js,jsx}', '**/*.test.{js,jsx}'],
  moduleNameMapper: {
    // Ignora imports de CSS en las pruebas.
    '\\.(css|less|scss)$': '<rootDir>/jest.styleMock.js',
  },
};
