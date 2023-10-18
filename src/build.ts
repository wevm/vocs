import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as vite from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))

type BuildParameters = {
  outDir?: string
  ssr?: boolean
}

export async function build({ outDir = 'dist', ssr = false }: BuildParameters = {}) {
  // client
  await vite.build({
    build: {
      emptyOutDir: true,
      outDir: resolve(outDir, ssr ? 'client' : ''),
      target: 'esnext',
    },
    root: __dirname,
  })

  // server
  await vite.build({
    build: {
      emptyOutDir: ssr,
      outDir: resolve(outDir, ssr ? 'server' : ''),
      ssr: resolve(__dirname, 'app/index.server.tsx'),
      target: 'esnext',
    },
    root: __dirname,
  })
}
