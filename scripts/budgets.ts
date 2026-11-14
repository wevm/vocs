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
    .filter((name) => !name.startsWith('vocs-corpus-') && !name.endsWith('.css'))
    .map(async (name) => {
      const content = await Fs.readFile(Path.join(assets, name))
      return {
        brotli: Zlib.brotliCompressSync(content).length,
        gzip: Zlib.gzipSync(content).length,
        // Static imports of sibling chunks. Dynamic `import("./…")` calls load later.
        imports: name.endsWith('.js')
          ? Array.from(
              content.toString().matchAll(/\bfrom\s*"\.\/([^"]+)"|\bimport\s*"\.\/([^"]+)"/g),
              (match) => (match[1] ?? match[2])!,
            )
          : [],
        name,
      }
    }),
)
// Every module of the Worker counts, including the chunks it imports on the first render and the
// diagram compiler. The Twoslash type snapshot is content that grows with `twoslash.packages`, so
// it is reported beside the budget.
const workerRoot = Path.join(root, 'vocs_playground_custom')
const workerModules = await Promise.all(
  (await Fs.readdir(workerRoot, { recursive: true }))
    .filter((name) => /\.(js|wasm)$/.test(name))
    .map(async (name) => ({
      gzip: Zlib.gzipSync(await Fs.readFile(Path.join(workerRoot, name))).length,
      name,
    })),
)
const snapshot = workerModules.filter((module) => /^assets\/types-.+\.js$/.test(module.name))
if (snapshot.length !== 1) throw new Error(`${workerRoot} has no Twoslash type snapshot.`)
const worker = workerModules
  .filter((module) => !snapshot.includes(module))
  .reduce((total, module) => total + module.gzip, 0)
const entry = files.find((file) => /^index-.+\.js$/.test(file.name))
if (!entry) throw new Error(`${assets} has no page entry. Build playground/custom first.`)
// The page entry counts with every chunk it imports statically, such as React when the build
// shares it with the islands module.
const loaded = new Set([entry.name])
for (const name of loaded)
  for (const imported of files.find((file) => file.name === name)?.imports ?? [])
    loaded.add(imported)
const page = files.filter((file) => loaded.has(file.name))

// Ondine's compiler module loads only for a page with a diagram, so it has its own budget.
const diagram = files.filter((file) => file.name.startsWith('all.generated-'))
if (diagram.length !== 1) throw new Error(`${assets} has no Ondine compiler module.`)

const budgets = [
  {
    limit: 4_000_000,
    name: 'Agent module and page JavaScript, Brotli',
    size: files
      .filter((file) => !diagram.includes(file))
      .reduce((total, file) => total + file.brotli, 0),
  },
  { limit: 700_000, name: 'Diagram compiler module, Brotli', size: diagram[0]!.brotli },
  { limit: 3_000_000, name: 'Worker bundle without the type snapshot, gzip', size: worker },
  {
    limit: 180_000,
    name: 'Page entry JavaScript with React and Lexical, gzip',
    size: page.reduce((total, file) => total + file.gzip, 0),
  },
]

for (const budget of budgets)
  process.stdout.write(
    `${budget.size > budget.limit ? 'over' : 'ok  '}  ${budget.name}: ${kilobytes(budget.size)} of ${kilobytes(budget.limit)}\n`,
  )
process.stdout.write(
  `      Twoslash type snapshot, gzip, not budgeted: ${kilobytes(snapshot[0]!.gzip)}, so the Worker is ${kilobytes(worker + snapshot[0]!.gzip)}\n`,
)
if (budgets.some((budget) => budget.size > budget.limit)) process.exit(1)

function kilobytes(bytes: number) {
  return `${(bytes / 1000).toFixed(1)} kB`
}
