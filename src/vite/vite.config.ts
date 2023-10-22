import { resolve } from 'node:path'
import rehypePrettyCode from '@jmoxey/rehype-pretty-code'
import mdx from '@mdx-js/rollup'
import react from '@vitejs/plugin-react'
import * as autoprefixer from 'autoprefixer'
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
import { defineConfig } from 'vite'

import { routes } from './plugins/routes.js'
import { remarkCallout } from './remark/callout.js'
import { remarkCodeGroup } from './remark/code-group.js'
import { remarkSubheading } from './remark/subheading.js'

export default defineConfig({
  css: {
    postcss: {
      plugins: [(autoprefixer as any).default()],
    },
  },
  server: {
    fs: {
      allow: ['..'],
    },
  },
  plugins: [
    react(),
    mdx({
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
    }),
    routes({ paths: resolve(process.cwd(), './pages/**/*.{md,mdx,ts,tsx,js,jsx}') }),
  ],
})
