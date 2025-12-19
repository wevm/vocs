import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    alias: {
      vocs: path.resolve(import.meta.dirname, 'src'),
    },
    globals: true,
    passWithNoTests: true,
  },
})
