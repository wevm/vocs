import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { vocs } from 'vocs/vite'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), vocs()],
  server: {
    watch: {
      // The docs site imports the workspace package from ../dist. A package build
      // touches hundreds of files there and can overwhelm Vite's dev watcher.
      ignored: [`${resolve(rootDir, 'dist')}/**`],
    },
  },
})
