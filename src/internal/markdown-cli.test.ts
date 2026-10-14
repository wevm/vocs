import { execFile } from 'node:child_process'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import { promisify } from 'node:util'
import { expect, test } from 'vitest'

const exec = promisify(execFile)

test('audit CLI honors roots, mode precedence, JSON, and exit codes', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vocs-audit-cli-'))
  try {
    await fs.mkdir(path.join(root, 'src/pages'), { recursive: true })
    await fs.writeFile(
      path.join(root, 'vocs.config.ts'),
      `export default { title: 'Fixture', codeHighlight: { langs: [] }, markdown: { output: { validation: 'fail' } } }`,
    )
    await fs.writeFile(path.join(root, 'src/pages/index.mdx'), '# Hello\n\n<Unknown />')
    for (const [args, environment, expectedCode, expectedSource] of [
      [[], undefined, 1, 'config'],
      [['--validation', 'warn'], undefined, 0, 'cli'],
      [[], 'warn', 0, 'environment'],
      [['--validation', 'fail'], 'warn', 1, 'cli'],
      [['--validation', 'skip'], undefined, 2, undefined],
    ] as const) {
      const env = { ...process.env }
      delete env['VOCS_MARKDOWN_VALIDATION']
      if (environment) env['VOCS_MARKDOWN_VALIDATION'] = environment
      let code = 0
      let stdout = ''
      let stderr = ''
      try {
        const result = await exec(
          process.execPath,
          [
            '--import',
            import.meta.resolve('tsx'),
            path.resolve(import.meta.dirname, '../cli.ts'),
            'markdown-audit',
            root,
            '--json',
            ...args,
          ],
          { env },
        )
        stdout = result.stdout
        stderr = result.stderr
      } catch (error) {
        const result = error as { code: number; stdout: string; stderr: string }
        code = result.code
        stdout = result.stdout
        stderr = result.stderr
      }
      expect(code, stderr).toBe(expectedCode)
      const report = JSON.parse(stdout || stderr)
      if (expectedCode !== 2) {
        expect(report.validationSource).toBe(expectedSource)
        expect(report.diagnostics).toEqual([
          expect.objectContaining({ rule: 'unhandled-component', component: 'Unknown', file: '/' }),
        ])
      } else expect(report.error).toContain('Expected warn or fail')
    }
  } finally {
    await fs.rm(root, { force: true, recursive: true })
  }
}, 30_000)
