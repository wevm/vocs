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

  it('routes clean-URL negotiation before static files and `.md` requests after', async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vocs-vercel-'))
    process.chdir(tempDir)

    fs.mkdirSync('dist/public/assets', { recursive: true })
    fs.mkdirSync('dist/server', { recursive: true })
    fs.writeFileSync('dist/public/assets/index.js', 'public asset')
    fs.writeFileSync('dist/public/SKILL.md', 'static markdown')
    fs.writeFileSync('dist/server/index.js', 'server entry')

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

    // `public/*.md` files land in the static output served by the filesystem handler.
    expect(fs.readFileSync('.vercel/output/static/SKILL.md', 'utf-8')).toBe('static markdown')

    const config = JSON.parse(fs.readFileSync('.vercel/output/config.json', 'utf-8'))

    const userAgentPattern = config.routes
      .flatMap((route: { has?: { key: string; value: string }[] }) => route.has ?? [])
      .find((condition: { key: string }) => condition.key === 'user-agent')?.value
    expect(userAgentPattern).toContain('GPTBot')
    expect(userAgentPattern).toContain('curl/')

    // Redact the user-agent pattern; the list is asserted above.
    const routes = config.routes.map((route: { has?: { key: string; value: string }[] }) => {
      if (!route.has?.some((condition) => condition.key === 'user-agent')) return route
      return {
        ...route,
        has: route.has.map((condition) =>
          condition.key === 'user-agent' ? { ...condition, value: '<user-agents>' } : condition,
        ),
      }
    })

    expect(routes).toMatchInlineSnapshot(`
      [
        {
          "headers": {
            "cache-control": "public, immutable, max-age=31536000",
          },
          "src": "^/assets/(.*)$",
        },
        {
          "dest": "/RSC/",
          "has": [
            {
              "key": "accept",
              "type": "header",
              "value": ".*text/markdown.*",
            },
          ],
          "src": "^/(?!assets/)(?!.*\\.[^/]+$)(.*)$",
        },
        {
          "dest": "/RSC/",
          "has": [
            {
              "key": "user-agent",
              "type": "header",
              "value": "<user-agents>",
            },
          ],
          "src": "^/(?!assets/)(?!.*\\.[^/]+$)(.*)$",
        },
        {
          "handle": "filesystem",
        },
        {
          "dest": "/RSC/",
          "src": "^/(?!assets/)(.*\\.md)$",
        },
        {
          "dest": "/RSC/",
          "src": "/(.*)",
        },
      ]
    `)
  })
})
