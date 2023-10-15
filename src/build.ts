import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as vite from 'vite'

const dir = resolve(fileURLToPath(import.meta.url), '..')

export async function build() {
  const outDir = 'dist'

  // client
  await vite.build({
    build: {
      emptyOutDir: true,
      outDir: resolve(outDir, 'client'),
      target: 'esnext',
    },
    root: dir,
  })

  // server
  await vite.build({
    build: {
      emptyOutDir: true,
      outDir: resolve(outDir, 'server'),
      ssr: resolve(dir, 'app/index.server.tsx'),
      target: 'esnext',
    },
    root: dir,
  })
}
