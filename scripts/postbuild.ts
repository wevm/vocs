// TODO: Probably don't do this?

import { copyFileSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

copyFileSync(
  resolve(import.meta.dir, '../src/index.html'),
  resolve(import.meta.dir, '../src/_lib/index.html'),
)
copyFileSync(
  resolve(import.meta.dir, '../src/index.css'),
  resolve(import.meta.dir, '../src/_lib/index.css'),
)

const htmlFilePath = resolve(import.meta.dir, '../src/_lib/index.html')
const htmlFile = readFileSync(htmlFilePath, 'utf-8')
writeFileSync(htmlFilePath, htmlFile.replace(/\.(tsx|ts)/g, '.js'))

const serverFilePath = resolve(import.meta.dir, '../src/_lib/server.js')
const serverFile = readFileSync(serverFilePath, 'utf-8')
writeFileSync(serverFilePath, serverFile.replace(/\.(tsx|ts)/g, '.js'))

const buildFilePath = resolve(import.meta.dir, '../src/_lib/build.js')
const buildFile = readFileSync(buildFilePath, 'utf-8')
writeFileSync(buildFilePath, buildFile.replace(/\.(tsx|ts)/g, '.js'))
