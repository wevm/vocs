import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { afterEach, expect, it } from 'vitest'
import * as TypeScript from './typescript.js'

const roots: string[] = []

afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true })
})

it('loads TypeScript from the project root', () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vocs-typescript-'))
  roots.push(rootDir)

  const packageDir = path.join(rootDir, 'node_modules/typescript')
  fs.mkdirSync(packageDir, { recursive: true })
  fs.writeFileSync(
    path.join(packageDir, 'package.json'),
    JSON.stringify({ name: 'typescript', main: 'index.js' }),
  )
  fs.writeFileSync(path.join(packageDir, 'index.js'), "module.exports = { version: 'project' }")

  expect(TypeScript.fromProject({ rootDir }).version).toBe('project')
})
