#!/usr/bin/env node
import { cac } from 'cac'
import { cliInit, version } from '../src/internal.js'

const cli = cac('create-vocs')

cli
  .usage('[options]')
  .option('-n, --name [name]', 'Name of project')
  .option(
    '-i, --install [false|npm|pnpm|yarn|bun]',
    'Install dependencies (and optionally force package manager)',
    {
      default: true,
    },
  )
  .option('-g, --git', 'Initialize git repository', { default: true })

cli.help()
cli.version(version)

const { options } = cli.parse()

if (!options.help) cliInit(options as any)
