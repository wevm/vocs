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
  transformerNotationWordHighlight,
} from 'shikiji-transformers'
import {
  defaultTwoslashOptions as defaultTwoslashOptions_,
  transformerTwoslash,
} from 'shikiji-twoslash'
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
import { remarkFilename } from './remark/filename.js'
import { remarkInferFrontmatter } from './remark/inferred-frontmatter.js'
import { remarkLinks } from './remark/links.js'
import { remarkSponsors } from './remark/sponsors.js'
import { remarkSteps } from './remark/steps.js'
import { remarkStrongBlock } from './remark/strong-block.js'
import { remarkSubheading } from './remark/subheading.js'
import { remarkTwoslash } from './remark/twoslash.js'
import { transformerDisplayNotation } from './shikiji/transformerDisplayNotation.js'
import { transformerNotationInclude } from './shikiji/transformerNotationInclude.js'
import { transformerSplitIdentifiers } from './shikiji/transformerSplitIdentifiers.js'
import { twoslashRenderer } from './shikiji/twoslashRenderer.js'
import { twoslasher } from './shikiji/twoslasher.js'

const defaultTwoslashOptions = defaultTwoslashOptions_()

type RemarkPluginsParameters = {
  markdown?: ParsedConfig['markdown']
}

export const getRemarkPlugins = ({ markdown }: RemarkPluginsParameters = {}) =>
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
    remarkCodeGroup,
    remarkDetails,
    remarkFilename,
    remarkSponsors,
    remarkSteps,
    remarkStrongBlock,
    remarkSubheading,
    remarkTwoslash,
    remarkAuthors,
    ...(markdown?.remarkPlugins || []),
  ] as PluggableList
export const remarkPlugins = getRemarkPlugins()

type RehypePluginsParameters = {
  markdown?: ParsedConfig['markdown']
  rootDir?: ParsedConfig['rootDir']
  twoslash?: ParsedConfig['twoslash']
}

export const getRehypePlugins = ({
  markdown,
  rootDir = '',
  twoslash = {},
}: RehypePluginsParameters = {}) =>
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
          transformerNotationWordHighlight(),
          transformerNotationInclude({ rootDir }),
          transformerDisplayNotation(),
          transformerTwoslash({
            explicitTrigger: true,
            renderer: twoslashRenderer(),
            twoslasher,
            twoslashOptions: {
              ...twoslash,
              customTags: [
                ...(defaultTwoslashOptions.customTags ?? []),
                ...(twoslash.customTags ?? []),
              ],
              compilerOptions: {
                ...(twoslash.compilerOptions ?? {}),
                ...defaultTwoslashOptions.compilerOptions,
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
    ...(markdown?.rehypePlugins || []),
  ] as PluggableList
export const rehypePlugins = getRehypePlugins()

export async function mdx(): Promise<PluginOption[]> {
  const { config } = await resolveVocsConfig()
  const { markdown, rootDir, twoslash } = config
  const remarkPlugins = getRemarkPlugins({ markdown })
  const rehypePlugins = getRehypePlugins({ markdown, rootDir, twoslash })
  return [
    mdxPlugin({
      providerImportSource: '@mdx-js/react',
      remarkPlugins,
      rehypePlugins,
    }),
  ]
}
