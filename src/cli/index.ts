#!/usr/bin/env node
import { cac } from 'cac'

import { build } from './commands/build.js'
import { dev } from './commands/dev.js'
import { init } from './commands/init.js'
import { preview } from './commands/preview.js'
import { version } from './version.js'

export const cli = cac('vocs')

cli.command('[root]').alias('dev').option('-h, --host', 'Expose host URL').action(dev)
cli
  .command('init')
  .option('-n, --name [name]', 'Name of project')
  .option(
    '-i, --install [false|npm|pnpm|yarn|bun]',
    'Install dependencies (and optionally force package manager)',
    {
      default: true,
    },
  )
  .option('-g, --git', 'Initialize git repository', { default: true })
  .action(init)
cli.command('build').action(build)
cli.command('preview').action(preview)

cli.help()
cli.version(version)

cli.parse()
