import { basename } from 'node:path'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig, splitVendorChunkPlugin } from 'vite'

import { css } from './plugins/css.js'
import { mdx } from './plugins/mdx.js'
import { virtualBlog } from './plugins/virtual-blog.js'
import { virtualConfig } from './plugins/virtual-config.js'
import { virtualRoot } from './plugins/virtual-root.js'
import { virtualRoutes } from './plugins/virtual-routes.js'
import { virtualStyles } from './plugins/virtual-styles.js'

export default defineConfig({
  build: {
    cssCodeSplit: false,
  },
  plugins: [
    splitVendorChunkPlugin(),
    virtualConfig(),
    react(),
    vanillaExtractPlugin({
      identifiers({ filePath, debugId }) {
        const scope = basename(filePath).replace('.css.ts', '')
        return `vocs_${scope}${debugId ? `_${debugId}` : ''}`
      },
      emitCssInSsr: true,
    }),
    css(),
    mdx(),
    virtualBlog(),
    virtualRoutes(),
    virtualRoot(),
    virtualStyles(),
  ],
  server: {
    fs: {
      allow: ['..'],
    },
  },
})
