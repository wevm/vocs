#!/usr/bin/env node
import * as fs from 'node:fs'
import { glob } from 'node:fs/promises'
import * as path from 'node:path'
import react from '@vitejs/plugin-react'
import { cac } from 'cac'
import * as vite from 'vite'
import * as Config from './internal/config.js'
import { vocs } from './waku/vite.js'

const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'))

const cli = cac('vocs')

async function getTypeScriptForTwoslash() {
  try {
    return await import('typescript')
  } catch {
    throw new Error(
      'Using twoslash code blocks requires `typescript` to be installed in your project.',
    )
  }
}

cli
  .command('dev', 'Start development server')
  .option('--port <port>', 'Port to listen on', { default: 5173 })
  .option('--host [host]', 'Host to listen on')
  .action(async (options: { port: number; host?: string | boolean }) => {
    const server = await vite.createServer({
      configFile: false,
      plugins: [react(), vocs()],
      server: {
        port: options.port,
        ...(options.host !== undefined && { host: options.host }),
      },
    })
    await server.listen()
    server.printUrls()
  })

cli.command('build', 'Build for production').action(async () => {
  const config = await Config.resolve()
  const builder = await vite.createBuilder({
    configFile: false,
    plugins: [react(), vocs()],
    build: {
      outDir: config.outDir,
    },
  })
  await builder.buildApp()
})

cli
  .command('preview', 'Preview production build')
  .option('--port <port>', 'Port to listen on', { default: 4173 })
  .option('--host [host]', 'Host to listen on')
  .action(async (options: { port: number; host?: string | boolean }) => {
    const config = await Config.resolve()
    process.env['PORT'] ??= String(options.port)
    if (options.host) process.env['HOST'] = String(options.host)
    const previewPath = new URL(`${config.outDir}/preview.js`, `file://${process.cwd()}/`).href
    await import(previewPath)
  })

cli
  .command('twoslash [pattern]', 'Check twoslash blocks for errors [experimental]')
  .option('--lang <lang>', 'Language to check: typescript, rust, or all', { default: 'typescript' })
  .option('--fail-on-error', 'Exit with non-zero code if errors found', { default: true })
  .option('--concurrency <n>', 'Number of parallel Rust compilations', { default: 1 })
  .option('--verbose', 'Enable verbose output', { default: false })
  .action(
    async (
      pattern: string | undefined,
      options: {
        lang: string
        failOnError: boolean
        concurrency: number
        verbose: boolean
      },
    ) => {
      const config = await Config.resolve()
      const srcDir = path.resolve(config.rootDir, config.srcDir)
      const cacheDir = path.resolve(config.rootDir, '.vocs/cache')

      // Find MD/MDX files matching the pattern
      // Auto-append /*.{md,mdx} if pattern doesn't already specify an extension
      let globPattern = pattern ?? '**/*.{md,mdx}'
      if (pattern && !pattern.match(/\.mdx?(\})?$/)) {
        globPattern = pattern.endsWith('/') ? `${pattern}*.{md,mdx}` : `${pattern}/*.{md,mdx}`
      }

      const mdxFiles: string[] = []
      for await (const file of glob(globPattern, { cwd: srcDir }))
        mdxFiles.push(path.resolve(srcDir, file))

      if (mdxFiles.length === 0) {
        console.log('[vocs] No MDX files found')
        return
      }

      // Regex to find ```lang twoslash code blocks (3+ backticks or tildes)
      const twoslashRegex = /(?:`{3,}|~{3,})(\w+)\s+twoslash([^\n]*)\n([\s\S]*?)(?:`{3,}|~{3,})/g
      // Regex to find :::code-group blocks (3+ colons)
      const codeGroupRegex = /:{3,}code-group\n([\s\S]*?):{3,}/g
      // Regex to extract filename from meta
      const filenameRegex = /filename=["']([^"']+)["']/

      const tsLangs = ['ts', 'tsx', 'typescript', 'js', 'jsx', 'javascript']
      const rustLangs = ['rust', 'rs']

      type Block = { file: string; code: string; lang: string; meta: string }
      const tsBlocks: Block[] = []
      const rustBlocks: Block[] = []

      // Physical source getter for `// [!include ~/...]`
      const Snippets = await import('./internal/snippets.js')
      const physicalSourceGetter = Snippets.createPhysicalSourceGetter({
        srcDir: config.srcDir,
        rootDir: config.rootDir,
      })

      /** Removes common leading whitespace from all lines. */
      function dedent(text: string): string {
        const lines = text.split('\n')
        let minIndent = Number.POSITIVE_INFINITY
        for (const line of lines) {
          if (line.trim().length === 0) continue
          const match = line.match(/^(\s*)/)
          if (match) minIndent = Math.min(minIndent, match[1]?.length ?? 0)
        }
        if (minIndent === Number.POSITIVE_INFINITY || minIndent === 0) return text
        return lines.map((line) => line.slice(minIndent)).join('\n')
      }

      for (const file of mdxFiles) {
        const content = fs.readFileSync(file, 'utf-8')

        // Build virtual file map from code-groups
        const virtualFiles = new Map<string, string>()
        for (const groupMatch of content.matchAll(codeGroupRegex)) {
          const groupContent = groupMatch[1] ?? ''
          for (const blockMatch of groupContent.matchAll(twoslashRegex)) {
            const meta = blockMatch[2]?.trim() ?? ''
            let code = blockMatch[3] ?? ''
            const filenameMatch = meta.match(filenameRegex)
            if (filenameMatch?.[1]) {
              code = Snippets.processIncludes({
                code: code.trim(),
                getSource: physicalSourceGetter,
              })
              virtualFiles.set(filenameMatch[1], code)
            }
          }
        }

        // Combine physical and virtual source getters
        const virtualSourceGetter = Snippets.createVirtualSourceGetter({ virtualFiles })
        const getSource = Snippets.combineSourceGetters(physicalSourceGetter, virtualSourceGetter)

        for (const match of content.matchAll(twoslashRegex)) {
          const lang = match[1]
          const meta = match[2]?.trim() ?? ''
          let code = match[3]
          if (!lang || !code) continue

          code = dedent(code)
          code = Snippets.processIncludes({ code, getSource })

          if (virtualFiles.size > 0 && tsLangs.includes(lang)) {
            code = Snippets.processImports({ code, virtualFiles })
          }

          if (tsLangs.includes(lang)) {
            tsBlocks.push({ file, code, lang, meta })
          } else if (rustLangs.includes(lang)) {
            rustBlocks.push({ file, code, lang, meta })
          }
        }
      }

      const checkTs = options.lang === 'typescript' || options.lang === 'all'
      const checkRust = options.lang === 'rust' || options.lang === 'all'

      const blocksToCheck = (checkTs ? tsBlocks.length : 0) + (checkRust ? rustBlocks.length : 0)
      if (blocksToCheck === 0) {
        console.log('[vocs] No twoslash blocks found')
        return
      }

      type TwoslashError = { file: string; lang: string; meta: string; code: string; error: string }
      const errors: TwoslashError[] = []

      // Check TypeScript blocks
      if (checkTs && tsBlocks.length > 0) {
        console.log(`[vocs] Checking ${tsBlocks.length} TypeScript twoslash block(s)...`)

        // Use same config as build (shiki-transformers.ts)
        const { createTwoslasher } = await import('twoslash')
        const tsModule = await getTypeScriptForTwoslash()
        const twoslasher = createTwoslasher({
          tsModule,
          compilerOptions: {
            ignoreDeprecations:
              Number.parseInt(tsModule.versionMajorMinor, 10) >= 6 ? '6.0' : '5.0',
            moduleResolution: 100, // bundler
            preserveSymlinks: false,
            types: ['node'],
          },
          customTags: ['log', 'error', 'warn', 'annotate'],
        })

        for (const block of tsBlocks) {
          const relativePath = path.relative(config.rootDir, block.file)
          try {
            twoslasher(block.code, block.lang)
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err)
            errors.push({
              file: relativePath,
              lang: block.lang,
              meta: block.meta,
              code: block.code,
              error: message,
            })
          }
        }
      }

      // Check Rust blocks
      if (checkRust && rustBlocks.length > 0) {
        console.log(`[vocs] Checking ${rustBlocks.length} Rust twoslash block(s)...`)
        const { createRustTwoslasher } = await import('./internal/twoslash/index.js')
        const rustTwoslasher = createRustTwoslasher({
          cacheDir,
          verbose: options.verbose,
        })

        const concurrency = Math.max(1, options.concurrency)
        const queue = [...rustBlocks]

        const processBlock = async (block: Block) => {
          const relativePath = path.relative(config.rootDir, block.file)
          try {
            rustTwoslasher(block.code, 'rust')
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err)
            errors.push({
              file: relativePath,
              lang: block.lang,
              meta: block.meta,
              code: block.code,
              error: message,
            })
          }
        }

        const workers = Array.from({ length: concurrency }, async () => {
          while (queue.length > 0) {
            const block = queue.shift()
            if (block) await processBlock(block)
          }
        })
        await Promise.all(workers)
      }

      if (errors.length === 0) {
        console.log(`[vocs] All ${blocksToCheck} twoslash block(s) passed`)
        return
      }

      console.error(`\n[vocs] Found ${errors.length} twoslash error(s):\n`)
      for (const err of errors) {
        console.error(`File: ${err.file}`)
        console.error(`Lang: ${err.lang}${err.meta ? ` ${err.meta}` : ''}`)
        console.error(`Error: ${err.error}`)
        console.error(`Code:\n${err.code.slice(0, 200)}${err.code.length > 200 ? '...' : ''}`)
        console.error('\n---\n')
      }

      if (options.failOnError) {
        process.exit(1)
      }
    },
  )

cli.help()
cli.version(pkg.version)
cli.parse()
