#!/usr/bin/env node
import { cac } from 'cac'
import { cliInit, version } from 'vocs/internal'

const cli = cac('create-vocs')

cli.usage('[options]').option('-n, --name [name]', 'Name of project')

cli.help()
cli.version(version)

const { options } = cli.parse()

if (!options.help) cliInit(options as any)
