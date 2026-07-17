import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as Config from './config.js'
import * as Embedding from './embedding.js'
import type * as Feedback from './feedback.js'
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
  vi.restoreAllMocks()
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

describe('submit_feedback', () => {
  it('submits page feedback through the configured adapter', async () => {
    const submit = vi.fn(async (_data: Feedback.FeedbackData) => {})
    const config = Config.define({
      rootDir: dir,
      basePath: '/reference',
      baseUrl: 'https://docs.example.com',
      feedback: { type: 'test', submit },
      mcp: { enabled: true },
    })

    const server = Mcp.createServer(config)
    const client = await connect(server)
    const tools = await client.listTools()
    const result = await client.callTool({
      name: 'submit_feedback',
      arguments: {
        pagePath: '/deploy',
        helpful: false,
        category: 'Outdated',
        message: 'The deployment instructions are stale.',
      },
    })

    expect(tools.tools.map((tool) => tool.name)).toContain('submit_feedback')
    expect(result.isError).not.toBe(true)
    expect(resultText(result)).toBe('Feedback submitted successfully.')
    expect(submit).toHaveBeenCalledOnce()
    expect(submit).toHaveBeenCalledWith({
      helpful: false,
      category: 'Outdated',
      message: 'The deployment instructions are stale.',
      pageUrl: 'https://docs.example.com/reference/deploy',
      timestamp: expect.any(String),
    })
  })

  it('is not registered without a feedback adapter', async () => {
    const config = Config.define({ rootDir: dir, mcp: { enabled: true } })

    const server = Mcp.createServer(config)
    const client = await connect(server)
    const tools = await client.listTools()

    expect(tools.tools.map((tool) => tool.name)).not.toContain('submit_feedback')
  })

  it('returns an MCP error when the adapter rejects the submission', async () => {
    const error = new Error('Adapter failed')
    const submit = vi.fn(async (_data: Feedback.FeedbackData) => {
      throw error
    })
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const config = Config.define({
      rootDir: dir,
      feedback: { type: 'test', submit },
      mcp: { enabled: true },
    })

    const server = Mcp.createServer(config)
    const client = await connect(server)
    const result = await client.callTool({
      name: 'submit_feedback',
      arguments: { pagePath: '/', helpful: true },
    })

    expect(result.isError).toBe(true)
    expect(resultText(result)).toBe('Failed to submit feedback.')
    expect(log).toHaveBeenCalledWith('[vocs] mcp submit_feedback failed:', error)
  })
})
