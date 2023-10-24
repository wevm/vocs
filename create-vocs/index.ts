#!/usr/bin/env node
import { cac } from 'cac'
import { cli_init, init, version } from 'vocs/internal'

const cli = cac('create-vocs')

cli_init(cli)

cli.help()
cli.version(version)

const { options } = cli.parse()

if (!options.help) init(options as any)
