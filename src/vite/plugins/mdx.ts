import rehypePrettyCode from '@jmoxey/rehype-pretty-code'
import mdxPlugin from '@mdx-js/rollup'
import remarkDirective from 'remark-directive'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import {
  createDiffProcessor,
  createFocusProcessor,
  createHighlightProcessor,
  getHighlighter,
} from 'shiki-processor'
import type { PluginOption } from 'vite'

import { remarkCallout } from './remark/callout.js'
import { remarkCodeGroup } from './remark/code-group.js'
import { remarkSubheading } from './remark/subheading.js'

export function mdx() {
  return mdxPlugin({
    remarkPlugins: [
      remarkDirective,
      remarkFrontmatter,
      remarkMdxFrontmatter,
      remarkGfm,
      remarkCallout,
      remarkCodeGroup,
      remarkSubheading,
    ],
    rehypePlugins: [
      [
        rehypePrettyCode as any,
        {
          keepBackground: false,
          getHighlighter(options: any) {
            return getHighlighter({
              ...options,
              processors: [
                createDiffProcessor(),
                createFocusProcessor(),
                createHighlightProcessor(),
              ],
            })
          },
          theme: {
            dark: 'github-dark-dimmed',
            light: 'github-light',
          },
        },
      ],
    ],
  }) as PluginOption
}
