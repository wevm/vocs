import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import type * as Estree from 'estree'
import type * as MdAst from 'mdast'
import { gfmToMarkdown } from 'mdast-util-gfm'
import { mdxToMarkdown } from 'mdast-util-mdx'
import { toMarkdown } from 'mdast-util-to-markdown'
import remarkGfm from 'remark-gfm'
import remarkMdx from 'remark-mdx'
import remarkParse from 'remark-parse'
import { register } from 'tsx/esm/api'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'
import * as FileVersions from './file-versions.js'
import * as MarkdownBuiltins from './markdown-builtins.js'
import type { MarkdownComponentOverride, MarkdownRenderer } from './markdown-output.js'

type MdxEsm = MdAst.RootContent & {
  data?: { estree?: Estree.Program }
  type: 'mdxjsEsm'
}

type MdxJsxElement = Extract<MdAst.RootContent, { type: 'mdxJsxFlowElement' | 'mdxJsxTextElement' }>

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
export async function inlineMarkdownComponents(
  source: string,
  filePath: string,
  options: inlineMarkdownComponents.Options = {},
) {
  let tree: MdAst.Root
  try {
    tree = unified().use(remarkParse).use(remarkMdx).use(remarkGfm).parse(source)
  } catch {
    return source
  }

  const imports = getComponentImports(tree)
  const replacements: Replacement[] = []
  let replacementsNeeded = false
  const modules = new Map<string, Promise<Record<string, unknown> | undefined>>()

  // Transform children first, but replace only the outermost rendered source range.
  // This keeps untouched MDX byte-for-byte intact and avoids overlapping edits.
  async function transform(node: MdAst.RootContent): Promise<MdAst.RootContent[]> {
    if (node.type !== 'mdxJsxFlowElement' && node.type !== 'mdxJsxTextElement') {
      if ('children' in node)
        node.children = (
          await Promise.all(node.children.map(transform))
        ).flat() as typeof node.children
      return [node]
    }
    const [localName = '', ...members] = (node.name ?? '').split('.')
    const original = imports.get(localName)
    const componentImport = original && {
      ...original,
      exportName:
        original.exportName === '*'
          ? members.join('.')
          : [original.exportName, ...members].join('.'),
    }
    let renderer: MarkdownRenderer | undefined
    let legacy = false
    if (componentImport) {
      const resolved =
        (await options.resolve?.(componentImport.source, filePath)) ??
        resolveComponentImport(componentImport.source, filePath)
      for (const override of options.components ?? []) {
        const overridePath =
          (await options.resolve?.(
            override.module,
            options.rootDir ? path.join(options.rootDir, 'vocs.config.ts') : filePath,
          )) ??
          resolveComponentImport(
            override.module,
            options.rootDir ? path.join(options.rootDir, 'vocs.config.ts') : filePath,
          )
        if (resolved === overridePath && componentImport.exportName === override.export)
          renderer = override.render
      }
      if (!renderer && componentImport.source === 'vocs')
        renderer = MarkdownBuiltins.markdown[componentImport.exportName]
      if (!renderer) {
        if (!modules.has(resolved)) modules.set(resolved, loadModule(resolved, filePath))
        const module = await modules.get(resolved)
        const map = module?.['markdown'] as Record<string, MarkdownRenderer> | undefined
        renderer = map?.[componentImport.exportName]
        if (!renderer && isStaticMdxComponent(node)) {
          const component = module?.[componentImport.exportName] as MarkdownComponent | undefined
          if (component?.toMarkdown) {
            renderer = component.toMarkdown.bind(component) as MarkdownRenderer
            legacy = true
          }
        }
      }
    }
    const children = (await Promise.all(node.children.map(transform))).flat()
    node.children = children as typeof node.children
    if (!renderer) return [node]
    const props = readProps(node)
    // Dynamic props are retained for the final audit, never evaluated as JavaScript.
    if (props === undefined) return [node]
    const result = await renderer(props, {
      pageUrl: options.pageUrl ?? '/',
      inline: node.type === 'mdxJsxTextElement',
      renderChildren: () => children,
    })
    const nodes = Array.isArray(result) ? result : [result]
    if (!nodes.every((node) => node && typeof node.type === 'string'))
      throw new TypeError(
        `${node.name}.${legacy ? 'toMarkdown' : 'markdown'} must return a Markdown node or array of nodes.`,
      )
    if (node.type === 'mdxJsxTextElement' && nodes.some((node) => !inlineTypes.has(node.type)))
      throw new TypeError(`${node.name}: an inline Markdown renderer must return phrasing nodes.`)
    replacementsNeeded = true
    rendered.add(node)
    return nodes
  }
  const rendered = new WeakSet<object>()
  const inlineTypes = new Set([
    'text',
    'inlineCode',
    'emphasis',
    'strong',
    'delete',
    'link',
    'image',
    'break',
    'linkReference',
    'imageReference',
  ])
  async function replace(node: MdAst.RootContent) {
    replacementsNeeded = false
    const result = await transform(node)
    if (rendered.has(node)) {
      const markdown = toMarkdown(
        {
          type: 'root',
          children:
            node.type === 'mdxJsxTextElement'
              ? [{ type: 'paragraph', children: result as MdAst.PhrasingContent[] }]
              : result,
        },
        { extensions: [mdxToMarkdown(), gfmToMarkdown()] },
      )
      const replacement = toReplacement(
        node,
        node.type === 'mdxJsxTextElement' ? markdown.trimEnd() : markdown,
      )
      if (replacement) replacements.push(replacement)
    } else if ('children' in node && replacementsNeeded) {
      // A parent without a renderer still needs its transformed descendants serialized.
      const markdown = toMarkdown(
        { type: 'root', children: [node] },
        { extensions: [mdxToMarkdown(), gfmToMarkdown()] },
      )
      const replacement = toReplacement(node, markdown)
      if (replacement && source.slice(replacement.start, replacement.end) !== markdown.trimEnd())
        replacements.push(replacement)
    }
  }
  for (const node of tree.children) await replace(node)

  return applyReplacements(source, replacements)
}

export declare namespace inlineMarkdownComponents {
  type Options = {
    resolve?: (source: string, importer: string) => Promise<string | undefined>
    components?: readonly MarkdownComponentOverride[] | undefined
    rootDir?: string | undefined
    pageUrl?: string | undefined
  }
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
        if (specifier.type === 'ImportNamespaceSpecifier')
          imports.set(specifier.local.name, { exportName: '*', source: declaration.source.value })
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

async function loadModule(
  source: string,
  filePath: string,
): Promise<Record<string, unknown> | undefined> {
  try {
    const module = await importComponent(source, pathToFileURL(filePath).href)
    // tsx wraps CommonJS modules in a default export.
    return 'default' in module &&
      typeof module['default'] === 'object' &&
      module['default'] !== null &&
      !('toMarkdown' in module['default'])
      ? { ...module, ...module['default'] }
      : module
  } catch {
    // Browser-only modules need a config renderer. Keep their JSX for the final audit.
    return undefined
  }
}

/** Accept literals and literal containers only; never execute MDX expressions. */
function staticValue(node: unknown): unknown {
  const value = node as Estree.Expression | undefined
  if (value?.type === 'Literal') return value.value
  if (value?.type === 'TemplateLiteral' && value.expressions.length === 0)
    return value.quasis.map((part) => part.value.cooked ?? part.value.raw).join('')
  if (value?.type === 'UnaryExpression' && (value.operator === '-' || value.operator === '+')) {
    const argument = staticValue(value.argument)
    if (typeof argument === 'number') return value.operator === '-' ? -argument : argument
  }
  if (value?.type === 'ArrayExpression') return value.elements.map(staticValue)
  if (value?.type === 'ObjectExpression') {
    const entries = value.properties.map((property) => {
      if (
        property.type !== 'Property' ||
        property.computed ||
        property.kind !== 'init' ||
        property.method
      )
        throw new Error('Dynamic property')
      const key = property.key.type === 'Identifier' ? property.key.name : staticValue(property.key)
      return [String(key), staticValue(property.value)]
    })
    return Object.fromEntries(entries)
  }
  throw new Error('Dynamic expression')
}

function readProps(node: MdxJsxElement): Record<string, unknown> | undefined {
  try {
    return Object.fromEntries(
      node.attributes.map((attribute) => {
        if (attribute.type !== 'mdxJsxAttribute') throw new Error('Spread attribute')
        const value = attribute.value
        if (value === null || typeof value === 'string') return [attribute.name, value ?? true]
        const statement = value?.data?.estree?.body[0]
        if (statement?.type !== 'ExpressionStatement') throw new Error('Dynamic attribute')
        return [attribute.name, staticValue(statement.expression)]
      }),
    )
  } catch {
    return undefined
  }
}

type ComponentLoader = {
  /** Versions of the source files the loader imported, outside `node_modules`. */
  files: FileVersions.FileVersions
  import: (specifier: string, parentURL: string) => Promise<Record<string, unknown>>
  modules: Map<string, Promise<Record<string, unknown>>>
}

// Every `tsImport` call registers new loader hooks and imports the component's
// whole module graph under a new namespace, and Node never frees those modules.
// Share one namespace across components and exports, and start a new one only
// after a file it imported changes, so edited components still render fresh.
const loaderKey = Symbol.for('vocs.markdown-components.loader')
const globals = globalThis as { [key: symbol]: unknown }
const componentLoaders = (globals[loaderKey] ?? { count: 0, current: undefined }) as {
  count: number
  current: ComponentLoader | undefined
}
globals[loaderKey] = componentLoaders

function importComponent(source: string, parentURL: string) {
  const loader = getComponentLoader()
  const key = `${source}\0${parentURL}`
  const cached = loader.modules.get(key)
  if (cached) return cached
  const module = loader.import(source, parentURL)
  loader.modules.set(key, module)
  // Failed imports retry on the next export.
  module.catch(() => loader.modules.delete(key))
  return module
}

function getComponentLoader(): ComponentLoader {
  const current = componentLoaders.current
  if (current && !FileVersions.changed(current.files)) return current

  const files: FileVersions.FileVersions = new Map()
  const api = register({
    namespace: `vocs-markdown-components-${++componentLoaders.count}`,
    onImport(url) {
      if (!url.startsWith('file:')) return
      const file = fileURLToPath(url)
      if (files.has(file) || file.split(path.sep).includes('node_modules')) return
      files.set(file, FileVersions.version(file))
    },
  })
  const loader = { files, import: api.import, modules: new Map() }
  componentLoaders.current = loader
  return loader
}

function resolveComponentImport(source: string, filePath: string) {
  if (!source.startsWith('.') && !path.isAbsolute(source)) return source

  const resolved = path.isAbsolute(source) ? source : path.resolve(path.dirname(filePath), source)
  const extension = path.extname(resolved)
  const sourceExtensions = ['.cts', '.mts', '.ts', '.tsx']
  const sourcePath = ['.cjs', '.js', '.jsx', '.mjs'].includes(extension)
    ? resolved.slice(0, -extension.length)
    : undefined
  const candidates = [
    resolved,
    ...(sourcePath ? sourceExtensions.map((extension) => `${sourcePath}${extension}`) : []),
    ...(!extension
      ? ['.cjs', '.cts', '.js', '.jsx', '.mjs', '.mts', '.ts', '.tsx'].map(
          (extension) => `${resolved}${extension}`,
        )
      : []),
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

  const resolvedPath = candidates.find(
    (candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
  )
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
