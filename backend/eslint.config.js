const js = require('@eslint/js')
const globals = require('globals')

const isProd = process.env.NODE_ENV === 'production'

module.exports = [
  {
    ignores: ['**/node_modules/**', '**/coverage/**', '**/.git/**', '**/dist/**', '**/*.min.js'],
    linterOptions: {
      reportUnusedDisableDirectives: 'warn',
    },
  },
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-console': isProd ? 'error' : 'off',
      'no-debugger': isProd ? 'error' : 'off',
      'no-unused-vars': 'warn',
      'prefer-template': 'warn',
      'prefer-const': 'warn',
    },
  },
  {
    files: ['**/*.test.js', '**/*.spec.js', '**/__tests__/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
]
