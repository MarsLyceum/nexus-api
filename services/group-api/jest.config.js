/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
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
