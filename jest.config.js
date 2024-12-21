module.exports = {
    testEnvironment: 'node',
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/**/*.test.js',
        '!src/config/**',
        '!src/migrations/**',
        '!src/seeds/**',
        '!src/docs/**'
    ],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
        }
    },
    testMatch: [
        '**/src/**/__tests__/**/*.test.js'
    ],
    setupFiles: [
        '<rootDir>/.jest/setEnvVars.js'
    ],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'
    },
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true
};
