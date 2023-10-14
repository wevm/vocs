import { resolve } from 'path'
import * as vite from 'vite'

type BuildParameters = {
  outDir?: string
}

export async function build(args: BuildParameters = {}) {
  const { outDir = 'dist' } = args

  // client
  await vite.build({
    build: {
      emptyOutDir: true,
      outDir: resolve(outDir, 'client'),
    },
    root: __dirname,
  })

  // server
  await vite.build({
    build: {
      emptyOutDir: true,
      outDir: resolve(outDir, 'server'),
      ssr: resolve(__dirname, 'app/index.server.tsx'),
    },
    root: __dirname,
  })
}
