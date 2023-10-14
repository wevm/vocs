import { resolve } from 'path'
import { build } from '../src/build.js'

build({ outDir: resolve(__dirname, '../src/dist') })
