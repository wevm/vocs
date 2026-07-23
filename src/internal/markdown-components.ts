import * as fs from 'node:fs'
import * as path from 'node:path'
import { pathToFileURL } from 'node:url'
import type * as Estree from 'estree'
import type * as MdAst from 'mdast'
import { toMarkdown } from 'mdast-util-to-markdown'
import remarkMdx from 'remark-mdx'
import remarkParse from 'remark-parse'
import { tsImport } from 'tsx/esm/api'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'

type MdxEsm = MdAst.RootContent & {
  data?: { estree?: Estree.Program }
  type: 'mdxjsEsm'
}

type MdxJsxElement = MdAst.RootContent & {
  attributes?: unknown[]
  children?: MdAst.RootContent[]
  name?: string | null
  type: 'mdxJsxFlowElement'
}

type ComponentImport = {
  exportName: string
  source: string
}

type Replacement = {
  end: number
  start: number
  value: string
}

type MarkdownComponent = {
  toMarkdown?: () =>
    | MdAst.RootContent
    | MdAst.RootContent[]
    | Promise<MdAst.RootContent | MdAst.RootContent[]>
}

/** Replaces standalone MDX components with their Markdown representations. */
export async function inlineMarkdownComponents(source: string, filePath: string) {
  let tree: MdAst.Root
  try {
    tree = unified().use(remarkParse).use(remarkMdx).parse(source)
  } catch {
    return source
  }

  const imports = getComponentImports(tree)
  const replacements: Replacement[] = []

  const components: MdxJsxElement[] = []
  visit(tree, 'mdxJsxFlowElement', (node) => {
    if (isStaticMdxComponent(node)) components.push(node)
  })

  for (const node of components) {
    if (!node.name) continue

    const componentImport = imports.get(node.name)
    if (!componentImport) continue

    const component = await loadComponent(componentImport, filePath)
    if (!component?.toMarkdown) continue

    const markdown = await component.toMarkdown()
    const nodes = Array.isArray(markdown) ? markdown : [markdown]
    if (!nodes.every((node) => node && typeof node.type === 'string'))
      throw new TypeError(`${node.name}.toMarkdown must return a Markdown node or array of nodes.`)

    const replacement = toReplacement(node, toMarkdown({ type: 'root', children: nodes }))
    if (replacement) replacements.push(replacement)
  }

  return applyReplacements(source, replacements)
}

function getComponentImports(tree: MdAst.Root) {
  const imports = new Map<string, ComponentImport>()

  visit(tree, 'mdxjsEsm', (node) => {
    const declarations = (node as MdxEsm).data?.estree?.body.filter(
      (statement): statement is Estree.ImportDeclaration => statement.type === 'ImportDeclaration',
    )
    if (!declarations) return

    for (const declaration of declarations) {
      if (typeof declaration.source.value !== 'string') continue
      for (const specifier of declaration.specifiers) {
        if (specifier.type === 'ImportDefaultSpecifier')
          imports.set(specifier.local.name, {
            exportName: 'default',
            source: declaration.source.value,
          })
        if (specifier.type === 'ImportSpecifier' && specifier.imported.type === 'Identifier')
          imports.set(specifier.local.name, {
            exportName: specifier.imported.name,
            source: declaration.source.value,
          })
      }
    }
  })

  return imports
}

function isStaticMdxComponent(node: MdAst.RootContent): node is MdxJsxElement {
  if (node.type !== 'mdxJsxFlowElement') return false
  if (!node.name || !/^[A-Z][A-Za-z0-9_$]*$/.test(node.name)) return false
  return node.attributes.length === 0 && node.children.length === 0
}

async function loadComponent(componentImport: ComponentImport, filePath: string) {
  try {
    const module = await tsImport(resolveComponentImport(componentImport.source, filePath), {
      parentURL: pathToFileURL(filePath).href,
    })
    const exports =
      'default' in module && typeof module.default === 'object' ? module.default : module
    return exports[componentImport.exportName] as MarkdownComponent | undefined
  } catch {
    return undefined
  }
}

function resolveComponentImport(source: string, filePath: string) {
  if (!source.startsWith('.') && !path.isAbsolute(source)) return source

  const resolved = path.isAbsolute(source) ? source : path.resolve(path.dirname(filePath), source)
  const candidates = [
    resolved,
    ...['.cjs', '.cts', '.js', '.jsx', '.mjs', '.mts', '.ts', '.tsx'].map(
      (extension) => `${resolved}${extension}`,
    ),
    ...[
      'index.cjs',
      'index.cts',
      'index.js',
      'index.jsx',
      'index.mjs',
      'index.mts',
      'index.ts',
      'index.tsx',
    ].map((file) => path.join(resolved, file)),
  ]

  const resolvedPath = candidates.find((candidate) => fs.existsSync(candidate))
  return resolvedPath ?? source
}

function toReplacement(node: MdAst.RootContent, value: string): Replacement | undefined {
  const start = node.position?.start.offset
  const end = node.position?.end.offset
  if (start === undefined || end === undefined) return undefined
  return { end, start, value }
}

function applyReplacements(source: string, replacements: Replacement[]) {
  let result = source
  for (const replacement of replacements.sort((a, b) => b.start - a.start))
    result = result.slice(0, replacement.start) + replacement.value + result.slice(replacement.end)
  return result
}
