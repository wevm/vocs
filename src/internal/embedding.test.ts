import { describe, expect, it } from 'vitest'
import * as Embedding from './embedding.js'

describe('Embedding.mock', () => {
  it('is deterministic for the same text', async () => {
    const adapter = Embedding.mock({ dimensions: 16 })
    const [a] = await adapter.embed(['create user'], { purpose: 'document' })
    const [b] = await adapter.embed(['create user'], { purpose: 'document' })
    expect(a).toEqual(b)
    expect(a).toHaveLength(16)
  })

  it('differs for different text', async () => {
    const adapter = Embedding.mock({ dimensions: 16 })
    const [a] = await adapter.embed(['hello world'], { purpose: 'document' })
    const [b] = await adapter.embed(['goodbye world'], { purpose: 'document' })
    expect(a).not.toEqual(b)
  })

  it('returns one vector per input, in order', async () => {
    const adapter = Embedding.mock()
    const vectors = await adapter.embed(['a', 'b', 'c'], { purpose: 'document' })
    expect(vectors).toHaveLength(3)
  })
})

describe('adapter factories', () => {
  it('openai defaults to text-embedding-3-small', () => {
    expect(Embedding.openai().model).toBe('text-embedding-3-small')
    expect(Embedding.openai().type).toBe('openai')
  })

  it('openaiCompatible tags the type', () => {
    expect(Embedding.openaiCompatible({ baseUrl: 'http://x/v1', model: 'm' }).type).toBe(
      'openai-compatible',
    )
  })

  it('openrouter tags the type and defaults the model slug', () => {
    const adapter = Embedding.openrouter()
    expect(adapter.type).toBe('openrouter')
    expect(adapter.model).toBe('openai/text-embedding-3-small')
  })

  it('openrouter sends attribution headers and key to /embeddings', async () => {
    const calls: { url: string; headers: Record<string, string> }[] = []
    const original = globalThis.fetch
    globalThis.fetch = (async (url: string, init: RequestInit) => {
      calls.push({ url: String(url), headers: init.headers as Record<string, string> })
      return new Response(JSON.stringify({ data: [{ index: 0, embedding: [0, 1] }] }), {
        status: 200,
      })
    }) as typeof fetch
    try {
      const adapter = Embedding.openrouter({
        apiKey: 'sk-or-test',
        referer: 'https://example.com',
        title: 'Docs',
      })
      await adapter.embed(['hi'], { purpose: 'document' })
    } finally {
      globalThis.fetch = original
    }
    expect(calls[0]?.url).toBe('https://openrouter.ai/api/v1/embeddings')
    expect(calls[0]?.headers['Authorization']).toBe('Bearer sk-or-test')
    expect(calls[0]?.headers['HTTP-Referer']).toBe('https://example.com')
    expect(calls[0]?.headers['X-Title']).toBe('Docs')
  })

  it('cloudflare defaults to bge-base and infers dimensions', () => {
    const adapter = Embedding.cloudflare()
    expect(adapter.type).toBe('cloudflare')
    expect(adapter.model).toBe('@cf/baai/bge-base-en-v1.5')
    expect(adapter.dimensions).toBe(768)
  })

  it('cloudflare posts text batch to /ai/run/{model} and reads result.data', async () => {
    const calls: { url: string; headers: Record<string, string>; body: string }[] = []
    const original = globalThis.fetch
    globalThis.fetch = (async (url: string, init: RequestInit) => {
      calls.push({
        url: String(url),
        headers: init.headers as Record<string, string>,
        body: String(init.body),
      })
      return new Response(JSON.stringify({ result: { data: [[0, 1, 2]] }, success: true }), {
        status: 200,
      })
    }) as typeof fetch
    try {
      const adapter = Embedding.cloudflare({ accountId: 'acc-1', apiToken: 'cf-test' })
      const vectors = await adapter.embed(['hi'], { purpose: 'query' })
      expect(vectors).toEqual([[0, 1, 2]])
    } finally {
      globalThis.fetch = original
    }
    expect(calls[0]?.url).toBe(
      'https://api.cloudflare.com/client/v4/accounts/acc-1/ai/run/@cf/baai/bge-base-en-v1.5',
    )
    expect(calls[0]?.headers['Authorization']).toBe('Bearer cf-test')
    expect(JSON.parse(calls[0]?.body ?? '{}')).toEqual({ text: ['hi'] })
  })

  it('cloudflare throws without account id or token', async () => {
    await expect(
      Embedding.cloudflare({ apiToken: 't' }).embed(['x'], { purpose: 'document' }),
    ).rejects.toThrow(/accountId/)
    await expect(
      Embedding.cloudflare({ accountId: 'a' }).embed(['x'], { purpose: 'document' }),
    ).rejects.toThrow(/apiToken/)
  })

  it('ollama defaults to nomic-embed-text', () => {
    expect(Embedding.ollama().model).toBe('nomic-embed-text')
  })

  it('transformers throws (not implemented)', () => {
    expect(() => Embedding.transformers({ model: 'x' })).toThrow(/not implemented/)
  })
})
