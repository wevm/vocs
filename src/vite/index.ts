import mdx from '@mdx-js/rollup'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import type { PluginOption } from 'vite'
import * as Config from '../config.js'
import { config as vocs_config } from './config.js'

export function vocs(options: vocs.Options = {}): PluginOption {
  const config = Config.define(options)
  const { markdown } = config
  const { jsxImportSource = 'react', remarkPlugins = [] } = markdown ?? {}

  return [
    mdx({
      ...markdown,
      jsxImportSource,
      remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, ...(remarkPlugins ?? [])],
    }),
    vocs_config(config),
  ]
}

export declare namespace vocs {
  type Options = Config.define.Options
}
