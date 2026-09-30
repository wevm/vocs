import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import remapping from '@jridgewell/remapping'
import * as ts from 'typescript'
import { Host } from 'zyzz/node'

const root = path.resolve(import.meta.dirname, '..')
const source = path.join(root, 'src')
const output = path.join(root, '.vocs/zyzz')

await using host = await Host.create({
  css: false,
  external: ['~icons/*'],
  outDir: output,
  packageId: 'vocs',
  root: source,
  script: false,
})
await host.build()

const css = await fs.readFile(path.join(output, 'zyzz.css'))
for (const directory of ['src', 'dist']) {
  await fs.mkdir(path.join(root, directory, 'styles'), { recursive: true })
  await fs.writeFile(path.join(root, directory, 'styles/zyzz.css'), css)
}

for (const file of await fs.readdir(source, { recursive: true })) {
  if (!/\.tsx?$/.test(file) || file.includes('.test.') || file.endsWith('.d.ts')) continue
  const original = await fs.readFile(path.join(source, file), 'utf8')
  if (file !== 'styles/zyzz.config.ts' && !original.includes('styles/zyzz.config.js')) continue

  const relative = file.replace(/\.tsx?$/, '.js')
  const filename = path.join(root, 'dist', relative)
  const module = await fs.readFile(path.join(output, file), 'utf8')
  const compiled = ts.transpileModule(module, {
    fileName: `vocs/${file}`,
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ESNext,
      sourceMap: true,
    },
  })
  if (!compiled.sourceMapText) throw new Error(`Missing source map for ${file}`)
  const map = remapping(
    [
      compiled.sourceMapText,
      JSON.parse(await fs.readFile(path.join(output, `${file}.map`), 'utf8')),
    ],
    () => null,
  )
  await fs.mkdir(path.dirname(filename), { recursive: true })
  // Zile development outputs may be symlinks to the original source.
  await fs.rm(filename, { force: true })
  await fs.writeFile(filename, compiled.outputText)
  await fs.writeFile(
    `${filename}.map`,
    JSON.stringify({
      ...map,
      file: path.basename(filename),
      sources: map.sources.map((id) =>
        path.relative(path.dirname(filename), path.join(source, id.replace(/^vocs\//, ''))),
      ),
    }),
  )
}
