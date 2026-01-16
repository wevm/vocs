import { spawnSync } from 'node:child_process'
import * as crypto from 'node:crypto'
import * as node_fs from 'node:fs'
import { createRequire } from 'node:module'
import * as path from 'node:path'
import {
  createTransformerFactory,
  type TwoslashRenderer,
  type TwoslashShikiFunction,
  type TwoslashShikiReturn,
} from '@shikijs/twoslash/core'
import type { ShikiTransformer } from '@shikijs/types'
import type { LanguageRegistration } from 'shiki'
import rustLang from 'shiki/langs/rust.mjs'
import tomlLang from 'shiki/langs/toml.mjs'

import * as Renderer from './renderer.js'
import { rustMarkdownPatterns } from './renderer.js'

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

let resolvedBinaryPath: string | null | undefined
let binaryAvailable: boolean | undefined

function getBinaryPath(): string | null {
  if (resolvedBinaryPath !== undefined) return resolvedBinaryPath

  try {
    // Use createRequire for ESM compatibility
    const esmRequire = createRequire(import.meta.url)
    const pkg = esmRequire('@vocs/twoslash-rust') as { getBinaryPath(): string }
    resolvedBinaryPath = pkg.getBinaryPath()
    return resolvedBinaryPath
  } catch {}

  resolvedBinaryPath = findInPath('rust-twoslash')
  return resolvedBinaryPath
}

function findInPath(binaryName: string): string | null {
  try {
    const command = process.platform === 'win32' ? 'where' : 'which'
    const result = spawnSync(command, [binaryName], {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    })
    const binaryPath = result.stdout?.trim().split('\n')[0]
    if (binaryPath) return binaryPath
  } catch {}
  return null
}

function checkBinaryAvailable(binaryPath: string | null): boolean {
  if (binaryAvailable !== undefined) return binaryAvailable

  if (!binaryPath) {
    binaryAvailable = false
    console.warn(
      `[vocs] rust-twoslash binary not found. Rust twoslash code blocks will be skipped.\n` +
        `Install with: pnpm add @vocs/twoslash-rust\n`,
    )
    return false
  }

  try {
    const result = spawnSync(binaryPath, ['--help'], {
      encoding: 'utf8',
      timeout: 5000,
    })
    binaryAvailable = result.status === 0 || result.status === null
  } catch {
    binaryAvailable = false
  }

  if (!binaryAvailable) {
    console.warn(
      `[vocs] rust-twoslash binary found but not working. Rust twoslash code blocks will be skipped.\n`,
    )
  }

  return binaryAvailable
}

/**
 * Parse twoslash directives from code.
 * Returns an object with directive values.
 */
function parseDirectives(code: string): { noErrors: boolean } {
  const noErrors = /^\s*\/\/\s*@noErrors\b/m.test(code)
  return { noErrors }
}

const DIRECTIVE_PATTERN = /^\s*\/\/\s*@noErrors\b/

interface RemovedLine {
  line: number
  startOffset: number
  length: number
}

/**
 * Find directive lines that will be removed, with their character offsets.
 */
function findDirectiveLines(code: string): RemovedLine[] {
  const result: RemovedLine[] = []
  const lines = code.split('\n')
  let offset = 0
  for (const [i, line] of lines.entries()) {
    if (DIRECTIVE_PATTERN.test(line)) {
      result.push({ line: i, startOffset: offset, length: line.length + 1 })
    }
    offset += line.length + 1
  }
  return result
}

/**
 * Remove twoslash directive lines from code output.
 */
function stripDirectives(code: string): string {
  return code
    .split('\n')
    .filter((line) => !DIRECTIVE_PATTERN.test(line))
    .join('\n')
}

/**
 * Adjust a line number based on removed directive lines.
 */
function adjustLine(line: number, removed: RemovedLine[]): number {
  let offset = 0
  for (const r of removed) {
    if (r.line < line) offset++
    else break
  }
  return line - offset
}

/**
 * Adjust a character offset based on removed directive lines.
 */
function adjustStart(start: number, removed: RemovedLine[]): number {
  let offset = 0
  for (const r of removed) {
    if (r.startOffset < start) offset += r.length
    else break
  }
  return start - offset
}

/**
 * Compute line and character from a start offset in the code.
 */
function getLineAndCharacter(code: string, start: number): { line: number; character: number } {
  let line = 0
  let lineStart = 0
  for (let i = 0; i < start && i < code.length; i++) {
    if (code[i] === '\n') {
      line++
      lineStart = i + 1
    }
  }
  return { line, character: start - lineStart }
}

/**
 * Convert twoslash-rust legacy format to twoslash-protocol nodes.
 *
 * twoslash-rust returns data in the @typescript/twoslash legacy format:
 * - staticQuickInfos → NodeHover[]
 * - queries → NodeQuery[] | NodeCompletion[]
 * - errors → NodeError[]
 */
function convertLegacyToNodes(
  result: TwoslashRustResult,
  options: { noErrors?: boolean; removedLines?: RemovedLine[] } = {},
): TwoslashNode[] {
  const nodes: TwoslashNode[] = []
  const removed = options.removedLines ?? []

  for (const info of result.staticQuickInfos ?? []) {
    const node: NodeHover = {
      type: 'hover',
      start: adjustStart(info.start, removed),
      length: info.length,
      line: adjustLine(info.line, removed),
      character: info.character,
      target: info.targetString,
      text: info.text,
      docs: info.docs,
    }
    nodes.push(node)
  }

  // Compute positions in the stripped code (after removing directive lines)
  const strippedCode = stripDirectives(result.code)

  for (const query of result.queries ?? []) {
    // The rust-twoslash binary returns query.line pointing to the ^? comment line,
    // not the target token line. We need to compute the correct line from the start offset.
    const adjustedStart = adjustStart(query.start, removed)
    const { line: computedLine, character: computedCharacter } = getLineAndCharacter(
      strippedCode,
      adjustedStart,
    )

    if (query.kind === 'completions' && query.completions) {
      const node: NodeCompletion = {
        type: 'completion',
        start: adjustedStart,
        length: query.length,
        line: computedLine,
        character: computedCharacter,
        completions: query.completions.map((c) => ({
          name: c.name,
          kind: c.kind !== undefined ? String(c.kind) : undefined,
        })),
        completionsPrefix: query.completionsPrefix ?? '',
      }
      nodes.push(node)
    } else {
      const node: NodeQuery = {
        type: 'query',
        start: adjustedStart,
        length: query.length,
        line: computedLine,
        character: computedCharacter,
        target: query.text ?? '',
        text: query.text ?? '',
        docs: query.docs,
      }
      nodes.push(node)
    }
  }

  if (!options.noErrors) {
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
  const cacheDir = options.cacheDir ? path.resolve(options.cacheDir, 'twoslash-rust') : undefined
  const cargoTomlPath = options.cargoToml ? path.resolve(options.cargoToml) : undefined
  // Use a shared target directory to cache compiled deps across runs
  const targetDir = cacheDir ? path.join(cacheDir, 'target') : undefined
  const cacheOnly = options.cacheOnly ?? false

  // Validate cargoToml exists if provided
  if (cargoTomlPath && !node_fs.existsSync(cargoTomlPath)) {
    console.warn(
      `[vocs] Cargo.toml not found at ${cargoTomlPath}. Rust twoslash will use defaults.`,
    )
  }

  // Resolve binary path once at initialization
  const binaryPath = getBinaryPath()
  const isAvailable = checkBinaryAvailable(binaryPath)

  return ((code: string, lang?: string): TwoslashShikiReturn => {
    // Parse twoslash directives and find lines to remove
    const directives = parseDirectives(code)
    const removedLines = findDirectiveLines(code)

    // Use only code for cache key (cargoToml affects runtime but shouldn't change cache key)
    const cacheInput = code
    const cacheKey = cacheDir
      ? crypto.createHash('md5').update(cacheInput).digest('hex').slice(0, 12)
      : null
    const cachePath = cacheKey && cacheDir ? path.join(cacheDir, `${cacheKey}.json`) : null

    console.log(
      `[vocs] rust-twoslash: binaryPath=${binaryPath}, cacheDir=${cacheDir}, cachePath=${cachePath}, exists=${cachePath ? node_fs.existsSync(cachePath) : false}`,
    )

    if (cachePath && node_fs.existsSync(cachePath)) {
      try {
        const cached = JSON.parse(node_fs.readFileSync(cachePath, 'utf-8')) as TwoslashRustResult
        const ext = cached.extension?.replace(/^\./, '') ?? lang
        const cachedResult = {
          code: stripDirectives(cached.code),
          nodes: convertLegacyToNodes(cached, { ...directives, removedLines }),
          meta: ext ? { extension: ext } : undefined,
        }
        const codePreview = code.length > 60 ? `${code.slice(0, 60)}...` : code
        console.log(`[vocs] rust-twoslash: cache hit for "${codePreview.replace(/\n/g, '\\n')}"`)
        return cachedResult as TwoslashShikiReturn
      } catch {
        console.log('[vocs] rust-twoslash: cache miss')
      }
    }

    // In cache-only mode or binary unavailable, skip twoslash analysis and return stripped code
    if (cacheOnly || !isAvailable || !binaryPath) {
      return { code: stripDirectives(code), nodes: [] }
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
      code: stripDirectives(parsed.code),
      nodes: convertLegacyToNodes(parsed, { ...directives, removedLines }),
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
 * Requires: `pnpm add @vocs/twoslash-rust`
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
  const factory = (injected?: { cacheDir?: string | undefined }) => {
    const {
      explicitTrigger = true,
      renderer = Renderer.rich({ markdownPatterns: rustMarkdownPatterns }),
      throws = false,
    } = options
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

  factory.langs = [...(rustLang as LanguageRegistration[]), ...(tomlLang as LanguageRegistration[])]

  return factory
}

export declare namespace experimental_rust {
  export type Options = {
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
     * When true, only return cached results and skip twoslash analysis.
     * Useful for faster builds when cache is pre-populated.
     * @default false
     */
    cacheOnly?: boolean | undefined
    /**
     * Whether to require explicit `twoslash` trigger in code block meta.
     * @default true
     */
    explicitTrigger?: boolean | undefined
    /**
     * Custom renderer for twoslash nodes.
     */
    renderer?: TwoslashRenderer | undefined
    /**
     * Whether to throw on twoslash errors.
     * @default false
     */
    throws?: boolean | undefined
  }

  export type ReturnType = ((options?: { cacheDir?: string | undefined }) => ShikiTransformer) & {
    langs: LanguageRegistration[]
  }
}
