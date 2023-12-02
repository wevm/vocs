#!/usr/bin/env node
import { createRequire } from 'node:module'
import { cac } from 'cac'
import { type InitParameters, init } from './init.js'

const require = createRequire(import.meta.url)
const pkg = require('../package.json')

const cli = cac('create-vocs')

cli.usage('[options]').option('-n, --name [name]', 'Name of project')

cli.help()
cli.version(pkg.version)

const { options } = cli.parse()

if (!options.help) init(options as InitParameters)
