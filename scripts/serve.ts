import { resolve } from 'path'
import { createServer } from '../src/server.js'

createServer({ root: resolve(__dirname, '../src') })
