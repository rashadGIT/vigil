import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.(spec|e2e-spec)\\.ts$',
  testPathIgnorePatterns: [
    '/node_modules/',
    'tenant-isolation\\.e2e-spec\\.ts',
    '<rootDir>/test/',
  ],
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  collectCoverageFrom: [
    'src/**/*.service.ts',
    'src/**/*.guard.ts',
    '!src/**/*.module.ts',
    '!src/main.ts',
  ],
  coverageThreshold: {
    global: { branches: 70, functions: 80, lines: 80, statements: 80 },
  },
  coverageDirectory: 'coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@vigil/shared-types$': '<rootDir>/../packages/shared-types/src/index.ts',
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  roots: ['<rootDir>/src', '<rootDir>/test'],
};

export default config;
