import { basename } from 'node:path'
import react from '@vitejs/plugin-react'
// TODO: Use `@vanilla-extract/vite-plugin` once https://github.com/vanilla-extract-css/vanilla-extract/issues/1236 is resolved.
import { vanillaExtractPlugin } from '@vocs/vanilla-extract-vite-plugin'
import { defineConfig, splitVendorChunkPlugin } from 'vite'

import { css } from './plugins/css.js'
import { mdx } from './plugins/mdx.js'
import { resolveVocsModules } from './plugins/resolve-vocs-modules.js'
import { search } from './plugins/search.js'
import { virtualBlog } from './plugins/virtual-blog.js'
import { virtualConfig } from './plugins/virtual-config.js'
import { virtualConsumerComponents } from './plugins/virtual-consumer-components.js'
import { virtualRoutes } from './plugins/virtual-routes.js'
import { virtualStyles } from './plugins/virtual-styles.js'

export default defineConfig({
  build: {
    cssCodeSplit: false,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-dom/client', 'chroma-js', 'react-helmet', 'mark.js'],
    exclude: ['vocs'],
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
    resolveVocsModules(),
    search(),
    virtualBlog(),
    virtualConsumerComponents(),
    virtualRoutes(),
    virtualStyles(),
  ],
  server: {
    fs: {
      allow: ['..'],
    },
  },
})
