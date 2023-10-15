import { resolve } from 'path'
import * as vite from 'vite'

export async function build() {
  const outDir = 'dist'

  // client
  await vite.build({
    build: {
      emptyOutDir: true,
      outDir: resolve(outDir, 'client'),
      target: 'esnext',
    },
    root: __dirname,
  })

  // server
  await vite.build({
    build: {
      emptyOutDir: true,
      outDir: resolve(outDir, 'server'),
      ssr: resolve(__dirname, 'app/index.server.tsx'),
      target: 'esnext',
    },
    root: __dirname,
  })
}
