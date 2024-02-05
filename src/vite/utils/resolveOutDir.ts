import { resolve } from 'node:path'
import { vercelBuildOutputDir } from './vercel.js'

export function resolveOutDir(rootDir: string, outDir?: string) {
  if (typeof outDir === 'undefined') {
    // If we're in a Vercel environment, use the Vercel Build Output directory.
    // https://vercel.com/docs/build-output-api/v3
    if (process.env.VERCEL) return resolve(vercelBuildOutputDir, 'static')
  }
  return resolve(rootDir, outDir ?? 'dist')
}
