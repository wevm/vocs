import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypePrettyCode from '@jmoxey/rehype-pretty-code'
import rehypeSlug from 'rehype-slug'
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
import { remarkCode } from './remark/code.js'
import { remarkInferFrontmatter } from './remark/inferred-frontmatter.js'
import { remarkSteps } from './remark/steps.js'
import { remarkStrongBlock } from './remark/strong-block.js'
import { remarkSubheading } from './remark/subheading.js'

export function mdx() {
  return mdxPlugin({
    remarkPlugins: [
      remarkDirective,
      remarkInferFrontmatter,
      remarkFrontmatter,
      remarkMdxFrontmatter,
      remarkGfm,
      remarkCallout,
      remarkCode,
      remarkCodeGroup,
      remarkSteps,
      remarkStrongBlock,
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
      rehypeSlug,
      rehypeAutolinkHeadings,
    ],
  }) as PluginOption
}
