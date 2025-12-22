import mdxPlugin from '@mdx-js/rollup'
import type { PluginOption } from 'vite'
import * as Config from './config.js'
import * as Context from './context.js'
import * as Plugins from './mdx-plugins.js'

const extensions = ['.js', '.ts', '.tsx', '.jsx', '.mjs', '.cjs', '.md', '.mdx']

/**
 * Deduplicates dependencies.
 *
 * @returns Plugin.
 */
export function dedupe(): PluginOption {
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

/**
 * Processes MDX files.
 *
 * @param config - Vocs configuration.
 * @returns Plugin.
 */
export function mdx(config: Config.Config): PluginOption {
  const { markdown, twoslash } = config
  const {
    jsxImportSource = 'react',
    recmaPlugins = [],
    rehypePlugins = [],
    remarkPlugins = [],
  } = markdown ?? {}

  return mdxPlugin({
    ...markdown,
    jsxImportSource,
    rehypePlugins: [
      Plugins.rehypeShiki({ ...markdown?.codeHighlight, twoslash }),
      ...(rehypePlugins ?? []),
    ],
    remarkPlugins: [
      Plugins.remarkFrontmatter,
      Plugins.remarkDefaultFrontmatter,
      Plugins.remarkMdxFrontmatter,
      ...(remarkPlugins ?? []),
      Plugins.remarkContentExport,
    ],
    recmaPlugins: [Plugins.recmaMdxLayout, ...(recmaPlugins ?? [])],
  })
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
      if (contentType) Context.contentType.set(pathname, contentType)
      else Context.contentType.delete(pathname)

      return
    },
  }
}
