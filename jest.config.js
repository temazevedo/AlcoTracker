/**
 * Jest configuration for AlcoTracker.
 * Pure TypeScript tests - no Expo/React Native runtime needed.
 */

module.exports = {
  preset: 'ts-jest',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { esModuleInterop: true, jsx: 'react-native' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: [
    '**/*.test.(ts|tsx)',
  ],
  collectCoverageFrom: [
    'src/bac/**/*.ts',
    '!**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  testEnvironment: 'node',
};