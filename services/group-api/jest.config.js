/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    coverageThreshold: {
        global: {
            branches: 90,
            functions: 90,
            lines: 90,
            statements: 90,
        },
    },
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                tsconfig: 'tsconfig.test.json',
                diagnostics: {
                    // ignore TS7006 (implicit any) and friends
                    ignoreCodes: [7006],
                },
            },
        ],
    },
    moduleNameMapper: {
        '^third-party-clients$': '<rootDir>/__mocks__/third-party-clients.ts',
    },
};
