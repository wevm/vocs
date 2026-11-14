/**
 * Checks the size budgets in `.agents/plan.md` against the production build of the custom-mode
 * playground, and exits with code 1 when one is exceeded. Run it after the end-to-end build.
 * @module
 */
import * as Fs from 'node:fs/promises'
import * as Path from 'node:path'
import * as Zlib from 'node:zlib'

const root = Path.resolve(import.meta.dirname, '../playground/custom/dist')
const assets = Path.join(root, 'client/assets')

const files = await Promise.all(
  (await Fs.readdir(assets))
    // The sources snapshot is content, which grows with the sources and loads beside the code.
    .filter((name) => !name.startsWith('vocs-corpus-'))
    .map(async (name) => {
      const content = await Fs.readFile(Path.join(assets, name))
      return {
        brotli: Zlib.brotliCompressSync(content).length,
        gzip: Zlib.gzipSync(content).length,
        name,
      }
    }),
)
const worker = Zlib.gzipSync(await Fs.readFile(Path.join(root, 'vocs_playground_custom/index.js')))
const entry = files.find((file) => /^index-.+\.js$/.test(file.name))
if (!entry) throw new Error(`${assets} has no page entry. Build playground/custom first.`)

const budgets = [
  {
    limit: 4_000_000,
    name: 'Agent module and page JavaScript, Brotli',
    size: files.reduce((total, file) => total + file.brotli, 0),
  },
  { limit: 3_000_000, name: 'Worker bundle, gzip', size: worker.length },
  { limit: 100_000, name: 'Page entry JavaScript with React, gzip', size: entry.gzip },
]

for (const budget of budgets)
  process.stdout.write(
    `${budget.size > budget.limit ? 'over' : 'ok  '}  ${budget.name}: ${kilobytes(budget.size)} of ${kilobytes(budget.limit)}\n`,
  )
if (budgets.some((budget) => budget.size > budget.limit)) process.exit(1)

function kilobytes(bytes: number) {
  return `${(bytes / 1000).toFixed(1)} kB`
}
