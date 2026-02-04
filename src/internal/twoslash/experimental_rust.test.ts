import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'

const require = createRequire(import.meta.url)

function getBinaryPath(): string | null {
  try {
    const pkg = require('@vocs/twoslash-rust') as { getBinaryPath(): string }
    const path = pkg.getBinaryPath()
    return existsSync(path) ? path : null
  } catch {
    return null
  }
}

const binaryPath = getBinaryPath()
const describeFn = binaryPath ? describe : describe.skip

// Deterministic target dir caches compiled deps across test runs and processes
const sharedTargetDir = join(tmpdir(), 'vocs-twoslash-rust-target')
mkdirSync(sharedTargetDir, { recursive: true })

function runTwoslash(code: string) {
  if (!binaryPath) throw new Error('Binary path not available')
  const result = spawnSync(binaryPath, ['--target-dir', sharedTargetDir], {
    input: code,
    encoding: 'utf8',
  })
  if (result.status !== 0) throw new Error(result.stderr)
  return JSON.parse(result.stdout)
}

describeFn('experimental_rust', { timeout: 30_000 }, () => {
  test('getBinaryPath resolves to vendored binary', () => {
    expect(binaryPath).toMatch(/twoslash-rust\/target\/release\/twoslash-rust$/)
  })

  test('processes simple Rust code and returns type info', () => {
    const output = runTwoslash('fn main() { let x = 42; }')

    expect(output.code).toMatchInlineSnapshot(`"fn main() { let x = 42; }"`)
    expect(output.extension).toMatchInlineSnapshot(`".rs"`)

    const xHover = output.staticQuickInfos.find(
      (info: { targetString: string }) => info.targetString === 'x',
    )
    expect(xHover.text).toMatchInlineSnapshot(`"let x: i32"`)
  })

  test('processes query annotations', () => {
    const output = runTwoslash(`fn main() {
    let x = 42;
//      ^?
}`)

    expect(output.queries).toMatchInlineSnapshot(`
      [
        {
          "kind": "query",
          "length": 1,
          "line": 2,
          "offset": 8,
          "start": 20,
          "text": "let x: i32",
        },
      ]
    `)
  })
})
