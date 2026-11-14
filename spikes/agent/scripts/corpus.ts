/**
 * Writes the spike corpus to `public/corpus.json` as a map of absolute paths to file contents.
 * `fixture` reads `test/fixtures/docs`. `tempo` fetches the first 50 Markdown pages of
 * `tempoxyz/docs` at a pinned commit, which are not committed because the repository has no license.
 * @module
 */
import * as Fs from 'node:fs/promises'
import * as Path from 'node:path'

const source = process.argv[2] ?? 'fixture'
const root = Path.resolve(import.meta.dirname, '..')
const target = Path.join(root, 'public/corpus.json')

const files = await (async () => {
  if (source === 'fixture') {
    const directory = Path.resolve(root, '../../test/fixtures/docs')
    const names = (await Fs.readdir(directory)).sort()
    const entries = await Promise.all(
      names.map(async (name) => [
        `/docs/${name}`,
        await Fs.readFile(Path.join(directory, name), 'utf8'),
      ]),
    )
    return Object.fromEntries(entries)
  }

  if (source === 'tempo') {
    const commit = 'e8f91d41f1e15bdd09da6d70c5f0ca5188b34bdd'
    const headers: Record<string, string> = process.env.GITHUB_TOKEN
      ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
      : {}
    const response = await fetch(
      `https://api.github.com/repos/tempoxyz/docs/git/trees/${commit}?recursive=1`,
      { headers },
    )
    if (!response.ok)
      throw new Error(
        `GitHub returned ${response.status} for the tree. Set GITHUB_TOKEN to raise the rate limit.`,
      )
    const tree = (await response.json()) as { tree: readonly { path: string }[] }
    const paths = tree.tree
      .map((entry) => entry.path)
      .filter((path) => path.startsWith('src/pages/') && /\.mdx?$/.test(path))
      .sort()
      .slice(0, 50)
    const entries = await Promise.all(
      paths.map(async (path) => {
        const response = await fetch(
          `https://raw.githubusercontent.com/tempoxyz/docs/${commit}/${path}`,
        )
        return [`/docs/${path.slice('src/pages/'.length)}`, await response.text()]
      }),
    )
    return Object.fromEntries(entries)
  }

  throw new Error(`Corpus source "${source}" is unknown. Use "fixture" or "tempo".`)
})()

await Fs.mkdir(Path.dirname(target), { recursive: true })
await Fs.writeFile(target, JSON.stringify(files))
process.stdout.write(
  `Wrote ${Object.keys(files).length} files (${JSON.stringify(files).length} bytes) to ${target}\n`,
)
