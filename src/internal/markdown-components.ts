import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import type * as MdAst from 'mdast'
import { register } from 'tsx/esm/api'
import * as FileVersions from './file-versions.js'
import * as MarkdownBuiltins from './markdown-builtins.js'
import type * as MarkdownOutput from './markdown-output.js'
import * as MarkdownRender from './markdown-render.js'

type MarkdownComponent = {
  toMarkdown?: () =>
    | MdAst.RootContent
    | MdAst.RootContent[]
    | Promise<MdAst.RootContent | MdAst.RootContent[]>
}

/**
 * Replaces MDX components with their Markdown representations. Components without a renderer,
 * dynamic props, and HTML elements stay as written for the final audit.
 */
export async function inlineMarkdownComponents(
  source: string,
  filePath: string,
  options: inlineMarkdownComponents.Options = {},
) {
  const modules = new Map<string, Promise<Record<string, unknown> | undefined>>()
  const configFile = options.rootDir ? path.join(options.rootDir, 'vocs.config.ts') : filePath
  const resolvePath = async (source: string, importer: string) =>
    (await options.resolve?.(source, importer)) ?? resolveComponentImport(source, importer)

  async function resolve(
    component: MarkdownRender.Component,
  ): Promise<MarkdownRender.Renderer | undefined> {
    if (!component.source || !component.export) return undefined
    // Overrides and module maps name a default export `default`.
    const exportName =
      component.export === 'default'
        ? ['default', ...component.name.split('.').slice(1)].join('.')
        : component.name
    const resolved = await resolvePath(component.source, filePath)
    for (const override of options.components ?? [])
      if (
        exportName === override.export &&
        resolved === (await resolvePath(override.module, configFile))
      )
        return override.render
    if (component.source === 'vocs' && MarkdownBuiltins.markdown[exportName])
      return MarkdownBuiltins.markdown[exportName]
    if (!modules.has(resolved)) modules.set(resolved, loadModule(resolved, filePath))
    const module = await modules.get(resolved)
    const map = module?.['markdown'] as Record<string, MarkdownRender.Renderer> | undefined
    if (map?.[exportName]) return map[exportName]
    // Legacy static hook: `<Component />` with no props or children.
    const legacy = module?.[exportName] as MarkdownComponent | undefined
    if (
      legacy?.toMarkdown &&
      component.empty &&
      !component.inline &&
      /^[A-Z][A-Za-z0-9_$]*$/.test(component.name)
    )
      return legacy.toMarkdown.bind(legacy)
    return undefined
  }

  try {
    return await MarkdownRender.render(source, {
      intrinsic: false,
      onMissing: 'keep',
      pageUrl: options.pageUrl ?? '/',
      resolve,
    })
  } catch (error) {
    // Unparseable MDX stays as written; the final audit reports it.
    if (error instanceof Error && 'place' in error) return source
    throw error
  }
}

export declare namespace inlineMarkdownComponents {
  type Options = {
    resolve?: (source: string, importer: string) => Promise<string | undefined>
    components?: readonly MarkdownOutput.MarkdownComponentOverride[] | undefined
    rootDir?: string | undefined
    pageUrl?: string | undefined
  }
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
