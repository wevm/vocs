#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { getBinaryPath } from './index.js'

const binary = getBinaryPath()
const child = spawn(binary, process.argv.slice(2), {
  stdio: 'inherit',
})

child.on('exit', (code) => {
  process.exit(code ?? 0)
})
