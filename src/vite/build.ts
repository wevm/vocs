import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { default as fs } from 'fs-extra'
import * as vite from 'vite'

import { prerender } from './plugins/prerender.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

export type BuildParameters = {
  logger?: vite.Logger
  hooks?: {
    onClientBuildStart?: () => void
    onClientBuildEnd?: (
      output: vite.Rollup.RollupOutput | vite.Rollup.RollupOutput[] | vite.Rollup.RollupWatcher,
    ) => void
    onPrerenderBuildStart?: () => void
    onPrerenderBuildEnd?: (
      output: vite.Rollup.RollupOutput | vite.Rollup.RollupOutput[] | vite.Rollup.RollupWatcher,
    ) => void
    onScriptsBuildStart?: () => void
    onScriptsBuildEnd?: () => void
  }
  logLevel?: vite.LogLevel
  outDir?: string
}

export async function build({
  logger,
  hooks,
  logLevel = 'silent',
  outDir = 'dist',
}: BuildParameters = {}) {
  // client
  hooks?.onClientBuildStart?.()
  const output_client = await vite.build({
    build: {
      emptyOutDir: true,
      outDir: resolve(outDir),
    },
    root: __dirname,
    logLevel,
  })
  hooks?.onClientBuildEnd?.(output_client)

  // prerender
  hooks?.onPrerenderBuildStart?.()
  const output_prerender = await vite.build({
    build: {
      emptyOutDir: false,
      outDir: resolve(outDir),
      ssr: resolve(__dirname, '../app/index.server.tsx'),
    },
    logLevel,
    plugins: [prerender({ logger: logLevel === 'info' ? logger : undefined, outDir })],
    root: __dirname,
  })
  hooks?.onPrerenderBuildEnd?.(output_prerender)

  // copy public folder
  fs.copySync(resolve(__dirname, '../app/public'), resolve(outDir))

  hooks?.onScriptsBuildStart?.()
  await vite.build({
    build: {
      lib: {
        formats: ['iife'],
        name: 'theme',
        entry: [resolve(__dirname, '../app/utils/initializeTheme.ts')],
      },
      minify: true,
      outDir: resolve(outDir),
      emptyOutDir: false,
    },
    configFile: undefined,
    logLevel,
  })
  hooks?.onScriptsBuildEnd?.()
}
