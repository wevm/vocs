/** Run with `pnpm exec node --import tsx scripts/bench-highlights.ts`. */

import { spawnSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { arch, cpus, platform } from 'node:os'
import { join } from 'node:path'
import { performance } from 'node:perf_hooks'
import { compile } from '@mdx-js/mdx'
import type { Code, Root } from 'mdast'
import rehypeStringify from 'rehype-stringify'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'
import * as Config from '../src/internal/config.js'
import * as Mdx from '../src/internal/mdx.js'

const samples = 7
const engines = ['shiki', 'highlights'] as const
const themes = { light: 'github-light', dark: 'github-dark-dimmed' } as const

function corpus() {
  const blocks: Code[] = []
  const counts = new Map<string, number>()
  const langs = new Set([
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'bash',
    'sh',
    'css',
    'html',
    'yaml',
    'rust',
    'solidity',
    'go',
  ])
  function walk(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) walk(path)
      else if (/\.mdx?$/.test(entry.name)) {
        const tree = unified().use(remarkParse).parse(readFileSync(path, 'utf8')) as Root
        visit(tree, 'code', (node) => {
          const lang = node.lang ?? ''
          if (
            !langs.has(lang) ||
            !node.value ||
            node.value.length > 4096 ||
            /twoslash|!include/.test(`${node.meta ?? ''}\n${node.value}`)
          )
            return
          const count = counts.get(lang) ?? 0
          if (count >= 12) return
          counts.set(lang, count + 1)
          blocks.push(node)
        })
      }
    }
  }
  walk('site/src/pages')
  return {
    markdown: blocks
      .map((node) => `~~~~~~${node.lang} ${node.meta ?? ''}\n${node.value}\n~~~~~~`)
      .join('\n\n'),
    blocks: blocks.length,
    languages: Object.fromEntries(counts),
  }
}

function median(values: number[]) {
  return [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)] ?? 0
}

const engine = process.argv[2]
if (engine === 'shiki' || engine === 'highlights') {
  const fixture = corpus()
  const [plugin, options] = Mdx.rehypeShiki({ engine, themes, twoslash: false })
  const processor = unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(plugin, options)
    .use(rehypeStringify)
  const start = performance.now()
  let consumed = String(await processor.process(fixture.markdown)).length
  const cold = performance.now() - start
  const rehype: number[] = []
  const mdx: number[] = []
  const config = Config.define({
    checkDeadlinks: false,
    twoslash: false,
    codeHighlight: { engine, langs: [] },
  })
  const compileOptions = Mdx.getCompileOptions('react', config)
  consumed += String(await compile(fixture.markdown, compileOptions)).length
  for (let i = 0; i < samples; i++) {
    let start = performance.now()
    consumed += String(await processor.process(fixture.markdown)).length
    rehype.push(performance.now() - start)
    start = performance.now()
    consumed += String(await compile(fixture.markdown, compileOptions)).length
    mdx.push(performance.now() - start)
  }
  console.log(JSON.stringify({ engine, cold, rehype, mdx, consumed }))
} else {
  // Alternate engines across five fresh processes each; each runs seven warm samples.
  const runs = []
  for (let i = 0; i < 5; i++) {
    for (const engine of i % 2 ? [...engines].reverse() : engines) {
      const result = spawnSync(
        process.execPath,
        ['--import', 'tsx', import.meta.filename, engine],
        { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 },
      )
      if (result.status !== 0) throw new Error(result.stderr || result.stdout)
      runs.push(JSON.parse(result.stdout.trim()))
    }
  }
  const fixture = corpus()
  const summary = Object.fromEntries(
    engines.map((engine) => {
      const results = runs.filter((run) => run.engine === engine)
      return [
        engine,
        {
          coldRehypeMs: median(results.map((run) => run.cold)),
          warmRehypeMs: median(results.map((run) => median(run.rehype))),
          warmMdxMs: median(results.map((run) => median(run.mdx))),
        },
      ]
    }),
  )
  console.log(
    JSON.stringify(
      {
        environment: {
          node: process.version,
          shiki: JSON.parse(
            readFileSync(new URL('../node_modules/shiki/package.json', import.meta.url), 'utf8'),
          ).version,
          highlights: JSON.parse(
            readFileSync(
              new URL('../node_modules/@pierre/highlights/package.json', import.meta.url),
              'utf8',
            ),
          ).version,
          platform: platform(),
          arch: arch(),
          cpu: cpus()[0]?.model,
          cpus: cpus().length,
        },
        fixture: {
          blocks: fixture.blocks,
          bytes: Buffer.byteLength(fixture.markdown),
          languages: fixture.languages,
        },
        methodology:
          'Five fresh processes per engine, alternating order. Seven warm samples per process after one warmup; median of per-process medians. Twoslash checking disabled for both engines. Cold measures first rehype processing including highlighter initialization, excluding shared module imports and corpus extraction.',
        summary,
        runs,
      },
      null,
      2,
    ),
  )
}
