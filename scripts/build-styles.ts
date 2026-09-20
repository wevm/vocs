import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import ts from 'typescript'

import * as Styles from './styles.ts'

const root = path.resolve(import.meta.dirname, '..')
const source = path.join(root, 'src')
const result = await Styles.compile()

for (const [id, compiled] of Object.entries(result.modules)) {
  const file = id.slice('vocs/'.length)
  const output = path.join(root, 'dist', file.replace(/\.tsx?$/, '.js'))
  await fs.mkdir(path.dirname(output), { recursive: true })
  const transformed = ts.transpileModule(compiled.code, {
    fileName: file,
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSX,
    },
  })
  await fs.writeFile(output, transformed.outputText)
}

await fs.mkdir(path.join(root, 'dist/styles'), { recursive: true })
await fs.writeFile(path.join(root, 'dist/styles/zyzz.css'), Styles.css(result))

const stylesheet = path.join(root, 'dist/styles/index.css')
await fs.writeFile(
  stylesheet,
  (await fs.readFile(path.join(source, 'styles/index.css'), 'utf8')).replace(
    '@import "zyzz/reset.css";',
    '@import "zyzz/reset.css";\n@import "./zyzz.css";',
  ),
)
