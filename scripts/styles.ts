/**
 * Compiles the zyzz styles of the built package ahead of time. It runs after `zile`: the zyzz
 * compiler rewrites each module in `dist` to apply precompiled class names, and writes the
 * stylesheet. The package then ships `dist/styles.css`, the default theme, and `dist/tokens.css`,
 * the default values of the public `--vocs-*` properties. Hosts need no zyzz setup.
 * @module
 */
import * as ChildProcess from 'node:child_process'
import * as Fs from 'node:fs/promises'
import * as Os from 'node:os'
import * as Path from 'node:path'
import * as Url from 'node:url'

const root = Path.resolve(import.meta.dirname, '..')
const dist = Path.join(root, 'dist')
const out = await Fs.mkdtemp(Path.join(Os.tmpdir(), 'vocs-zyzz-'))

try {
  ChildProcess.execFileSync(
    'pnpm',
    ['exec', 'zyzz', 'build', dist, '--out-dir', out, '--package-id', 'vocs', '--minify'],
    { cwd: root, stdio: ['ignore', 'ignore', 'inherit'] },
  )

  for await (const file of Fs.glob('**/*.js{,.map}', { cwd: out }))
    await Fs.copyFile(Path.join(out, file), Path.join(dist, file))

  const css = await Fs.readFile(Path.join(out, 'zyzz.css'), 'utf8')
  await Fs.writeFile(Path.join(dist, 'styles.css'), css)

  // Each theme variable reads a public property with its default as the fallback. Dark defaults
  // sit in `prefers-color-scheme` blocks.
  const dark = /@media \(prefers-color-scheme:dark\)\{([^@]*?\})\}/g
  const tokens = (text: string) =>
    new Map(
      [...text.matchAll(/--z-vocs-[\w-]+:var\((--vocs-[\w-]+),([^;}]+)\)/g)].map(
        (match) => [match[1]!, match[2]!] as const,
      ),
    )
  // The render route's markup reads the code token colors, so their defaults come from the built
  // highlighter, not from the stylesheet.
  const highlight: { tokens: Record<string, string> } = await import(
    Url.pathToFileURL(Path.join(dist, 'internal/Highlight.js')).href
  )
  const light = new Map([
    ...tokens(css.replace(dark, '')),
    ...Object.entries(highlight.tokens).map(
      ([name, value]) => [`--vocs-code-${name}`, value] as const,
    ),
  ])
  const darkTokens = tokens([...css.matchAll(dark)].map((match) => match[1]).join(''))
  if (light.size === 0) throw new Error('The compiled stylesheet has no `--vocs-*` tokens.')
  const block = (entries: Map<string, string>) =>
    `:root{${[...entries].map(([name, value]) => `${name}:${value}`).join(';')}}`
  await Fs.writeFile(
    Path.join(dist, 'tokens.css'),
    `@layer vocs{${block(light)}@media (prefers-color-scheme:dark){${block(darkTokens)}}}\n`,
  )
} finally {
  await Fs.rm(out, { force: true, recursive: true })
}
