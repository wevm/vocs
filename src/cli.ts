#!/usr/bin/env node
import { cac } from 'cac'

import { version } from './version.js'

const cli = cac('vocs')

// dev
cli
  .command('[root]')
  .alias('dev')
  .action(async () => {
    const { createDevServer } = await import('./vite/dev-server.js')
    const server = await createDevServer()
    await server.listen()
    server.printUrls()
  })

// build
cli.command('build').action(async () => {
  const { build } = await import('./vite/build.js')
  await build()
})

// preview
cli.command('preview').action(async () => {
  const { preview } = await import('./vite/preview.js')
  const server = await preview()
  server.printUrls()
})

cli.help()
cli.version(version)

cli.parse()
