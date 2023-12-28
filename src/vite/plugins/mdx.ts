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
import { transformerTwoSlash } from 'shikiji-twoslash'
import type { PluggableList } from 'unified'
import { type PluginOption } from 'vite'

import { remarkAuthors } from './remark/authors.js'
import { remarkBlogPosts } from './remark/blog-posts.js'
import { remarkCallout } from './remark/callout.js'
import { remarkCodeGroup } from './remark/code-group.js'
import { remarkCode } from './remark/code.js'
import { remarkDetails } from './remark/details.js'
import { remarkInferFrontmatter } from './remark/inferred-frontmatter.js'
import { remarkLinks } from './remark/links.js'
import { remarkSponsors } from './remark/sponsors.js'
import { remarkSteps } from './remark/steps.js'
import { remarkStrongBlock } from './remark/strong-block.js'
import { remarkSubheading } from './remark/subheading.js'
import { transformerSplitIdentifiers } from './shikiji/transformerSplitIdentifiers.js'
import { twoslashRenderer } from './shikiji/twoslashRenderer.js'
import { twoslasher } from './shikiji/twoslasher.js'

export const remarkPlugins = [
  remarkDirective,
  remarkInferFrontmatter,
  remarkFrontmatter,
  remarkMdxFrontmatter,
  remarkGfm,
  remarkLinks,
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
] as PluggableList

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
        transformerTwoSlash({
          explicitTrigger: true,
          renderer: twoslashRenderer(),
          twoslasher,
        }),
        transformerSplitIdentifiers(),
      ],
      theme: {
        dark: 'github-dark-dimmed',
        light: 'github-light',
      },
    },
  ],
  [
    rehypeAutolinkHeadings,
    {
      behavior: 'append',
      content() {
        return [h('div', { dataAutolinkIcon: true })]
      },
    },
  ],
] as PluggableList

export function mdx(): PluginOption {
  return mdxPlugin({ remarkPlugins, rehypePlugins })
}
