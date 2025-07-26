const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    // Handle module aliases (this will be automatically configured for you based on your tsconfig.json paths)
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  
  // Test patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/__tests__/**/*.{js,jsx,ts,tsx}'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}',
  ],
  
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    // Specific thresholds for critical modules
    './src/lib/session-manager.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/lib/profile-sync.ts': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    './src/lib/error-recovery.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/lib/cache-manager.ts': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    './src/lib/query-optimizer.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/lib/connection-pool.ts': {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
  
  // Test timeout for stress tests
  testTimeout: 30000,
  
  // Projects for different types of tests
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/src/**/__tests__/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'jest-environment-jsdom',
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/src/**/__tests__/**/*.integration.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'jest-environment-jsdom',
      testTimeout: 15000,
    },
    {
      displayName: 'stress',
      testMatch: ['<rootDir>/src/__tests__/stress/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'jest-environment-node',
      testTimeout: 60000, // 1 minute for stress tests
    },
  ],
  
  // Global setup and teardown
  globalSetup: '<rootDir>/jest.global-setup.js',
  globalTeardown: '<rootDir>/jest.global-teardown.js',
  
  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/src/__tests__/e2e/', // E2E tests run separately with Playwright
  ],
  
  // Mock configuration
  clearMocks: true,
  restoreMocks: true,
  
  // Verbose output for debugging
  verbose: true,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Performance monitoring
  detectOpenHandles: true,
  detectLeaks: true,
  
  // Custom reporters (comentado até instalar as dependências)
  // reporters: [
  //   'default',
  //   [
  //     'jest-junit',
  //     {
  //       outputDirectory: './test-results',
  //       outputName: 'junit.xml',
  //     },
  //   ],
  //   [
  //     'jest-html-reporters',
  //     {
  //       publicPath: './test-results',
  //       filename: 'report.html',
  //       expand: true,
  //     },
  //   ],
  // ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)