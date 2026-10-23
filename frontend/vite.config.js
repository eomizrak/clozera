import { fileURLToPath, URL } from 'node:url'

import { configDefaults, defineConfig, lazyPlugins } from 'vite-plus'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://viteplus.dev/config/
export default defineConfig({
  test: {
    environment: 'jsdom',
    exclude: [...configDefaults.exclude, 'e2e/**'],
    root: fileURLToPath(new URL('./', import.meta.url)),
  },
  lint: {
    plugins: ['eslint', 'unicorn', 'oxc', 'react', 'react-hooks', 'vitest'],
    categories: {
      correctness: 'error',
    },
    env: {
      browser: true,
      builtin: true,
    },
    ignorePatterns: [
      '**/node_modules/**',
      '**/.git/**',
      '**/dist/**',
      '**/dist-ssr/**',
      '**/coverage/**',
    ],
    rules: {
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
      'vite-plus/prefer-vite-plus-imports': 'error',
    },
    overrides: [
      {
        files: ['src/**/__tests__/*'],
        rules: {
          'vitest/expect-expect': 'error',
          'vitest/no-commented-out-tests': 'error',
          'vitest/no-conditional-expect': 'error',
          'vitest/no-disabled-tests': 'warn',
          'vitest/no-focused-tests': 'error',
          'vitest/no-identical-title': 'error',
          'vitest/no-import-node-test': 'error',
          'vitest/no-interpolation-in-snapshots': 'error',
          'vitest/no-mocks-import': 'error',
          'vitest/no-standalone-expect': 'error',
          'vitest/no-unneeded-async-expect-function': 'error',
          'vitest/prefer-called-exactly-once-with': 'error',
          'vitest/require-local-test-context-for-concurrent-snapshots': 'error',
          'vitest/valid-describe-callback': 'error',
          'vitest/valid-expect': 'error',
          'vitest/valid-expect-in-promise': 'error',
          'vitest/valid-title': 'error',
        },
      },
    ],
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
    semi: false,
    singleQuote: true,
    printWidth: 100,
    sortPackageJson: false,
    ignorePatterns: [],
  },
  plugins: lazyPlugins(() => [react(), tailwindcss()]),
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
