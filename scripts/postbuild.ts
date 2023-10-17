// TODO: Probably don't do this?

import { resolve } from 'node:path'
import { copy, copyFileSync, readFileSync, writeFileSync } from 'fs-extra'

copyFileSync(
  resolve(import.meta.dir, '../src/index.html'),
  resolve(import.meta.dir, '../src/_lib/index.html'),
)
copy(resolve(import.meta.dir, '../src/styles'), resolve(import.meta.dir, '../src/_lib/styles'))

const htmlFilePath = resolve(import.meta.dir, '../src/_lib/index.html')
const htmlFile = readFileSync(htmlFilePath, 'utf-8')
writeFileSync(htmlFilePath, htmlFile.replace(/\.(tsx|ts)/g, '.js'))

const serverFilePath = resolve(import.meta.dir, '../src/_lib/server.js')
const serverFile = readFileSync(serverFilePath, 'utf-8')
writeFileSync(serverFilePath, serverFile.replace(/\.(tsx|ts)/g, '.js'))

const buildFilePath = resolve(import.meta.dir, '../src/_lib/build.js')
const buildFile = readFileSync(buildFilePath, 'utf-8')
writeFileSync(buildFilePath, buildFile.replace(/\.(tsx|ts)/g, '.js'))
