#!/usr/bin/env node
import * as fs from 'node:fs'
import react from '@vitejs/plugin-react'
import { cac } from 'cac'
import * as vite from 'vite'
import * as createVocs from 'create-vocs'

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

cli.command('new', 'Create a new Vocs project').action(async () => {
  await createVocs.init()
})

cli.help()
cli.version(pkg.version)
cli.parse()
