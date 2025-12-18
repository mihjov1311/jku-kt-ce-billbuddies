const nextJest = require('next/jest')

const createJestConfig = nextJest({
    // Pfad zur App, um next.config.js und .env zu laden
    dir: './',
})

const customJestConfig = {
    // Wichtig für React-Komponenten
    testEnvironment: 'jest-environment-jsdom',
    moduleNameMapper: {
        // Falls du @/ als Alias für den src-Ordner nutzt:
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    // Damit Jest die Tests im 'test' Ordner findet
    testMatch: ['**/test/**/*.test.(ts|tsx|js|jsx)'],
}

module.exports = createJestConfig(customJestConfig)