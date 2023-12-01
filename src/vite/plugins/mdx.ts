import mdxPlugin from '@mdx-js/rollup'
import { h } from 'hastscript'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeSlug from 'rehype-slug'
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
import { type PluginOption } from 'vite'

import { remarkAuthors } from './remark/authors.js'
import { remarkBlogPosts } from './remark/blog-posts.js'
import { remarkCallout } from './remark/callout.js'
import { remarkCodeGroup } from './remark/code-group.js'
import { remarkCode } from './remark/code.js'
import { remarkDetails } from './remark/details.js'
import { remarkInferFrontmatter } from './remark/inferred-frontmatter.js'
import { remarkSteps } from './remark/steps.js'
import { remarkStrongBlock } from './remark/strong-block.js'
import { remarkSubheading } from './remark/subheading.js'

export const remarkPlugins = [
  remarkDirective,
  remarkInferFrontmatter,
  remarkFrontmatter,
  remarkMdxFrontmatter,
  remarkGfm,
  remarkBlogPosts,
  remarkCallout,
  remarkCode,
  remarkCodeGroup,
  remarkDetails,
  remarkSteps,
  remarkStrongBlock,
  remarkSubheading,
  remarkAuthors,
]

export const rehypePlugins = [
  rehypeSlug,
  [
    rehypePrettyCode,
    {
      keepBackground: false,
      getHighlighter(options: Parameters<typeof getHighlighter>) {
        return getHighlighter({
          ...options,
          processors: [createDiffProcessor(), createFocusProcessor(), createHighlightProcessor()],
        })
      },
      theme: {
        dark: 'github-dark-dimmed',
        light: 'github-light',
      },
    },
  ] as any,
  [
    rehypeAutolinkHeadings,
    {
      behavior: 'append',
      content() {
        return [h('div', { dataAutolinkIcon: true })]
      },
    },
  ],
]

export function mdx(): PluginOption {
  return mdxPlugin({ remarkPlugins, rehypePlugins })
}
