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
    'src/modules/cases/cases.service.ts',
    'src/modules/intake/intake.service.ts',
    'src/modules/follow-ups/follow-ups.service.ts',
    'src/modules/n8n/n8n.service.ts',
    'src/modules/tasks/task-templates.service.ts',
    'src/common/guards/cognito-auth.guard.ts',
    'src/common/guards/internal-only.guard.ts',
    'src/common/prisma/prisma.service.ts',
  ],
  coverageThreshold: {
    global: { branches: 55, functions: 80, lines: 80, statements: 80 },
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
