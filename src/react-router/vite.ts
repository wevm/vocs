import * as fs from 'node:fs'
import * as fsp from 'node:fs/promises'
import path from 'node:path'
import type { Config as ReactRouterConfig } from '@react-router/dev/config'
import { reactRouter as reactRouterPlugin } from '@react-router/dev/vite'
import * as esast from 'esast-util-from-js'
import type { ExportNamedDeclaration, Program } from 'estree'
import * as estree from 'estree-util-visit'
import type { VFile } from 'vfile'
import type { PluginOption } from 'vite'

import * as Config from '../config.js'
import * as plugin from '../vite.js'

/**
 * Creates a Vite plugin for Vocs, with given configuration.
 *
 * @param options - Configuration options.
 * @returns Plugin
 */
export function vocs(options: vocs.Options = {}): PluginOption {
  const { reactRouter = {}, ...rest } = options

  return [
    plugin.vocs({
      ...rest,
      markdown: {
        ...rest.markdown,
        recmaPlugins: [...(rest.markdown?.recmaPlugins ?? []), recmaMdxMeta],
      },
    }),
    mdxHmr(),
    reactRouterConfig(reactRouter),
    reactRouterPlugin(),
  ]
}

export declare namespace vocs {
  type Options = plugin.vocs.Options & {
    reactRouter?: ReactRouterConfig | undefined
  }
}

/**
 * Creates a Vite plugin that enables Hot Module Replacement (HMR) for MDX files.
 *
 * @returns A Vite plugin for MDX HMR support
 */
export function mdxHmr(): PluginOption {
  return {
    name: 'vocs:mdx-hmr',
    apply: 'serve',
    enforce: 'post',
    transform(code, id) {
      if (!id.endsWith('.mdx') && !id.endsWith('.md')) return
      if (!code.includes('validateRefreshBoundaryAndEnqueueUpdate')) return
      return {
        code: code.replace(
          /validateRefreshBoundaryAndEnqueueUpdate\(currentExports, nextExports, \[([^\]]+)\]\)/,
          'validateRefreshBoundaryAndEnqueueUpdate(currentExports, nextExports, [$1,"frontmatter"])',
        ),
        map: null,
      }
    },
  }
}

/**
 * Creates a Vite plugin that configures React Router with Vocs-specific settings
 *
 * @param c - React Router configuration
 * @returns Plugin.
 */
export function reactRouterConfig(c?: ReactRouterConfig): PluginOption {
  const prerender = (() => {
    if (!c?.prerender) return undefined

    const prerender = {
      paths: true,
      unstable_concurrency: 999,
    }
    if (c.prerender === true) return prerender
    if (Array.isArray(c.prerender)) return { ...prerender, paths: c.prerender }
    return { ...prerender, ...c.prerender }
  })()

  const config = {
    ...c,
    ...(prerender ? { prerender } : undefined),
  } satisfies ReactRouterConfig

  return {
    name: 'vocs:react-router-config',
    enforce: 'pre',
    async config(viteConfig) {
      {
        const configPath = path.join(import.meta.dirname, '../../.vocs/react-router.config.ts')
        await fsp.mkdir(path.dirname(configPath), { recursive: true }).catch(() => {})
        const content = 'export default ' + JSON.stringify(config, null, 2)
        await fsp.writeFile(configPath, content)
      }

      {
        const root = viteConfig.root ?? process.cwd()
        const userConfigPath = path.join(root, 'react-router.config.ts')

        const content = []
        const userContent = await fsp.readFile(userConfigPath, 'utf-8').catch(() => undefined)

        const generatedContent = [
          "import { config } from 'vocs/react-router/config'",
          'export default config',
        ].join('\n')

        // Remove `react-router.config.ts` if the config is empty, and there is
        // no user config.
        if (
          Object.keys(config).length === 0 &&
          (!userContent || userContent?.startsWith(generatedContent))
        )
          return await fsp.rm(userConfigPath).catch(() => {})

        // If there is user config, we will wrap it in `withVocsConfig`.
        if (userContent?.includes('export default')) {
          if (userContent.includes('vocs/react-router/config')) return

          content.push(
            "import { withVocsConfig } from 'vocs/react-router/config'",
            '',
            userContent.replace('export default', 'const config ='),
            '',
            'export default withVocsConfig(config)',
          )
        } else content.push(generatedContent)

        await fsp.writeFile(userConfigPath, content.join('\n'))
      }
    },
  }
}

/**
 * Recma plugin that exports `meta` and `loader` functions decorated with MDX metadata for React Router routes.
 *
 * @returns Recma plugin.
 */
export function recmaMdxMeta() {
  return (tree: Program, vfile: VFile) => {
    const config = Config.getGlobal()

    let loaderNode: ExportNamedDeclaration | undefined
    let metaNode: ExportNamedDeclaration | undefined

    estree.visit(tree, (node) => {
      if (
        node.type === 'ExportNamedDeclaration' &&
        node.declaration?.type === 'VariableDeclaration' &&
        node.declaration.declarations[0]?.id.type === 'Identifier'
      ) {
        const pattern = node.declaration.declarations[0]?.id
        if (pattern.name === 'meta') metaNode = node
        if (pattern.name === 'loader') loaderNode = node
      }
    })

    const declaration = metaNode?.declaration
    if (declaration?.type === 'VariableDeclaration') {
      const declarator = declaration.declarations[0]
      if (declarator?.id.type === 'Identifier') declarator.id.name = 'meta_user'
    }

    const loaderDeclaration = loaderNode?.declaration
    if (loaderDeclaration?.type === 'VariableDeclaration') {
      const declarator = loaderDeclaration.declarations[0]
      if (declarator?.id.type === 'Identifier') declarator.id.name = 'loader_user'
    }

    const filePath = vfile.path
    const editUrl = 'https://github.com/TODO'
    const lastModified = filePath ? fs.statSync(filePath).mtime.toISOString() : undefined

    const { body } = esast.fromJs(
      `
        import { MdxRoute } from 'vocs/react-router/internal'
        
        export const meta = (args) => {
          const userResult = ${metaNode ? `meta_user?.(args),` : '[]'}
          const mdxResult = MdxRoute.meta({
            config: ${Config.serialize(config)},
            frontmatter,
            ...${JSON.stringify({ editUrl, lastModified })},
          })
          return [...(mdxResult ?? []), ...(userResult ?? [])]
        }

        export const loader = async (args) => {
          const [mdxResult, userResult] = await Promise.all([
            MdxRoute.loader(${JSON.stringify({ content: String(vfile.value) })}),
            ${loaderNode ? `loader_user?.(args),` : 'Promise.resolve({})'}
          ])
          return { ...(mdxResult ?? {}), ...(userResult ?? {}) }
        }
      `,
      { module: true },
    )
    tree.body.push(...body)
  }
}
