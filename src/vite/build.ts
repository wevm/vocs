import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { default as fs } from 'fs-extra'
import * as vite from 'vite'

import { postbuild } from './plugins/postbuild.js'
import { prerender } from './plugins/prerender.js'
import { resolveVocsConfig } from './utils/resolveVocsConfig.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

type BuildEndParameters =
  | {
      output: vite.Rollup.RollupOutput | vite.Rollup.RollupOutput[] | vite.Rollup.RollupWatcher
      error?: never
    }
  | {
      output?: never
      error: Error
    }

export type BuildParameters = {
  logger?: vite.Logger
  hooks?: {
    onClientBuildStart?: () => void
    onClientBuildEnd?: ({ output, error }: BuildEndParameters) => void
    onPrerenderBuildStart?: () => void
    onPrerenderBuildEnd?: ({ output, error }: BuildEndParameters) => void
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
  const { rootDir } = config

  const outDir_resolved = resolve(relative(resolve(rootDir, '..'), resolve(rootDir, outDir)))

  // client
  hooks?.onClientBuildStart?.()
  try {
    const output_client = await vite.build({
      build: {
        emptyOutDir: true,
        outDir: outDir_resolved,
      },
      publicDir: resolve(rootDir, 'public'),
      root: __dirname,
      logLevel,
      plugins: [postbuild({ logger })],
    })
    hooks?.onClientBuildEnd?.({ output: output_client })
  } catch (e) {
    const error = e as Error
    hooks?.onClientBuildEnd?.({ error })
    if (error.message === 'deadlinks found.') return
    throw error
  }

  // prerender
  hooks?.onPrerenderBuildStart?.()
  try {
    const output_prerender = await vite.build({
      build: {
        emptyOutDir: false,
        outDir: resolve(__dirname, '.vocs/dist'),
        ssr: resolve(__dirname, '../app/index.server.tsx'),
      },
      logLevel,
      plugins: [prerender({ logger: logLevel === 'info' ? logger : undefined, outDir })],
      publicDir: resolve(rootDir, 'public'),
      root: __dirname,
    })
    hooks?.onPrerenderBuildEnd?.({ output: output_prerender })
  } catch (e) {
    const error = e as Error
    hooks?.onPrerenderBuildEnd?.({ error })
    throw error
  }

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
