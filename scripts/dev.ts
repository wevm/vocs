import { resolve } from 'path'
import { createServer } from '../src/server.js'

createServer({ dev: true, root: resolve(__dirname, '../src') })
