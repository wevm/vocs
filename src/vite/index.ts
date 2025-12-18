import mdx, { type Options as mdx_Options } from '@mdx-js/rollup'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import type { PluginOption } from 'vite'

export function vocs(options: vocs.Options = {}): PluginOption {
  const { mdx: mdxOptions } = options
  const { jsxImportSource = 'react', remarkPlugins = [] } = mdxOptions ?? {}
  return [
    mdx({
      ...mdxOptions,
      jsxImportSource,
      remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, ...(remarkPlugins ?? [])],
    }),
  ]
}

export declare namespace vocs {
  type Options = {
    mdx?: mdx_Options | undefined
  }
}
