import { defineConfig } from 'vite-plus'

export default defineConfig({
  run: {
    tasks: {
      'server:watch': { command: 'node --watch ./bin/www', cache: false },
    },
  },
  test: {
    pool: 'forks',
    // Match Node's native CommonJS default-import semantics.
    deps: { interopDefault: false },
    fileParallelism: false,
    env: { NODE_ENV: 'test', DOTENV_CONFIG_PATH: './.env.test.local' },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.js'],
      exclude: ['src/test-utils/**', 'src/public/**'],
      reporter: ['text', 'html', 'lcov'],
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/__tests__/**/*.test.mjs'],
          exclude: ['src/__tests__/integration/**'],
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          include: ['src/__tests__/integration/**/*.test.mjs'],
        },
      },
    ],
  },
  lint: {
    plugins: ['oxc', 'typescript', 'unicorn', 'vitest'],
    categories: {
      correctness: 'error',
    },
    env: { builtin: true, es2026: true, node: true },
    ignorePatterns: ['**/node_modules/**', '**/coverage/**', '**/.git/**', '**/dist/**', '**/*.min.js'],
    rules: {
      // Preserve checks outside Oxlint's correctness category.
      'no-case-declarations': 'error',
      'no-empty': 'error',
      'no-fallthrough': 'error',
      'no-prototype-builtins': 'error',
      'no-redeclare': 'error',
      'no-regex-spaces': 'error',
      'no-undef': 'error',
      'no-unexpected-multiline': 'error',
      'no-useless-assignment': 'error',
      'preserve-caught-error': 'error',
      'no-unused-vars': 'warn',
      'prefer-template': 'warn',
      'prefer-const': 'warn',
      'vite-plus/prefer-vite-plus-imports': 'error',
    },
    options: {
      typeAware: true,
      typeCheck: true,
    },
    jsPlugins: [
      {
        name: 'vite-plus',
        specifier: 'vite-plus/oxlint-plugin',
      },
    ],
  },
  fmt: {
    singleQuote: true,
    arrowParens: 'avoid',
    printWidth: 120,
    semi: false,
    trailingComma: 'es5',
    sortPackageJson: false,
    ignorePatterns: ['*.log', 'coverage/', 'dist/', 'node_modules/', 'package-lock.json', 'public/', '.env', 'data/'],
  },
})
