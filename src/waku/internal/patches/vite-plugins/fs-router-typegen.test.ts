import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { generateFsRouterTypes } from './fs-router-typegen.js'

let tempDir: string | undefined

afterEach(() => {
  if (tempDir) fs.rmSync(tempDir, { recursive: true, force: true })
  tempDir = undefined
})

function createPages(files: Record<string, string>) {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vocs-router-types-'))
  const pagesDir = path.join(tempDir, 'pages')
  for (const [file, contents] of Object.entries(files)) {
    const filePath = path.join(pagesDir, file)
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, contents)
  }
  return pagesDir
}

describe('generateFsRouterTypes', () => {
  it('uses dynamic as the default render mode', async () => {
    const pagesDir = createPages({
      'index.mdx': '# Home',
      'docs/intro.tsx': 'export default function Page() { return null }',
    })

    const result = await generateFsRouterTypes(pagesDir)

    expect(result).toContain("{ path: '/'; render: 'dynamic' }")
    expect(result).toContain("{ path: '/docs/intro'; render: 'dynamic' }")
  })

  it('uses the configured default render mode', async () => {
    const pagesDir = createPages({
      'index.mdx': '# Home',
      'docs/intro.tsx': 'export default function Page() { return null }',
    })

    const result = await generateFsRouterTypes(pagesDir, { defaultRender: 'static' })

    expect(result).toContain("{ path: '/'; render: 'static' }")
    expect(result).toContain("{ path: '/docs/intro'; render: 'static' }")
  })
})
