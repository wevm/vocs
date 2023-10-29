#!/usr/bin/env node
import { cac } from 'cac'

import { build, cli_build } from './commands/build.js'
import { cli_dev, dev } from './commands/dev.js'
import { cli_init, init } from './commands/init.js'
import { cli_preview, preview } from './commands/preview.js'
import { version } from './version.js'

const cli = cac('vocs')

cli_dev(cli).command('dev').action(dev)
cli_init(cli).command('init').action(init)
cli_build(cli).command('build').action(build)
cli_preview(cli).command('preview').action(preview)

cli.help()
cli.version(version)

cli.parse()
