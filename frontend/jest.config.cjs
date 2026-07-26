/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        verbatimModuleSyntax: false,
        module: 'esnext',
        moduleResolution: 'bundler',
        target: 'es2023',
      },
    }],
  },
  moduleNameMapper: {
    '\\.(css|less|scss)$': 'identity-obj-proxy',
  },
  setupFiles: ['./src/jest.setup.js'],
  testRegex: '.*\\.test\\.(ts|tsx)$',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/main.tsx',
    '!src/**/*.d.ts',
    '!src/setupTests.ts',
    '!src/app/router.tsx',
    '!src/app/store.ts',
    '!src/shared/api/client.ts',
    '!src/**/api/*',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
