#!/usr/bin/env node
import { cac } from 'cac'

import { version } from './version.js'

const cli = cac('vocs')

// dev
cli
  .command('[root]')
  .alias('dev')
  .action(async () => {
    const { createServer } = await import('./server.js')
    createServer({ dev: true })
  })

// build
cli.command('build').action(async () => {
  const { build } = await import('./build.js')
  build()
})

// serve
cli.command('serve').action(async () => {
  const { createServer } = await import('./server.js')
  createServer()
})

cli.help()
cli.version(version)

cli.parse()
