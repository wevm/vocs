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
  transformerNotationDiff,
  transformerNotationFocus,
  transformerNotationHighlight,
} from 'shikiji-transformers'
import { type PluginOption } from 'vite'

import { remarkAuthors } from './remark/authors.js'
import { remarkBlogPosts } from './remark/blog-posts.js'
import { remarkCallout } from './remark/callout.js'
import { remarkCodeGroup } from './remark/code-group.js'
import { remarkCode } from './remark/code.js'
import { remarkDetails } from './remark/details.js'
import { remarkInferFrontmatter } from './remark/inferred-frontmatter.js'
import { remarkSponsors } from './remark/sponsors.js'
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
  remarkSponsors,
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
      transformers: [
        transformerNotationDiff(),
        transformerNotationFocus(),
        transformerNotationHighlight(),
      ],
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
