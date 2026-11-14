/**
 * Configures repository formatting, lint, and integration tests.
 * @module
 */
import * as Path from 'node:path'
import { defineConfig } from 'vite-plus'

export default defineConfig({
  fmt: {
    ignorePatterns: ['dist/**', 'node_modules/**', 'pnpm-lock.yaml'],
    printWidth: 100,
    semi: false,
    singleQuote: true,
    sortPackageJson: false,
  },
  lint: {
    categories: { correctness: 'error' },
    ignorePatterns: ['dist/**', 'node_modules/**'],
    jsPlugins: [{ name: 'zyzz', specifier: 'zyzz/oxlint' }],
    // Formatting and linting stay syntax-only. `pnpm check:types` checks types.
    options: { typeAware: false, typeCheck: false },
    rules: {
      'no-unused-vars': 'error',
      'zyzz/no-conflicting-props': 'error',
      'zyzz/no-unused': 'error',
      'zyzz/restricted-properties': [
        'error',
        {
          backgroundColor: { reason: 'Use a color token.', values: ['transparent'] },
          borderColor: { reason: 'Use a color token.', values: ['transparent'] },
          borderRadius: { reason: 'Use a radius token.', values: [0] },
          color: { reason: 'Use a color token.', values: ['inherit'] },
          fontFamily: { reason: 'Use a font token.', values: ['inherit'] },
        },
      ],
      'zyzz/use-logical-properties': 'error',
      'zyzz/valid-styles': 'error',
    },
  },
  test: {
    alias: {
      vocs: Path.resolve(import.meta.dirname, 'src'),
    },
    globals: true,
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
    // Integration suites land with the first state machine. Until then the run is empty.
    passWithNoTests: true,
    testTimeout: 30_000,
  },
})
