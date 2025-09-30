const path = require('path');

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    displayName: 'group-api',

    // run from inside this folder
    rootDir: '.',

    // your normal ts-jest setup
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['<rootDir>/tests/**/*.test.ts'],

    moduleNameMapper: {
        '^third-party-clients$': '<rootDir>/../../mocks/third-party-clients.ts',
    },

    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                tsconfig: path.resolve(__dirname, '../../tsconfig.test.json'),
                diagnostics: { ignoreCodes: [7006] },
            },
        ],
    },

    collectCoverage: true,
    collectCoverageFrom: ['<rootDir>/src/**/*.ts'],
    coverageDirectory: '<rootDir>/coverage',

    coverageThreshold: {
        global: {
            branches: 77,
            functions: 50,
            lines: 70,
            statements: 71,
        },
    },
};
