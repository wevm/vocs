import { spawnSync } from 'node:child_process'
import * as crypto from 'node:crypto'
import * as node_fs from 'node:fs'
import * as path from 'node:path'
import {
  createTransformerFactory,
  type TwoslashShikiFunction,
  type TwoslashShikiReturn,
} from '@shikijs/twoslash/core'
import type { ShikiTransformer } from '@shikijs/types'

import * as Renderer from './renderer.js'

interface Position {
  line: number
  character: number
}

interface NodeBase extends Position {
  start: number
  length: number
}

interface NodeHover extends NodeBase {
  type: 'hover'
  target: string
  text: string
  docs?: string | undefined
  tags?: [name: string, text: string | undefined][] | undefined
}

interface NodeQuery extends Omit<NodeHover, 'type'> {
  type: 'query'
}

interface NodeCompletion extends NodeBase {
  type: 'completion'
  completions: Array<{ name: string; kind?: string | undefined }>
  completionsPrefix: string
}

interface NodeError extends NodeBase {
  type: 'error'
  id?: string | undefined
  level?: 'warning' | 'error' | 'suggestion' | 'message' | undefined
  code?: number | string | undefined
  text: string
  filename?: string | undefined
}

type TwoslashNode = NodeHover | NodeQuery | NodeCompletion | NodeError

const DEFAULT_BINARY = 'rust-twoslash'

let binaryChecked = false
let binaryAvailable = false

function checkBinaryAvailable(binaryPath: string): boolean {
  if (binaryChecked) return binaryAvailable

  try {
    const result = spawnSync(binaryPath, ['--help'], {
      encoding: 'utf8',
      timeout: 5000,
    })
    binaryAvailable = result.status === 0 || result.status === null
  } catch {
    binaryAvailable = false
  }

  binaryChecked = true

  if (!binaryAvailable) {
    console.warn(
      `[vocs] rust-twoslash binary not found. Rust twoslash code blocks will be skipped.\n` +
        `Install with: cargo install rust-twoslash --git https://github.com/wevm/twoslash-rust --locked\n`,
    )
  }

  return binaryAvailable
}

/**
 * Convert twoslash-rust legacy format to twoslash-protocol nodes.
 *
 * twoslash-rust returns data in the @typescript/twoslash legacy format:
 * - staticQuickInfos → NodeHover[]
 * - queries → NodeQuery[] | NodeCompletion[]
 * - errors → NodeError[]
 */
function convertLegacyToNodes(result: TwoslashRustResult): TwoslashNode[] {
  const nodes: TwoslashNode[] = []

  for (const info of result.staticQuickInfos ?? []) {
    const node: NodeHover = {
      type: 'hover',
      start: info.start,
      length: info.length,
      line: info.line,
      character: info.character,
      target: info.targetString,
      text: info.text,
      docs: info.docs,
    }
    nodes.push(node)
  }

  for (const query of result.queries ?? []) {
    if (query.kind === 'completions' && query.completions) {
      const node: NodeCompletion = {
        type: 'completion',
        start: query.start,
        length: query.length,
        line: query.line,
        character: query.offset,
        completions: query.completions.map((c) => ({
          name: c.name,
          kind: c.kind !== undefined ? String(c.kind) : undefined,
        })),
        completionsPrefix: query.completionsPrefix ?? '',
      }
      nodes.push(node)
    } else {
      // The rust-twoslash binary returns query.line as the line of the ^? comment,
      // but the shiki-twoslash transformer expects the line of the token being queried
      // (which is the previous line, since ^? always refers to the line above it).
      const node: NodeQuery = {
        type: 'query',
        start: query.start,
        length: query.length,
        line: query.line - 1,
        character: query.offset,
        target: query.text ?? '',
        text: query.text ?? '',
        docs: query.docs,
      }
      nodes.push(node)
    }
  }

  for (const error of result.errors ?? []) {
    const node: NodeError = {
      type: 'error',
      start: error.start ?? 0,
      length: error.length ?? 0,
      line: error.line ?? 0,
      character: error.character ?? 0,
      text: error.renderedMessage,
      code: error.code,
      level: categoryToLevel(error.category),
    }
    nodes.push(node)
  }

  return nodes
}

function categoryToLevel(category: number): NodeError['level'] {
  switch (category) {
    case 0:
      return 'warning'
    case 1:
      return 'error'
    case 2:
      return 'suggestion'
    case 3:
      return 'message'
    default:
      return 'error'
  }
}

interface TwoslashRustResult {
  code: string
  extension?: string
  staticQuickInfos?: Array<{
    targetString: string
    text: string
    docs?: string
    start: number
    length: number
    line: number
    character: number
  }>
  queries?: Array<{
    kind: 'query' | 'completions'
    line: number
    offset: number
    text?: string
    docs?: string
    start: number
    length: number
    completions?: Array<{ name: string; kind?: number }>
    completionsPrefix?: string
  }>
  errors?: Array<{
    renderedMessage: string
    id?: string
    category: number
    code: number
    start?: number
    length?: number
    line?: number
    character?: number
  }>
}

export function createRustTwoslasher(options: experimental_rust.Options) {
  const binaryPath = options.binaryPath ?? DEFAULT_BINARY
  const cacheDir = options.cacheDir ? path.resolve(options.cacheDir, 'twoslash-rust') : undefined
  const cargoTomlPath = options.cargoToml ? path.resolve(options.cargoToml) : undefined
  // Use a shared target directory to cache compiled deps across runs
  const targetDir = cacheDir ? path.join(cacheDir, 'target') : undefined

  if (cacheDir) {
    node_fs.mkdirSync(cacheDir, { recursive: true })
  }

  // Validate cargoToml exists if provided
  if (cargoTomlPath && !node_fs.existsSync(cargoTomlPath)) {
    console.warn(
      `[vocs] Cargo.toml not found at ${cargoTomlPath}. Rust twoslash will use defaults.`,
    )
  }

  return ((code: string, lang?: string): TwoslashShikiReturn => {
    if (!checkBinaryAvailable(binaryPath)) {
      return { code, nodes: [] }
    }

    // Include cargoToml path in cache key if provided
    const cacheInput = cargoTomlPath ? `${cargoTomlPath}:${code}` : code
    const cacheKey = cacheDir
      ? crypto.createHash('md5').update(cacheInput).digest('hex').slice(0, 12)
      : null
    const cachePath = cacheKey && cacheDir ? path.join(cacheDir, `${cacheKey}.json`) : null

    console.log(
      `[vocs] rust-twoslash: cacheDir=${cacheDir}, cachePath=${cachePath}, exists=${cachePath ? node_fs.existsSync(cachePath) : false}`,
    )

    if (cachePath && node_fs.existsSync(cachePath)) {
      try {
        const cached = JSON.parse(node_fs.readFileSync(cachePath, 'utf-8')) as TwoslashRustResult
        const ext = cached.extension?.replace(/^\./, '') ?? lang
        const cachedResult = {
          code: cached.code,
          nodes: convertLegacyToNodes(cached),
          meta: ext ? { extension: ext } : undefined,
        }
        const codePreview = code.length > 60 ? `${code.slice(0, 60)}...` : code
        console.log(`[vocs] rust-twoslash: cache hit for "${codePreview.replace(/\n/g, '\\n')}"`)
        return cachedResult as TwoslashShikiReturn
      } catch {
        // Cache read failed, continue with fresh analysis
      }
    }

    // Build args for the binary
    const args: string[] = []
    if (cargoTomlPath && node_fs.existsSync(cargoTomlPath)) {
      args.push('--cargo-toml', cargoTomlPath)
    }
    if (targetDir) {
      args.push('--target-dir', targetDir)
    }

    const codePreview = code.length > 60 ? `${code.slice(0, 60)}...` : code
    console.log(`[vocs] rust-twoslash: compiling "${codePreview.replace(/\n/g, '\\n')}"`)
    const startTime = performance.now()

    const spawnResult = spawnSync(binaryPath, args, {
      input: code,
      encoding: 'utf8',
      timeout: 300000, // 5 minutes - Rust twoslash needs time for cargo check + rust-analyzer
    })

    const elapsed = Math.round(performance.now() - startTime)
    console.log(`[vocs] rust-twoslash: completed in ${elapsed}ms`)

    if (spawnResult.error) {
      console.error('[vocs] rust-twoslash error:', spawnResult.error.message)
      return { code, nodes: [] }
    }

    if (spawnResult.status !== 0) {
      console.error('[vocs] rust-twoslash failed:', spawnResult.stderr)
      return { code, nodes: [] }
    }

    let parsed: TwoslashRustResult
    try {
      parsed = JSON.parse(spawnResult.stdout)
    } catch {
      console.error('[vocs] rust-twoslash returned invalid JSON:', spawnResult.stdout.slice(0, 200))
      return { code, nodes: [] }
    }

    if (cachePath) {
      try {
        node_fs.writeFileSync(cachePath, JSON.stringify(parsed), 'utf-8')
      } catch {
        // Cache write failed, ignore
      }
    }

    const ext = parsed.extension?.replace(/^\./, '') ?? lang
    const twoslashResult = {
      code: parsed.code,
      nodes: convertLegacyToNodes(parsed),
      meta: ext ? { extension: ext } : undefined,
    }
    return twoslashResult as TwoslashShikiReturn
  }) as TwoslashShikiFunction
}

/**
 * Shiki transformer for Rust Twoslash code blocks.
 *
 * Uses the rust-twoslash binary to provide TypeScript-like hover information
 * and type hints for Rust code blocks.
 *
 * Requires: `cargo install rust-twoslash --git https://github.com/wevm/twoslash-rust --locked`
 *
 * @example
 * ```ts
 * import { Twoslash, defineConfig } from 'vocs/config'
 *
 * export default defineConfig({
 *   twoslash: {
 *     transformers: [
 *       Twoslash.experimental_rust({ cargoToml: './Cargo.toml' }),
 *     ],
 *   },
 * })
 * ```
 */
export function experimental_rust(
  options: experimental_rust.Options = {},
): experimental_rust.ReturnType {
  return (injected) => {
    const { explicitTrigger = true, renderer = Renderer.rich(), throws = false } = options
    const cacheDir = options.cacheDir ?? injected?.cacheDir

    const twoslasher = createRustTwoslasher({ ...options, cacheDir })

    return createTransformerFactory(
      twoslasher,
      renderer,
    )({
      explicitTrigger,
      langs: ['rust', 'rs'],
      onShikiError() {},
      onTwoslashError() {},
      throws,
    })
  }
}

export declare namespace experimental_rust {
  export type Options = {
    /**
     * Path to the rust-twoslash binary.
     * @default 'rust-twoslash'
     */
    binaryPath?: string | undefined
    /**
     * Path to a Cargo.toml file to use as template for all Rust twoslash blocks.
     * This allows you to specify dependencies, features, and other Cargo settings
     * in one place instead of inline annotations.
     *
     * @example './docs/twoslash/Cargo.toml'
     */
    cargoToml?: string | undefined
    /**
     * Directory for caching twoslash results.
     */
    cacheDir?: string | undefined
    /**
     * Whether to require explicit `twoslash` trigger in code block meta.
     * @default true
     */
    explicitTrigger?: boolean | undefined
    /**
     * Custom renderer for twoslash nodes.
     */
    renderer?: import('@shikijs/twoslash/core').TwoslashRenderer | undefined
    /**
     * Whether to throw on twoslash errors.
     * @default false
     */
    throws?: boolean | undefined
  }

  export type ReturnType = (options?: { cacheDir?: string | undefined }) => ShikiTransformer
}
