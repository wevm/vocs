import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import rehypeStringify from 'rehype-stringify'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { describe, expect, it } from 'vitest'
import { rehypeImageSize } from './rehype-image-size.js'

function createTestConfig(rootDir: string) {
  return {
    rootDir,
    srcDir: 'src',
    pagesDir: 'pages',
  } as Parameters<typeof rehypeImageSize>[0]
}

describe('rehypeImageSize', () => {
  it('adds width and height to local images', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vocs-test-'))
    const publicDir = path.join(tmpDir, 'public')
    fs.mkdirSync(publicDir)

    // Create a minimal 100x50 PNG (header contains dimensions)
    const pngData = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44,
      0x52, 0x00, 0x00, 0x00, 0x64, 0x00, 0x00, 0x00, 0x32, 0x08, 0x06, 0x00, 0x00, 0x00, 0xff,
      0x80, 0x02, 0x03, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ])
    fs.writeFileSync(path.join(publicDir, 'test.png'), pngData)

    const config = createTestConfig(tmpDir)
    const processor = unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(rehypeImageSize(config))
      .use(rehypeStringify)

    const result = await processor.process({
      value: '![test](/test.png)',
      path: path.join(tmpDir, 'src/pages/test.mdx'),
    })

    expect(String(result)).toMatchInlineSnapshot(
      `"<p><img src="/test.png" alt="test" width="100" height="50"></p>"`,
    )

    fs.rmSync(tmpDir, { recursive: true })
  })

  it('skips external images', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vocs-test-'))
    const config = createTestConfig(tmpDir)
    const processor = unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(rehypeImageSize(config))
      .use(rehypeStringify)

    const result = await processor.process({
      value: '![external](https://example.com/image.png)',
      path: path.join(tmpDir, 'src/pages/test.mdx'),
    })

    expect(String(result)).toMatchInlineSnapshot(
      `"<p><img src="https://example.com/image.png" alt="external"></p>"`,
    )

    fs.rmSync(tmpDir, { recursive: true })
  })

  it('skips data URIs', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vocs-test-'))
    const config = createTestConfig(tmpDir)
    const processor = unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(rehypeImageSize(config))
      .use(rehypeStringify)

    const result = await processor.process({
      value: '![data](data:image/png;base64,abc123)',
      path: path.join(tmpDir, 'src/pages/test.mdx'),
    })

    expect(String(result)).toMatchInlineSnapshot(
      `"<p><img src="data:image/png;base64,abc123" alt="data"></p>"`,
    )

    fs.rmSync(tmpDir, { recursive: true })
  })

  it('handles missing images gracefully', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vocs-test-'))
    const config = createTestConfig(tmpDir)
    const processor = unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(rehypeImageSize(config))
      .use(rehypeStringify)

    const result = await processor.process({
      value: '![missing](/missing.png)',
      path: path.join(tmpDir, 'src/pages/test.mdx'),
    })

    expect(String(result)).toMatchInlineSnapshot(`"<p><img src="/missing.png" alt="missing"></p>"`)

    fs.rmSync(tmpDir, { recursive: true })
  })
})
