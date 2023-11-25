import { basename } from 'node:path'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig, splitVendorChunkPlugin } from 'vite'

import { css } from './plugins/css.js'
import { mdx } from './plugins/mdx.js'
import { virtualConfig } from './plugins/virtual-config.js'
import { virtualRoot } from './plugins/virtual-root.js'
import { virtualRoutes } from './plugins/virtual-routes.js'
import { docgen } from './plugins/docgen.js'

export default defineConfig({
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
    docgen(),
    mdx(),
    virtualRoutes(),
    virtualRoot(),
  ],
  server: {
    fs: {
      allow: ['..'],
    },
  },
})
