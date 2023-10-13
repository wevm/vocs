import { createServer } from '../src/server.js'

createServer({ dev: process.env.NODE_ENV !== 'production' })