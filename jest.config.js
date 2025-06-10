module.exports = {
  preset: 'ts-jest', // Keep for existing TS tests
  testEnvironment: 'node',
  testMatch: [
    '**/test/**/*.spec.ts', // Existing pattern for TS tests
    '<rootDir>/lib/test/**/*.spec.js' // New pattern for JS tests
  ],
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts', // Coverage still from TS source
    '!<rootDir>/src/types/**/*.ts',
  ],
  globals: {
    'ts-jest': {
      diagnostics: false,
      isolatedModules: true,
    },
  },
};
