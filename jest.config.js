const nextJest = require('next/jest')

const createJestConfig = nextJest({
    // Pfad zur App, um next.config.js und .env zu laden
    dir: './',
})

const customJestConfig = {
    testEnvironment: 'jest-environment-jsdom',

    moduleNameMapper: {
        // Falls du @/ als Alias für den src-Ordner nutzt:
        '^@/(.*)$': '<rootDir>/src/$1',
    },

    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

    // Damit Jest die Tests im 'test' Ordner findet
    testMatch: ['**/test/**/*.test.(ts|tsx|js|jsx)'],


    // Schwellenwerte: Wenn diese %-Werte nicht erreicht werden, schlägt der Test/Build fehl.
    coverageThreshold: {
        global: {
            // Branches (Verzweigungen):
            // Prüft, ob alle Pfade in Kontrollstrukturen (if/else, switch, ternäre Operatoren)
            // durchlaufen wurden. Beispiel: Hast du sowohl den "if"- als auch den "else"-Fall getestet?
            branches: 10,

            // Functions (Funktionen):
            // Prüft, wie viel Prozent deiner definierten Funktionen (oder Arrow-Functions)
            // mindestens einmal aufgerufen wurden.
            functions: 10,

            // Lines (Zeilen):
            // Die Anzahl der Codezeilen in deiner Datei, die während des Tests mindestens
            // einmal ausgeführt wurden.
            lines: 10,

            // Statements (Anweisungen):
            // Ähnlich wie Zeilen, aber präziser. Eine Zeile kann mehrere Anweisungen enthalten
            // (z.B. let x=1; console.log(x);). Hier wird geprüft, ob jede einzelne Anweisung ausgeführt wurde.
            statements: 10,
        },
    },

    // UI-Komponenten und Bibliotheken von der Statistik ausschließen
    coveragePathIgnorePatterns: [
        "/node_modules/",
        "/components/ui/",
        "\\.setup\\.ts$"
    ],
}

// Exportiere die Konfiguration als ein einziges Objekt
module.exports = createJestConfig(customJestConfig)
