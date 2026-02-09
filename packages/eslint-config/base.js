import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import turboPlugin from 'eslint-plugin-turbo'
import tseslint from 'typescript-eslint'
import onlyWarn from 'eslint-plugin-only-warn'
import simpleImportSort from 'eslint-plugin-simple-import-sort'

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const config = [
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      'turbo/no-undeclared-env-vars': 'warn',
    },
  },
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            // Side effect imports.
            ['^\\u0000'],
            // Node.js built-ins.
            ['^node:'],
            // External packages.
            ['^react$', '^react-dom$', '^@?\\w'],
            // Internal aliases.
            ['^@repo(/.*|$)', '^@/'],
            // Parent imports.
            ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
            // Same-folder imports.
            ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
            // Style imports.
            ['^.+\\.(css|scss|sass|less)$'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',
    },
  },
  {
    plugins: {
      onlyWarn,
    },
  },
  {
    ignores: ['dist/**', '**/.output/**', '**/coverage/**', '**/*.gen.ts'],
  },
]
