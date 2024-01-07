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
import { defaultTwoSlashOptions, transformerTwoSlash } from 'shikiji-twoslash'
import type { PluggableList } from 'unified'
import { type PluginOption } from 'vite'

import type { ParsedConfig } from '../../config.js'
import { resolveVocsConfig } from '../utils/resolveVocsConfig.js'
import { remarkAuthors } from './remark/authors.js'
import { remarkBlogPosts } from './remark/blog-posts.js'
import { remarkCallout } from './remark/callout.js'
import { remarkCodeGroup } from './remark/code-group.js'
import { remarkCode } from './remark/code.js'
import { remarkDetails } from './remark/details.js'
import { remarkInferFrontmatter } from './remark/inferred-frontmatter.js'
import { remarkLinks } from './remark/links.js'
import { remarkSnippets } from './remark/snippets.js'
import { remarkSponsors } from './remark/sponsors.js'
import { remarkSteps } from './remark/steps.js'
import { remarkStrongBlock } from './remark/strong-block.js'
import { remarkSubheading } from './remark/subheading.js'
import { transformerSplitIdentifiers } from './shikiji/transformerSplitIdentifiers.js'
import { twoslashRenderer } from './shikiji/twoslashRenderer.js'
import { twoslasher } from './shikiji/twoslasher.js'

const defaultTwoslashOptions = defaultTwoSlashOptions()

export const getRemarkPlugins = () =>
  [
    remarkDirective,
    remarkInferFrontmatter,
    remarkFrontmatter,
    remarkMdxFrontmatter,
    remarkGfm,
    remarkLinks,
    remarkBlogPosts,
    remarkCallout,
    remarkCode,
    remarkSnippets,
    remarkCodeGroup,
    remarkDetails,
    remarkSponsors,
    remarkSteps,
    remarkStrongBlock,
    remarkSubheading,
    remarkAuthors,
  ] as PluggableList
export const remarkPlugins = getRemarkPlugins()

type RehypePluginsParameters = {
  markdown?: ParsedConfig['markdown']
  twoslash?: ParsedConfig['twoslash']
}

export const getRehypePlugins = ({ markdown, twoslash = {} }: RehypePluginsParameters = {}) =>
  [
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
            twoslashOptions: {
              ...twoslash,
              customTags: [...defaultTwoslashOptions.customTags, ...(twoslash.customTags ?? [])],
              defaultCompilerOptions: {
                ...(twoslash.defaultCompilerOptions ?? {}),
                ...defaultTwoslashOptions.defaultCompilerOptions,
              },
            },
          }),
          transformerSplitIdentifiers(),
        ],
        ...markdown?.code,
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
export const rehypePlugins = getRehypePlugins()

export async function mdx(): Promise<PluginOption[]> {
  const { config } = await resolveVocsConfig()
  const { markdown, twoslash } = config
  const remarkPlugins = getRemarkPlugins()
  const rehypePlugins = getRehypePlugins({ markdown, twoslash })
  return [
    mdxPlugin({
      remarkPlugins,
      rehypePlugins,
    }),
  ]
}
