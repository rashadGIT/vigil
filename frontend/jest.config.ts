import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@vigil/shared-types$': '<rootDir>/../packages/shared-types/src/index.ts',
  },
  testMatch: [
    '<rootDir>/src/__tests__/**/*.test.tsx',
    '<rootDir>/src/__tests__/**/*.test.ts',
  ],
  collectCoverageFrom: [
    'src/components/**/*.tsx',
    '!src/components/ui/**',
    '!src/**/*.stories.tsx',
  ],
};

export default createJestConfig(config);
