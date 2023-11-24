import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { default as fs } from 'fs-extra'
import * as vite from 'vite'

import { prerender } from './plugins/prerender.js'
import { resolveVocsConfig } from './utils/resolveVocsConfig.js'

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
  const { config } = await resolveVocsConfig()
  const { root } = config

  const outDir_resolved = resolve(relative(resolve(root, '..'), resolve(root, outDir)))

  // client
  hooks?.onClientBuildStart?.()
  const output_client = await vite.build({
    build: {
      emptyOutDir: true,
      outDir: outDir_resolved,
    },
    publicDir: resolve(root, 'public'),
    root: __dirname,
    logLevel,
  })
  hooks?.onClientBuildEnd?.(output_client)

  // prerender
  hooks?.onPrerenderBuildStart?.()
  const output_prerender = await vite.build({
    build: {
      emptyOutDir: false,
      outDir: outDir_resolved,
      ssr: resolve(__dirname, '../app/index.server.tsx'),
    },
    logLevel,
    plugins: [prerender({ logger: logLevel === 'info' ? logger : undefined, outDir })],
    publicDir: resolve(root, 'public'),
    root: __dirname,
  })
  hooks?.onPrerenderBuildEnd?.(output_prerender)

  // copy public folder
  fs.copySync(resolve(__dirname, '../app/public'), outDir_resolved)

  hooks?.onScriptsBuildStart?.()
  await vite.build({
    build: {
      lib: {
        formats: ['iife'],
        name: 'theme',
        entry: [resolve(__dirname, '../app/utils/initializeTheme.ts')],
      },
      minify: true,
      outDir: outDir_resolved,
      emptyOutDir: false,
    },
    configFile: undefined,
    logLevel,
  })
  hooks?.onScriptsBuildEnd?.()
}
