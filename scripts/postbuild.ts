// TODO: Probably don't do this?

import { copyFileSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

copyFileSync(resolve(__dirname, '../src/index.html'), resolve(__dirname, '../src/_lib/index.html'))
copyFileSync(resolve(__dirname, '../src/index.css'), resolve(__dirname, '../src/_lib/index.css'))

const htmlFilePath = resolve(__dirname, '../src/_lib/index.html')
const htmlFile = readFileSync(htmlFilePath, 'utf-8')
writeFileSync(htmlFilePath, htmlFile.replace(/\.tsx/g, '.js'))

const pagesFilePath = resolve(__dirname, '../src/_lib/app/pages.js')
const pagesFile = readFileSync(pagesFilePath, 'utf-8')
writeFileSync(pagesFilePath, pagesFile.replace(/\.tsx/g, '.js'))

const serverFilePath = resolve(__dirname, '../src/_lib/server.js')
const serverFile = readFileSync(serverFilePath, 'utf-8')
writeFileSync(serverFilePath, serverFile.replace(/\.tsx/g, '.js'))
