import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as vite from 'vite'

import { prerender } from './plugins/prerender.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

type BuildParameters = {
  outDir?: string
}

export async function build({ outDir = 'dist' }: BuildParameters = {}) {
  // client
  await vite.build({
    build: {
      emptyOutDir: true,
      outDir: resolve(outDir),
    },
    root: __dirname,
  })

  // server
  await vite.build({
    build: {
      emptyOutDir: false,
      outDir: resolve(outDir),
      ssr: resolve(__dirname, '../app/index.server.tsx'),
    },
    plugins: [prerender({ outDir })],
    root: __dirname,
  })

  // initialize theme script
  await vite.build({
    build: {
      lib: {
        formats: ['iife'],
        name: 'theme',
        entry: [resolve(__dirname, '../app/utils/initialize-theme.ts')],
      },
      minify: true,
      outDir: resolve(outDir),
      emptyOutDir: false,
    },
    configFile: undefined,
  })
}
