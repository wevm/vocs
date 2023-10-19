import { resolve } from 'node:path'
import mdx from '@mdx-js/rollup'
import react from '@vitejs/plugin-react'
import * as autoprefixer from 'autoprefixer'
import rehypePrettyCode from 'rehype-pretty-code'
import remarkDirective from 'remark-directive'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import { defineConfig } from 'vite'

import { remarkCodeGroup } from './remark-plugins/code-group.js'
import { routes } from './vite-plugins/routes.js'

export default defineConfig({
  css: {
    postcss: {
      plugins: [(autoprefixer as any).default()],
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
        remarkCodeGroup,
      ],
      rehypePlugins: [
        [
          rehypePrettyCode as any,
          {
            keepBackground: false,
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
