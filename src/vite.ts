import mdx from '@mdx-js/rollup'

import { fromJs } from 'esast-util-from-js'
import type { Program } from 'estree'
import type { Root } from 'mdast'
import { mdxToMarkdown } from 'mdast-util-mdx'
import { toMarkdown } from 'mdast-util-to-markdown'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import type { VFile } from 'vfile'
import type { PluginOption } from 'vite'
import * as Config from './internal/config.js'

const contentTypeMap = new Map<string, string>()
const extensions = ['.js', '.ts', '.tsx', '.jsx', '.mjs', '.cjs', '.md', '.mdx']

/**
 * Vite plugin for Vocs.
 *
 * @param options - Configuration options.
 * @returns Plugin.
 */
export async function vocs(): Promise<PluginOption[]> {
  const config = await Config.resolve()
  const { markdown } = config
  const { jsxImportSource = 'react', remarkPlugins = [] } = markdown ?? {}

  return [
    dedupe(),
    mdx({
      ...markdown,
      jsxImportSource,
      remarkPlugins: [
        remarkFrontmatter,
        remarkDefaultFrontmatter,
        remarkMdxFrontmatter,
        ...(remarkPlugins ?? []),
        remarkContentExport,
      ],
      recmaPlugins: [recmaMdxLayout],
    }),
    virtualConfig(config),
    virtualPages(config),
  ]
}

/**
 * Recma plugin that wraps the MDX default export with MdxLayout.
 * This gives the layout access to frontmatter and path props.
 */
export function recmaMdxLayout() {
  return (tree: Program, vfile: VFile) => {
    // Skip layouts, roots, and slices - they shouldn't be wrapped
    const fileName = vfile.basename ?? ''
    if (!fileName.endsWith('.mdx') && !fileName.endsWith('.md')) return

    // Find the default export declaration
    const defaultExportIndex = tree.body.findIndex(
      (node) => node.type === 'ExportDefaultDeclaration',
    )
    if (defaultExportIndex === -1) return

    // Add imports for MdxLayout and createElement at the top
    const importAst = fromJs(
      `import { MdxPageLayout as _MdxPageLayout } from 'vocs';
       import { createElement as _createElement } from 'react';`,
      { module: true },
    )
    tree.body.unshift(...importAst.body)

    const wrapperAst = fromJs(
      `export function WithPageLayout(props = {}) {
        return _createElement(_MdxPageLayout, { ...props, frontmatter: typeof frontmatter !== 'undefined' ? frontmatter : undefined, pathname: props.path }, _createElement(MDXContent, props));
      }`,
      { module: true },
    )

    // Add the wrapper export
    tree.body.push(...wrapperAst.body)
  }
}

/**
 * Remark plugin that exports the processed markdown content from MDX files.
 * Only runs for files marked in the llmsContext.
 */
export function remarkContentExport() {
  return (tree: Root, vfile: VFile) => {
    try {
      const contentType = contentTypeMap.get(vfile.path)
      if (contentType !== 'md') return

      const content = toMarkdown(tree, { extensions: [mdxToMarkdown()] })
      const code = `export const content = ${JSON.stringify(content)}`

      tree.children.unshift({
        type: 'mdxjsEsm',
        value: code,
        data: { estree: fromJs(code, { module: true }) },
      } as never)
    } catch {}
  }
}

/**
 * Remark plugin that extracts frontmatter attributes from the document.
 */
export function remarkDefaultFrontmatter() {
  return (tree: Root, vfile: VFile) => {
    const contentType = contentTypeMap.get(vfile.path)
    if (contentType === 'md') return

    // Find existing frontmatter
    const frontmatterNode = tree.children.find((node) => node.type === 'yaml') as
      | { type: 'yaml'; value: string }
      | undefined
    const existingFrontmatter = frontmatterNode?.value ?? ''
    const hasTitle = /^title:/m.test(existingFrontmatter)
    const hasDescription = /^description:/m.test(existingFrontmatter)

    if (hasTitle && hasDescription) return

    // Find first h1
    const h1 = tree.children.find(
      (node) => node.type === 'heading' && (node as { depth: number }).depth === 1,
    ) as { type: 'heading'; children: { type: string; value?: string }[] } | undefined
    if (!h1) return

    // Extract text content
    const textContent = h1.children.map((child) => child.value ?? '').join('')

    // Parse title and description: "My Title [Description here]"
    const match = textContent.match(/^(.+?)\s*\[(.+)\]$/)
    const title = match?.[1]?.trim() ?? textContent.trim()
    const description = match?.[2]?.trim()

    // Build new frontmatter
    const newLines: string[] = []
    if (!hasTitle && title) newLines.push(`title: "${title.replace(/"/g, '\\"')}"`)
    if (!hasDescription && description)
      newLines.push(`description: "${description.replace(/"/g, '\\"')}"`)

    if (newLines.length === 0) return

    if (frontmatterNode) frontmatterNode.value = [...newLines, existingFrontmatter].join('\n')
    else
      tree.children.unshift({
        type: 'yaml',
        value: newLines.join('\n'),
      } as never)
  }
}

/**
 * Vite plugin that provides the Vocs configuration.
 *
 * @param config - Vocs configuration.
 * @returns Plugin.
 */
export function virtualConfig(config: Config.Config): PluginOption {
  const virtualModuleId = 'virtual:vocs/config'
  const resolvedVirtualModuleId = `\0${virtualModuleId}`
  return {
    name: 'vocs:virtual-config',
    enforce: 'pre',
    config() {
      Config.setGlobal(config)
    },
    configureServer(server) {
      server.watcher.add('vocs.config.*')
      server.watcher.on('change', async (path) => {
        if (!path.includes('vocs.config')) return

        const mod = server.moduleGraph.getModuleById(resolvedVirtualModuleId)
        if (mod) server.moduleGraph.invalidateModule(mod)

        const config = await Config.resolve()
        server.ws.send('vocs:config', config)
      })
    },
    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId
      return
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        let content = ''

        content += `export const config = ${Config.serialize(config)}`

        return content
      }
      return
    },
  }
}

export function virtualPages(config: Config.Config): PluginOption {
  const { srcDir } = config

  const virtualPagesId = 'virtual:vocs/pages'
  const resolvedVirtualPagesId = `\0${virtualPagesId}`

  const virtualPagesMdId = 'virtual:vocs/pages?contentType=md'
  const resolvedVirtualPagesMdId = `\0${virtualPagesMdId}`

  return {
    name: 'vocs:virtual-pages',
    resolveId(id) {
      if (id === virtualPagesId) return resolvedVirtualPagesId
      if (id === virtualPagesMdId) return resolvedVirtualPagesMdId
      return
    },
    load(id) {
      if (id === resolvedVirtualPagesId) {
        return `
export const pages = import.meta.glob(
  "/${srcDir}/pages/**/*.{${extensions.map((ext) => ext.slice(1)).join(',')}}",
  { base: "/${srcDir}/pages" }
);
`
      }
      if (id === resolvedVirtualPagesMdId) {
        return `
export const pages = import.meta.glob(
  "/${srcDir}/pages/**/*.{md,mdx}",
  { query: "?contentType=md", base: "/${srcDir}/pages" }
);
`
      }

      const { pathname, searchParams } = new URL(id, 'file://')
      const contentType = searchParams.get('contentType')
      if (contentType) contentTypeMap.set(pathname, contentType)
      else contentTypeMap.delete(pathname)

      return
    },
  }
}

function dedupe(): PluginOption {
  return {
    name: 'dedupe',
    config(config) {
      return {
        resolve: {
          ...config?.resolve,
          dedupe: ['react', 'react-dom', 'react-server-dom-webpack'],
        },
      }
    },
  }
}
