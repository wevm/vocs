import { basename } from 'node:path'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig, splitVendorChunkPlugin } from 'vite'

import { css } from './plugins/css.js'
import { mdx } from './plugins/mdx.js'
import { root } from './plugins/root.js'
import { routes } from './plugins/routes.js'
import { vocsConfig } from './plugins/vocs-config.js'

export default defineConfig({
  plugins: [
    splitVendorChunkPlugin(),
    vocsConfig(),
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
    routes(),
    root(),
  ],
  server: {
    fs: {
      allow: ['..'],
    },
  },
})
