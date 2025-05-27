module.exports = {
    plugins: [
        '@typescript-eslint',
        'eslint-comments',
        'jest',
        'promise',
        'unicorn',
    ],
    extends: [
        'eslint:recommended',
        'airbnb-base',
        'airbnb-typescript/base',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'plugin:eslint-comments/recommended',
        'plugin:jest/recommended',
        'plugin:promise/recommended',
        'plugin:unicorn/recommended',
        'prettier',
    ],
    ignorePatterns: ['dist/', 'migrations/', 'coverage/', 'jest.config.js'],
    env: {
        node: true,
        browser: true,
        jest: true,
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: './tsconfig.json',
    },
    rules: {
        'no-await-in-loop': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-redundant-type-constituents': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        'no-void': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        'unicorn/no-null': 'off',
        'unicorn/no-array-method-this-argument': 'off',
        'max-lines': [
            'warn',
            { max: 500, skipBlankLines: true, skipComments: true },
        ],
        'no-restricted-syntax': [
            'error',
            {
                selector: 'ForInStatement',
                message: 'for...in loops are not allowed.',
            },
        ],
        'unicorn/prefer-top-level-await': 'off',
        'import/extensions': 'off',
        'unicorn/filename-case': 'off',
        '@typescript-eslint/no-misused-promises': 'warn',
        'unicorn/no-negated-condition': 'off',
        // Too restrictive, writing ugly code to defend against a very unlikely scenario: https://eslint.org/docs/rules/no-prototype-builtins
        'no-prototype-builtins': 'off',
        // https://basarat.gitbooks.io/typescript/docs/tips/defaultIsBad.html
        'import/prefer-default-export': 'off',
        'import/no-default-export': 'error',
        // Use function hoisting to improve code readability
        'no-use-before-define': [
            'error',
            { functions: false, classes: true, variables: true },
        ],
        // Allow most functions to rely on type inference. If the function is exported, then `@typescript-eslint/explicit-module-boundary-types` will ensure it's typed.
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-use-before-define': [
            'error',
            {
                functions: false,
                classes: true,
                variables: true,
                typedefs: true,
            },
        ],
        // Common abbreviations are known and readable
        'unicorn/prevent-abbreviations': 'off',
        // Airbnb prefers forEach
        'unicorn/no-array-for-each': 'off',
        // It's not accurate in the monorepo style
        'import/no-extraneous-dependencies': 'off',
    },
    overrides: [
        {
            files: ['*.js'],
            rules: {
                // Allow CJS until ESM support improves
                '@typescript-eslint/no-var-requires': 'off',
                'unicorn/prefer-module': 'off',
            },
        },
        {
            files: ['**/*.test.ts', '**/tests/**/*.ts', '**/mocks/**/*.ts'],
            parserOptions: {
                project: './tsconfig.test.json',
            },
        },
    ],
};
