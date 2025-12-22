import mdxPlugin from '@mdx-js/rollup'
import type { VFile } from 'vfile'
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
    rehypePlugins: filterContentType(
      [Plugins.rehypeShiki({ ...markdown?.codeHighlight, twoslash }), ...(rehypePlugins ?? [])],
      (contentType) => contentType === 'html',
    ),
    remarkPlugins: [
      Plugins.remarkFrontmatter,
      Plugins.remarkDefaultFrontmatter,
      Plugins.remarkMdxFrontmatter,
      ...(remarkPlugins ?? []),
      Plugins.remarkContentExport,
    ],
    recmaPlugins: filterContentType(
      [Plugins.recmaMdxLayout, ...(recmaPlugins ?? [])],
      (contentType) => contentType === 'html',
    ),
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

  return {
    name: 'vocs:virtual-pages',
    resolveId(id) {
      if (id.startsWith(virtualPagesId)) return `\0${id}`
      return
    },
    load(id) {
      if (!id.startsWith(`\0${virtualPagesId}`)) {
        const { pathname, searchParams } = new URL(id, 'file://')
        const contentType = searchParams.get('contentType')
        if (contentType) Context.contentType.set(pathname, contentType)
        else Context.contentType.delete(pathname)
        return
      }

      {
        const { searchParams } = new URL(id, 'file://')
        const query = searchParams ? `query: "?${searchParams}", ` : ''
        return `
  export const pages = import.meta.glob(
    "/${srcDir}/pages/**/*.{${extensions.map((ext) => ext.slice(1)).join(',')}}",
    { ${query}base: "/${srcDir}/pages" }
  );
  `
      }
    },
  }
}

type Transform = (tree: unknown, vfile: VFile) => void
function filterContentType(
  plugins: unknown[],
  filter: (contentType: string) => boolean,
): (() => Transform)[] {
  return plugins.map((plugin) => {
    const [fn, options] = Array.isArray(plugin) ? plugin : [plugin, undefined]
    let transform: Transform | undefined
    return () => (tree, vfile) => {
      if (!filter(Context.contentType.get(vfile.path) ?? 'html')) return
      transform ??= (fn as (options: unknown) => Transform)(options)
      return transform(tree, vfile)
    }
  })
}
