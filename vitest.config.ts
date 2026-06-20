import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    alias: {
      vocs: path.resolve(import.meta.dirname, 'src'),
      // Virtual modules are provided by Vite plugins at dev/build time and don't
      // exist under vitest; map the ones imported by tested components to stubs.
      'virtual:vocs/config': path.resolve(
        import.meta.dirname,
        'src/internal/test/virtual-config.stub.ts',
      ),
    },
    include: ['./src/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    globals: true,
    passWithNoTests: true,
  },
})
