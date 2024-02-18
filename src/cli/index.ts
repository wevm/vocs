#!/usr/bin/env node
import { cac } from 'cac'

import { build } from './commands/build.js'
import { dev } from './commands/dev.js'
import { preview } from './commands/preview.js'
import { searchIndex } from './commands/search-index.js'
import { version } from './version.js'

export const cli = cac('vocs')

cli
  .command('[root]')
  .alias('dev')
  .option('-c, --clean', 'clean the cache and re-bundle')
  .option('-h, --host', 'Expose host URL')
  .option('-p, --port [number]', 'Port used by the server (default: 5173)')
  .action(dev)
cli
  .command('build')
  .option('-c, --clean', 'clean the cache and re-bundle')
  .option('-l, --logLevel [level]', 'info | warn | error | silent')
  .option('-o, --outDir [dir]', 'output directory (default: dist)')
  .option('-p, --publicDir [dir]', 'public (asset) directory (default: public)')
  .option('--searchIndex', 'builds the search index (default: true)')
  .action(build)
cli.command('preview').action(preview)
cli
  .command('search-index')
  .option('-o, --outDir [dir]', 'output directory (default: dist)')
  .action(searchIndex)

cli.help()
cli.version(version)

cli.parse()
