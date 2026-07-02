import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import * as Config from './config.js'
import * as Embedding from './embedding.js'
import * as Mcp from './mcp.js'
import * as Retriever from './retriever.js'

let dir: string

beforeEach(() => {
  Retriever._resetServerIndexCache()
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vocs-mcp-'))
  const pages = path.join(dir, 'src', 'pages')
  fs.mkdirSync(pages, { recursive: true })
  fs.writeFileSync(
    path.join(pages, 'index.mdx'),
    '# Getting Started\n\nVocs is a documentation framework powered by Vite.\n',
  )
  fs.writeFileSync(
    path.join(pages, 'deploy.mdx'),
    '# Deployment\n\nPublish your documentation site to production hosting.\n',
  )
})
afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true })
})

async function connect(server: ReturnType<typeof Mcp.createServer>) {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  const client = new Client({ name: 'test', version: '1.0.0' })
  await server.connect(serverTransport)
  await client.connect(clientTransport)
  return client
}

function resultText(result: Awaited<ReturnType<Client['callTool']>>): string {
  const content = result.content as { type: string; text?: string }[]
  return content[0]?.text ?? ''
}

describe('search_docs', () => {
  it('uses the AI retriever when configured', async () => {
    const config = Config.define({
      rootDir: dir,
      ai: {
        retriever: Retriever.local({
          embedding: Embedding.mock({ dimensions: 64 }),
          cache: false,
        }),
      },
    })
    const manifest = await Retriever.buildIndex(config)
    Retriever._resetServerIndexCache()

    const server = Mcp.createServer(config, { loadManifest: async () => manifest })
    const client = await connect(server)
    const result = await client.callTool({
      name: 'search_docs',
      arguments: { query: 'publish documentation production' },
    })

    const results = JSON.parse(resultText(result)) as {
      path: string
      title: string
      score: number
    }[]
    expect(results.length).toBeGreaterThan(0)
    expect(results[0]).toHaveProperty('title')
    expect(results[0]).toHaveProperty('score')
    expect(results.some((r) => r.path.includes('/deploy'))).toBe(true)
  })

  it('falls back to a substring scan without a retriever', async () => {
    const config = Config.define({ rootDir: dir })

    const server = Mcp.createServer(config)
    const client = await connect(server)
    const result = await client.callTool({
      name: 'search_docs',
      arguments: { query: 'production hosting' },
    })

    const results = JSON.parse(resultText(result)) as { path: string; snippet: string }[]
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toBe('/deploy')
    expect(results[0]?.snippet).toContain('production hosting')
  })
})
