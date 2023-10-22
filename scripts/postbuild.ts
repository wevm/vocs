// TODO: Probably don't do this?

import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { copy, copyFileSync, readFileSync, writeFileSync } from 'fs-extra'

copyFileSync(
  resolve(import.meta.dir, '../src/vite/index.html'),
  resolve(import.meta.dir, '../src/_lib/vite/index.html'),
)
copy(
  resolve(import.meta.dir, '../src/app/styles'),
  resolve(import.meta.dir, '../src/_lib/app/styles'),
)

rewriteExtensions(resolve(import.meta.dir, '../src/_lib'))

////////////////////////////////////////////////////////////////////

function rewriteExtensions(dir: string) {
  const files = readdirSync(dir)
  for (const file of files) {
    const path = resolve(dir, file)
    if (isDir(path)) {
      rewriteExtensions(path)
      continue
    }
    if (path.endsWith('.map')) continue
    const fileContent = readFileSync(path, 'utf-8')
    writeFileSync(path, fileContent.replace(/\.(tsx|ts)/g, '.js'))
  }
}

function isDir(dir: string) {
  try {
    readdirSync(dir)
    return true
  } catch {
    return false
  }
}
