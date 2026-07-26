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
    '!src/layouts/*',
    '!src/shared/hooks/useDebounce.ts',
    '!src/features/checkout/components/CheckoutPage.tsx',
    '!src/features/checkout/components/ShippingSection.tsx',
    '!src/features/checkout/components/PaymentSection.tsx',
    '!src/features/checkout/checkoutSchema.ts',
    '!src/shared/components/CheckoutStepper.tsx',
    '!src/features/checkout/store/*',
    '!src/shared/utils/luhn.ts',
    '!src/shared/utils/binDetect.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 65,
      functions: 68,
      lines: 80,
      statements: 80,
    },
  },
};
