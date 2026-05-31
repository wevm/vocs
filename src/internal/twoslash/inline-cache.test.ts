import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  createInlineTypesCache,
  extractSourceMapComment,
  injectSourceMapComment,
  stripInlineCacheComments,
} from './inline-cache.js'

describe('source map codec', () => {
  it('round-trips a source map through inject/extract', () => {
    const sourceMap = { path: '/docs/a.md', from: 15, to: 42 }
    const injected = injectSourceMapComment('const a = 1', sourceMap)
    expect(injected.startsWith('// @vocs-twoslash-source:')).toBe(true)

    const result = extractSourceMapComment(injected)
    expect(result.code).toBe('const a = 1')
    expect(result.sourceMap).toEqual(sourceMap)
  })

  it('returns null source map when none present', () => {
    const result = extractSourceMapComment('const a = 1')
    expect(result.code).toBe('const a = 1')
    expect(result.sourceMap).toBeNull()
  })
})

describe('stripInlineCacheComments', () => {
  it('removes all cache comments', () => {
    const code = [
      '// @twoslash-cache: {"v":1,"hash":"abc","data":"x"}',
      'export const client = 1',
    ].join('\n')
    expect(stripInlineCacheComments(code)).toBe('export const client = 1')
  })

  it('leaves code without cache comments untouched', () => {
    const code = 'export const client = 1\nconst a = 2'
    expect(stripInlineCacheComments(code)).toBe(code)
  })
})

describe('inline types cache', () => {
  const tmpFiles: string[] = []

  afterEach(() => {
    for (const file of tmpFiles.splice(0)) fs.rmSync(file, { force: true })
  })

  function createMarkdown(body: string) {
    const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'vocs-inline-cache-')), 'page.md')
    const md = `\`\`\`ts twoslash\n${body}\n\`\`\`\n`
    fs.writeFileSync(file, md, 'utf-8')
    tmpFiles.push(file)
    // body starts right after the first newline (the opening fence line).
    const from = md.indexOf('\n') + 1
    return { file, md, from, to: md.length }
  }

  // Pull the on-disk fence body the way shiki would see it (everything between
  // the opening fence line and the closing fence).
  function readBody(file: string, from: number) {
    const content = fs.readFileSync(file, 'utf-8')
    return content.slice(from, content.lastIndexOf('\n```'))
  }

  it('writes a cache comment back to the source and reads it on the next pass', () => {
    const code = 'const a: string = "x"'
    const { file, from, to } = createMarkdown(code)

    const data = { nodes: [], code: 'compiled-output' }

    // --- Pass 1: cache miss -> twoslash runs -> write back ---
    {
      const { typesCache, patcher } = createInlineTypesCache()
      const meta = { sourceMap: { path: file, from, to } } as never

      const preprocessed = typesCache.preprocess?.(code, 'ts', {}, meta)
      expect(preprocessed).toBe(code)
      expect(typesCache.read(code, 'ts', {}, meta)).toBeNull()

      typesCache.write(code, data as never, 'ts', {}, meta)
      patcher.patch(file)
    }

    const written = fs.readFileSync(file, 'utf-8')
    expect(written).toContain('// @twoslash-cache:')

    // --- Pass 2: cache hit -> twoslash skipped ---
    {
      const { typesCache } = createInlineTypesCache()
      const body = readBody(file, from)
      const meta = { sourceMap: { path: file, from, to } } as never

      const preprocessed = typesCache.preprocess?.(body, 'ts', {}, meta)
      // the cache comment is stripped before twoslash would run
      expect(preprocessed).toBe(code)

      const cached = typesCache.read(body, 'ts', {}, meta)
      expect(cached).toEqual(data)
    }
  })

  it('replaces an existing cache comment in place instead of appending a duplicate', () => {
    const code = 'const a: string = "x"'
    const { file, from, to } = createMarkdown(code)
    const data = { nodes: [], code: 'compiled-output' }

    // --- Pass 1: cold write ---
    {
      const { typesCache, patcher } = createInlineTypesCache()
      const meta = { sourceMap: { path: file, from, to } } as never
      typesCache.preprocess?.(code, 'ts', {}, meta)
      typesCache.write(code, data as never, 'ts', {}, meta)
      patcher.patch(file)
    }

    const cacheLines = () =>
      fs
        .readFileSync(file, 'utf-8')
        .split('\n')
        .filter((l) => l.includes('// @twoslash-cache:'))
    expect(cacheLines()).toHaveLength(1)

    // --- Pass 2: a writer with stale in-memory code (no cache comment, so the
    // existing comment can't be located via `search`) must still replace the
    // on-disk comment rather than append a second one. ---
    {
      const content = fs.readFileSync(file, 'utf-8')
      const currentTo = content.lastIndexOf('\n```')
      const { typesCache, patcher } = createInlineTypesCache()
      const meta = { sourceMap: { path: file, from, to: currentTo } } as never
      // Pass the original (comment-free) code to simulate a stale read.
      typesCache.preprocess?.(code, 'ts', {}, meta)
      typesCache.write(code, data as never, 'ts', {}, meta)
      patcher.patch(file)
    }

    expect(cacheLines()).toHaveLength(1)
  })

  it('hits regardless of twoslash options (portable across environments)', () => {
    const code = 'const a: string = "x"'
    const { file, from, to } = createMarkdown(code)
    const data = { nodes: [], code: 'compiled-output' }

    // Seed with one set of options (e.g. machine A, with `paths`).
    {
      const { typesCache, patcher } = createInlineTypesCache()
      const meta = { sourceMap: { path: file, from, to } } as never
      const options = { compilerOptions: { paths: { foo: ['/abs/a'] } } }
      typesCache.preprocess?.(code, 'ts', options as never, meta)
      typesCache.write(code, data as never, 'ts', options as never, meta)
      patcher.patch(file)
    }

    // Read with different options (e.g. machine B / Vercel, without `paths`).
    {
      const { typesCache } = createInlineTypesCache()
      const body = readBody(file, from)
      const meta = { sourceMap: { path: file, from, to } } as never
      const otherOptions = { compilerOptions: {} }
      typesCache.preprocess?.(body, 'ts', otherOptions as never, meta)
      expect(typesCache.read(body, 'ts', otherOptions as never, meta)).toEqual(data)
    }
  })

  it('invalidates the cache when the hash no longer matches', () => {
    const code = 'const a: string = "x"'
    const { file, from, to } = createMarkdown(code)

    // Seed a cache entry.
    {
      const { typesCache, patcher } = createInlineTypesCache()
      const meta = { sourceMap: { path: file, from, to } } as never
      typesCache.preprocess?.(code, 'ts', {}, meta)
      typesCache.write(code, { nodes: [], code: 'x' } as never, 'ts', {}, meta)
      patcher.patch(file)
    }

    // Read with different code -> hash mismatch -> miss.
    {
      const { typesCache } = createInlineTypesCache()
      const body = readBody(file, from)
      const meta = { sourceMap: { path: file, from, to } } as never
      // The body still has the old cache line, but we validate against new code.
      typesCache.preprocess?.(`${body}\nconst b = 2`, 'ts', {}, meta)
      expect(typesCache.read(body, 'ts', {}, meta)).toBeNull()
    }
  })

  it('ignoreCache skips reading existing cache', () => {
    const code = 'const a: string = "x"'
    const { file, from, to } = createMarkdown(code)

    {
      const { typesCache, patcher } = createInlineTypesCache()
      const meta = { sourceMap: { path: file, from, to } } as never
      typesCache.preprocess?.(code, 'ts', {}, meta)
      typesCache.write(code, { nodes: [], code: 'x' } as never, 'ts', {}, meta)
      patcher.patch(file)
    }

    {
      const { typesCache } = createInlineTypesCache({ ignoreCache: true })
      const body = readBody(file, from)
      const meta = { sourceMap: { path: file, from, to } } as never
      typesCache.preprocess?.(body, 'ts', {}, meta)
      expect(typesCache.read(body, 'ts', {}, meta)).toBeNull()
    }
  })

  it('remove mode strips the cache comment from the source', () => {
    const code = 'const a: string = "x"'
    const { file, from, to } = createMarkdown(code)

    {
      const { typesCache, patcher } = createInlineTypesCache()
      const meta = { sourceMap: { path: file, from, to } } as never
      typesCache.preprocess?.(code, 'ts', {}, meta)
      typesCache.write(code, { nodes: [], code: 'x' } as never, 'ts', {}, meta)
      patcher.patch(file)
    }
    expect(fs.readFileSync(file, 'utf-8')).toContain('// @twoslash-cache:')

    {
      const { typesCache, patcher } = createInlineTypesCache({ remove: true })
      const body = readBody(file, from)
      const meta = { sourceMap: { path: file, from, to } } as never
      typesCache.preprocess?.(body, 'ts', {}, meta)
      typesCache.write(body, { nodes: [], code: 'x' } as never, 'ts', {}, meta)
      patcher.patch(file)
    }
    expect(fs.readFileSync(file, 'utf-8')).not.toContain('// @twoslash-cache:')
  })
})
