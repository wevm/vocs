import mdxPlugin from '@mdx-js/rollup'
import rehypePrettyCode from '@vocs/rehype-pretty-code'
import { h } from 'hastscript'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeSlug from 'rehype-slug'
import remarkDirective from 'remark-directive'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import type { ShikijiTransformer } from 'shikiji'
import {
  transformerNotationDiff,
  transformerNotationFocus,
  transformerNotationHighlight,
} from 'shikiji-transformers'
import { rendererRich, transformerTwoSlash } from 'shikiji-twoslash'
import type { PluggableList } from 'unified'
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
] satisfies PluggableList

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
          renderer: rendererRich(),
        }),
        {
          name: 'trim-token',
          token(hast) {
            const child = hast.children[0]
            if (child.type !== 'text') return
            if (child.value.trim().length === 0) return

            const matches = child.value.match(/^(\s*\W\s*?)?(\w*)(\s*?\W\s*)?$/)
            if (!matches) return

            const [_, start, text, end] = matches
            if (start?.length > 0)
              hast.children.unshift({
                type: 'text',
                value: start,
              })
            if (end?.length > 0)
              hast.children.push({
                type: 'text',
                value: end,
              })
            child.value = text
          },
        } satisfies ShikijiTransformer,
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
] satisfies PluggableList

export function mdx(): PluginOption {
  return mdxPlugin({ remarkPlugins, rehypePlugins })
}
