import { glob } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { cwd } from 'node:process'
import { default as fs } from 'fs-extra'
import * as vite from 'vite'

import { postbuild } from './plugins/postbuild.js'
import { prerender } from './prerender.js'
import * as cache from './utils/cache.js'
import { processMarkdownForAgent } from './utils/processMarkdownForAgent.js'
import { resolveOutDir } from './utils/resolveOutDir.js'
import { resolveVocsConfig } from './utils/resolveVocsConfig.js'
import { vercelBuildOutputDir, writeBuildOutputConfig } from './utils/vercel.js'

export type BuildParameters = {
  agentMarkdown?: boolean
  clean?: boolean
  logger?: vite.Logger
  hooks?: {
    onBundleStart?: () => void
    onBundleEnd?: ({ error }: { error?: Error }) => void
    onPrerenderStart?: () => void
    onPrerenderEnd?: ({ error }: { error?: Error }) => void
    onScriptsStart?: () => void
    onScriptsEnd?: ({ error }: { error?: Error }) => void
  }
  logLevel?: vite.LogLevel
  outDir?: string
  publicDir?: string
  searchIndex?: boolean
}

export async function build({
  agentMarkdown = false,
  clean,
  logger,
  hooks,
  logLevel = 'silent',
  outDir,
  publicDir = 'public',
  searchIndex = true,
}: BuildParameters = {}) {
  const { config } = await resolveVocsConfig()
  const { rootDir, cacheDir } = config

  const outDir_resolved = resolveOutDir(rootDir, outDir)
  const publicDir_resolved = resolve(rootDir, publicDir)
  const envDir_resolved = cwd()

  if (clean) cache.clear({ cacheDir })

  cache.search({ cacheDir }).set('buildSearchIndex', searchIndex)
  cache.search({ cacheDir }).set('agentMarkdown', agentMarkdown)

  fs.rmSync(outDir_resolved, { recursive: true, force: true })

  hooks?.onBundleStart?.()
  try {
    await vite.build({
      build: {
        emptyOutDir: false,
        outDir: outDir_resolved,
      },
      envDir: envDir_resolved,
      publicDir: publicDir_resolved,
      root: import.meta.dirname,
      logLevel,
      plugins: [postbuild({ logger })],
    })
    await vite.build({
      build: {
        emptyOutDir: false,
        outDir: resolve(import.meta.dirname, '.vocs/dist'),
        ssr: resolve(import.meta.dirname, '../app/index.server.tsx'),
      },
      envDir: envDir_resolved,
      logLevel,
      publicDir: publicDir_resolved,
      root: import.meta.dirname,
    })
    hooks?.onBundleEnd?.({})
  } catch (e) {
    const error = e as Error
    hooks?.onBundleEnd?.({ error })
    if (error.message === 'deadlinks found.') return
    throw error
  }

  hooks?.onPrerenderStart?.()
  try {
    await prerender({ logger: logLevel === 'info' ? logger : undefined, outDir })
    hooks?.onPrerenderEnd?.({})
  } catch (error) {
    hooks?.onPrerenderEnd?.({ error: error as Error })
  }

  // Generate .md files for AI agents (only if --agentMarkdown flag is set)
  if (agentMarkdown) {
    await generateMarkdownFiles({ rootDir, outDir: outDir_resolved })
  }

  // copy public folder
  fs.copySync(resolve(import.meta.dirname, '../app/public'), outDir_resolved)

  hooks?.onScriptsStart?.()

  try {
    await vite.build({
      build: {
        lib: {
          formats: ['iife'],
          name: 'theme',
          entry: [resolve(import.meta.dirname, '../app/utils/initializeTheme.ts')],
        },
        minify: true,
        outDir: outDir_resolved,
        emptyOutDir: false,
      },
      configFile: undefined,
      logLevel,
    })

    hooks?.onScriptsEnd?.({})
  } catch (error) {
    hooks?.onScriptsEnd?.({ error: error as Error })
  }

  if (outDir_resolved.startsWith(vercelBuildOutputDir)) writeBuildOutputConfig()
}

/**
 * Generates .md files for AI agents by processing source markdown files.
 * For each .md/.mdx source file, creates a corresponding .md file in the output directory
 * with human-only content removed and agent-only content unwrapped.
 */
async function generateMarkdownFiles({
  rootDir,
  outDir,
}: {
  rootDir: string
  outDir: string
}) {
  const pagesDir = resolve(rootDir, 'pages')
  const globPattern = `${pagesDir}/**/*.{md,mdx}`
  const files = await Array.fromAsync(glob(globPattern))

  for (const file of files) {
    try {
      // Calculate the output path (same structure but .md extension)
      let relativePath = file.replace(pagesDir, '').replace(/\.[^.]*$/, '.md')

      // Handle index files
      if (relativePath.endsWith('/index.md')) {
        relativePath = relativePath.replace('/index.md', '/index.md')
      }

      const outputPath = resolve(outDir, relativePath.replace(/^\//, ''))

      // Read and process the markdown
      const content = fs.readFileSync(file, 'utf-8')
      const processedContent = processMarkdownForAgent(content)

      // Ensure output directory exists and write the file
      fs.ensureDirSync(dirname(outputPath))
      fs.writeFileSync(outputPath, processedContent)
    } catch (e) {
      console.error(`Error generating markdown for ${file}:`, e)
    }
  }
}
