import { basename } from 'node:path'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig, splitVendorChunkPlugin, type PluginOption } from 'vite'

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

const hasReactPlugin = async (plugins: ReadonlyArray<PluginOption>) => {
  for await (const plugin of plugins) {
    if (
      plugin &&
      ((!Array.isArray(plugin) && plugin.name === 'vite:react-babel') ||
        (Array.isArray(plugin) && (await hasReactPlugin(plugin))))
    ) {
      return true
    }
  }
  return false
}

export default defineConfig(async () => {
  const { config } = await resolveVocsConfig()
  const viteConfig = config.vite ?? {}
  const hasReact = await hasReactPlugin(viteConfig.plugins ?? [])

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
      ...(hasReact ? [] : react()),
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
