import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import buildEnhancer from './vercel-build-enhancer.js'

const originalCwd = process.cwd()
let tempDir: string | undefined

afterEach(() => {
  process.chdir(originalCwd)
  if (tempDir) fs.rmSync(tempDir, { recursive: true, force: true })
  tempDir = undefined
})

describe('vercel build enhancer', () => {
  it('does not copy public assets into the serverless function', async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vocs-vercel-'))
    process.chdir(tempDir)

    fs.mkdirSync('dist/public/assets', { recursive: true })
    fs.mkdirSync('dist/server/assets', { recursive: true })
    fs.writeFileSync('dist/public/assets/index.js', 'public asset')
    fs.writeFileSync('dist/server/index.js', 'server entry')
    fs.writeFileSync('dist/server/assets/server-entry.js', 'server asset')

    const build = await buildEnhancer(async () => {})

    await build(
      {},
      {
        assetsDir: 'assets',
        distDir: 'dist',
        rscBase: 'RSC',
        privateDir: 'private',
        basePath: '/',
        DIST_PUBLIC: 'public',
        serverless: true,
      },
    )

    expect(fs.existsSync('.vercel/output/static/assets/index.js')).toBe(true)
    expect(fs.existsSync('.vercel/output/functions/RSC.func/dist/server/index.js')).toBe(true)
    expect(fs.existsSync('.vercel/output/functions/RSC.func/dist/serve-vercel.js')).toBe(true)
    expect(fs.existsSync('.vercel/output/functions/RSC.func/dist/public')).toBe(false)
  })
})
