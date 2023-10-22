import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { preview as vitePreview } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))

type PreviewParameters = {
  outDir?: string
}

export async function preview({ outDir = 'dist' }: PreviewParameters = {}) {
  return vitePreview({
    root: __dirname,
    build: {
      outDir: resolve(process.cwd(), outDir),
    },
  })
}
