#!/usr/bin/env node
import { cac } from 'cac'

import { prerender } from './prerender.js'
import { version } from './version.js'

const cli = cac('vocs')

// dev
cli
  .command('[root]')
  .alias('dev')
  .action(async () => {
    const { createServer } = await import('./server.js')
    createServer({ dev: true, ssr: true })
  })

// build
cli
  .command('build')
  .option('--ssr', 'Build for SSR')
  .action(async (args) => {
    const { build } = await import('./build.js')
    await build({ ssr: args.ssr })
    if (!args.ssr) await prerender()
  })

// serve
cli
  .command('serve')
  .option('--ssr', 'Serve for SSR')
  .action(async (args) => {
    const { createServer } = await import('./server.js')
    createServer({ ssr: args.ssr })
  })

cli.help()
cli.version(version)

cli.parse()
