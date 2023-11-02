#!/usr/bin/env node
import { cac } from 'cac'
import { type InitParameters, init } from './init.js'
import pkg from './package.json'

const cli = cac('create-vocs')

cli.usage('[options]').option('-n, --name [name]', 'Name of project')

cli.help()
cli.version(pkg.version)

const { options } = cli.parse()

if (!options.help) init(options as InitParameters)
