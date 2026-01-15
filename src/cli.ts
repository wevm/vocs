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
  .command('precache', 'Pre-build Rust twoslash cache')
  .option('--concurrency <n>', 'Number of parallel compilations', { default: 1 })
  .action(async (options: { concurrency: number }) => {
    const config = await Config.resolve()
    const cacheDir = path.resolve(config.rootDir, '.vocs/cache')

    // Import twoslash-rust dynamically to avoid circular deps
    const { createRustTwoslasher } = await import('./internal/twoslash-rust.js')
    const twoslasher = createRustTwoslasher({
      cacheDir,
      cargoToml:
        config.twoslashRust && typeof config.twoslashRust === 'object'
          ? config.twoslashRust.cargoToml
          : undefined,
    })

    // Find all MDX files
    const srcDir = path.resolve(config.rootDir, config.srcDir)
    const mdxFiles: string[] = []
    for await (const file of glob('**/*.mdx', { cwd: srcDir })) {
      mdxFiles.push(path.resolve(srcDir, file))
    }

    // Regex to find ```rust twoslash code blocks
    const rustTwoslashRegex = /```(?:rust|rs)\s+twoslash\n([\s\S]*?)```/g

    const blocks: { file: string; code: string }[] = []

    for (const file of mdxFiles) {
      const content = fs.readFileSync(file, 'utf-8')
      for (const match of content.matchAll(rustTwoslashRegex)) {
        if (match[1]) blocks.push({ file, code: match[1] })
      }
    }

    if (blocks.length === 0) {
      console.log('[vocs] No Rust twoslash blocks found')
      return
    }

    console.log(`[vocs] Found ${blocks.length} Rust twoslash block(s) to precache`)

    // Process blocks with concurrency limit
    const concurrency = Math.max(1, options.concurrency)
    let completed = 0

    const processBlock = async (block: { file: string; code: string }) => {
      const relativePath = path.relative(config.rootDir, block.file)
      const preview = block.code.slice(0, 50).replace(/\n/g, '\\n')
      console.log(
        `[vocs] [${++completed}/${blocks.length}] Processing: ${relativePath} - "${preview}..."`,
      )
      twoslasher(block.code, 'rust')
    }

    // Simple concurrency limiter
    const queue = [...blocks]
    const workers = Array.from({ length: concurrency }, async () => {
      while (queue.length > 0) {
        const block = queue.shift()
        if (block) await processBlock(block)
      }
    })

    await Promise.all(workers)
    console.log(`[vocs] Precache complete: ${blocks.length} block(s) processed`)
  })

cli.help()
cli.version(pkg.version)
cli.parse()
