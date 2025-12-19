import mdx from '@mdx-js/rollup'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import type { PluginOption } from 'vite'
import * as Config from './config.js'

export function vocs(options: vocs.Options = {}): PluginOption {
  const conf = Config.define(options)
  const { markdown } = conf
  const { jsxImportSource = 'react', remarkPlugins = [] } = markdown ?? {}

  return [
    mdx({
      ...markdown,
      jsxImportSource,
      remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, ...(remarkPlugins ?? [])],
    }),
    config(conf),
  ]
}

export declare namespace vocs {
  type Options = Config.define.Options
}

const virtualModuleId = 'virtual:vocs/config'
const resolvedVirtualModuleId = `\0${virtualModuleId}`

export function config(config: Config.Config): PluginOption {
  return {
    name: 'vocs:config',
    enforce: 'pre',
    config() {
      Config.setGlobal(config)
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
