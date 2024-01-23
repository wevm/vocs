import { basename } from 'node:path'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react'
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
import { resolveVocsConfig } from './utils/resolveVocsConfig.js'

export default defineConfig(async () => {
  const { config } = await resolveVocsConfig()
  const viteConfig = config.vite ?? {}
  return {
    ...viteConfig,
    build: {
      ...viteConfig?.build,
      cssCodeSplit: false,
    },
    optimizeDeps: {
      ...(viteConfig.optimizeDeps ?? {}),
      include: [
        'acorn-jsx',
        'chroma-js',
        'debug',
        'extend',
        'mark.js',
        'react',
        'react-dom',
        'react-dom/client',
        'react-helmet',
        'style-to-object',
        ...(viteConfig.optimizeDeps?.include ?? []),
      ],
      exclude: ['vocs', ...(viteConfig.optimizeDeps?.exclude ?? [])],
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
      ...(viteConfig.plugins ?? []),
    ],
    server: {
      ...viteConfig.server,
      fs: {
        ...viteConfig.server?.fs,
        allow: ['..', ...(viteConfig.server?.fs?.allow ?? [])],
      },
    },
  }
})
