import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import ts from 'typescript'
import type { Plugin } from 'vite'
import { Graph } from 'zyzz/compiler'

/** Compile library styles once for packaged output, standalone builds, and tests. */
export async function compile() {
  const root = path.resolve(import.meta.dirname, '..')
  const source = path.join(root, 'src')
  const defaultId = import.meta.resolve('zyzz/default')
  const modules: Record<string, string> = {}
  const imports: Record<string, Record<string, string | null>> = {}

  for (const file of (await fs.readdir(source, { recursive: true })).sort()) {
    if (!/\.[jt]sx?$/.test(file) || /\.(test|generated)\./.test(file)) continue
    const code = await fs.readFile(path.join(source, file), 'utf8')
    if (!/from ['"]zyzz(?:\/[^'"]+)?['"]/.test(code)) continue
    const id = `vocs/${file}`
    modules[id] = code
    imports[id] = {}
    const ast = ts.createSourceFile(file, code, ts.ScriptTarget.Latest)
    for (const statement of ast.statements) {
      if (!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) continue
      const specifier = statement.moduleSpecifier
      if (!specifier || !ts.isStringLiteral(specifier)) continue
      imports[id][specifier.text] = specifier.text === 'zyzz/default' ? defaultId : null
    }
  }

  return Graph.compile({
    modules,
    imports,
    contracts: { [defaultId]: await fs.readFile(new URL(`${defaultId}.zyzz.json`), 'utf8') },
  })
}

export async function vite(): Promise<Plugin> {
  const source = path.resolve(import.meta.dirname, '../src')
  const result = await compile()
  const stylesheet = '\0virtual:vocs/zyzz.css'
  return {
    name: 'vocs:compiled-styles',
    enforce: 'pre',
    resolveId(id) {
      if (id === 'virtual:vocs/zyzz.css') return stylesheet
    },
    load(id) {
      if (id === stylesheet) return css(result)
    },
    transform(_code, id) {
      const relative = path.relative(source, id.split('?', 1)[0] ?? id)
      const compiled = result.modules[`vocs/${relative}`]
      if (compiled) return { code: `${compiled.code}\nimport 'virtual:vocs/zyzz.css'`, map: null }
    },
  }
}

export function css(result: ReturnType<typeof Graph.compile>): string {
  return [
    '@layer reset, vocs_base, vocs_components;',
    result.sharedCss,
    ...Object.values(result.modules).map((module) => module.css),
  ]
    .filter(Boolean)
    .join('\n')
}
