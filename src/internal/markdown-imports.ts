import * as fs from 'node:fs'
import * as path from 'node:path'
import type * as Estree from 'estree'
import type * as MdAst from 'mdast'
import remarkMdx from 'remark-mdx'
import remarkParse from 'remark-parse'
import { unified } from 'unified'

type MdxEsm = MdAst.RootContent & {
  type: 'mdxjsEsm'
  data?: {
    estree?: Estree.Program
  }
}

type MdxJsxElement = MdAst.RootContent & {
  type: 'mdxJsxFlowElement' | 'mdxJsxTextElement'
  attributes?: unknown[]
  children?: MdAst.RootContent[]
  name?: string | null
}

type MarkdownImport = {
  source: string
}

type Replacement = {
  end: number
  start: number
  value: string
}

export function inlineMarkdownImports(source: string, filePath: string): string {
  return inline(source, path.resolve(filePath), new Set())
}

function inline(source: string, filePath: string, seen: Set<string>): string {
  if (seen.has(filePath)) return ''
  seen.add(filePath)

  let tree: MdAst.Root
  try {
    tree = unified().use(remarkParse).use(remarkMdx).parse(source)
  } catch {
    return source
  }

  const imports = new Map<string, MarkdownImport>()
  const replacements: Replacement[] = []

  collectImports(tree.children, imports, replacements)
  collectComponentReplacements(tree, imports, filePath, seen, replacements)

  if (replacements.length === 0) return source
  return applyReplacements(source, replacements)
}

function collectImports(
  children: MdAst.RootContent[],
  imports: Map<string, MarkdownImport>,
  replacements: Replacement[],
) {
  for (const node of children) {
    if (node.type !== 'mdxjsEsm') continue

    const mdxEsm = node as MdxEsm
    const declarations = mdxEsm.data?.estree?.body.filter(
      (statement): statement is Estree.ImportDeclaration => statement.type === 'ImportDeclaration',
    )
    if (!declarations || declarations.length === 0) continue

    let markdownDeclarations = 0
    for (const declaration of declarations) {
      const source = declaration.source.value
      if (typeof source !== 'string' || !isMarkdownImport(source)) continue
      markdownDeclarations++

      const specifier = declaration.specifiers.find(
        (specifier): specifier is Estree.ImportDefaultSpecifier =>
          specifier.type === 'ImportDefaultSpecifier',
      )
      if (!specifier) continue
      imports.set(specifier.local.name, { source })
    }

    if (markdownDeclarations === declarations.length) {
      const replacement = toReplacement(node, '')
      if (replacement) replacements.push(replacement)
    }
  }
}

function collectComponentReplacements(
  node: MdAst.Root | MdAst.RootContent,
  imports: Map<string, MarkdownImport>,
  filePath: string,
  seen: Set<string>,
  replacements: Replacement[],
) {
  if (isMdxJsxElement(node)) {
    const name = node.name ?? undefined
    const markdownImport = name ? imports.get(name) : undefined
    if (markdownImport && isStaticMdxComponent(node)) {
      const importedPath = resolveMarkdownImport(markdownImport.source, filePath)
      if (importedPath) {
        const importedSource = fs.readFileSync(importedPath, 'utf-8')
        const value = inline(importedSource, importedPath, new Set(seen))
        const replacement = toReplacement(node, value)
        if (replacement) replacements.push(replacement)
      }
    }
  }

  if ('children' in node && Array.isArray(node.children))
    for (const child of node.children)
      collectComponentReplacements(child, imports, filePath, seen, replacements)
}

function isMdxJsxElement(node: MdAst.Root | MdAst.RootContent): node is MdxJsxElement {
  return node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement'
}

function isStaticMdxComponent(node: MdxJsxElement): boolean {
  return (node.attributes?.length ?? 0) === 0 && (node.children?.length ?? 0) === 0
}

function resolveMarkdownImport(source: string, filePath: string): string | undefined {
  if (!source.startsWith('.') && !path.isAbsolute(source)) return undefined

  const resolved = path.isAbsolute(source) ? source : path.resolve(path.dirname(filePath), source)
  if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) return resolved
  return undefined
}

function isMarkdownImport(source: string): boolean {
  return /\.(md|mdx)$/.test(source)
}

function toReplacement(
  node: MdAst.Root | MdAst.RootContent,
  value: string,
): Replacement | undefined {
  const start = node.position?.start.offset
  const end = node.position?.end.offset
  if (start === undefined || end === undefined) return undefined
  return { end, start, value }
}

function applyReplacements(source: string, replacements: Replacement[]): string {
  let result = source
  for (const replacement of replacements.sort((a, b) => b.start - a.start))
    result = result.slice(0, replacement.start) + replacement.value + result.slice(replacement.end)
  return result
}
