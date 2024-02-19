// TODO: Probably don't do this?

import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { default as fs } from 'fs-extra'

// Copy index.html
fs.copyFileSync(
  resolve(import.meta.dir, '../src/vite/index.html'),
  resolve(import.meta.dir, '../src/_lib/vite/index.html'),
)

// Copy public folder
fs.copy(
  resolve(import.meta.dir, '../src/app/public'),
  resolve(import.meta.dir, '../src/_lib/app/public'),
)

// Copy create-vocs templates
fs.copy(
  resolve(import.meta.dir, '../create-vocs/templates'),
  resolve(import.meta.dir, '../create-vocs/_lib/templates'),
)

rewriteExtensions(resolve(import.meta.dir, '../src/_lib'))
rewriteMdxPlugin()

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
    if (path.endsWith('root.js')) continue
    if (path.endsWith('vocs-config.js')) continue
    const fileContent = fs.readFileSync(path, 'utf-8')
    fs.writeFileSync(path, fileContent.replace(/\.(tsx)/g, '.jsx'))
    fs.writeFileSync(path, fileContent.replace(/\.(ts)/g, '.js'))
  }
}

function rewriteMdxPlugin() {
  const path = resolve(import.meta.dir, '../src/_lib/vite/plugins/mdx.js')
  const content = fs.readFileSync(path, 'utf-8')
  fs.writeFileSync(path, content.replace('@mdx-js/react', 'vocs/mdx-react'))
}

function isDir(dir: string) {
  try {
    readdirSync(dir)
    return true
  } catch {
    return false
  }
}
