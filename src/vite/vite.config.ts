import { basename, resolve } from 'node:path'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig, splitVendorChunkPlugin } from 'vite'

import { fileURLToPath } from 'node:url'
import type { Declaration } from 'postcss'
import { css } from './plugins/css.js'
// import { postcssPluginCssUrlRewrite } from './plugins/cssUrlWithBase.js'
import { mdx } from './plugins/mdx.js'
import { resolveVocsModules } from './plugins/resolve-vocs-modules.js'
import { search } from './plugins/search.js'
import { virtualBlog } from './plugins/virtual-blog.js'
import { virtualConfig } from './plugins/virtual-config.js'
import { virtualConsumerComponents } from './plugins/virtual-consumer-components.js'
import { virtualRoutes } from './plugins/virtual-routes.js'
import { virtualStyles } from './plugins/virtual-styles.js'
import { resolveVocsConfig } from './utils/resolveVocsConfig.js'

const cssUrlRE = /(?<=^|[^\w\-\u0080-\uffff])url\(['"]?(\s*('[^']+'|"[^"]+")\s*|[^'")]+)['"]?\)/g
const __dirname = fileURLToPath(import.meta.url)
const fileLinkPrefix = resolve(__dirname, '../../app/')
const IS_PROD = process.env.NODE_ENV === 'production'

export default defineConfig(async () => {
  const { config } = await resolveVocsConfig()
  const viteConfig = config?.vite ?? {}
  const baseUrl = config.baseUrl
  const shouldResolveCssUrl = baseUrl && IS_PROD
  const postcssPlugins = []
  if (shouldResolveCssUrl) {
    postcssPlugins.push({
      postcssPlugin: 'postcss-rewrite-url-in-app',
      Root(root: any) {
        if (root.source?.input.file?.includes(fileLinkPrefix)) {
          const css = root.source?.input.css
          if (css.includes('url(')) {
            root.walkDecls((decl: Declaration) => {
              const ruleValue = decl.value
              if (typeof ruleValue === 'string' && ruleValue.includes('url(')) {
                if (ruleValue.match(/url\(['"]?data:/)) {
                  return
                }
                decl.value = ruleValue.replace(cssUrlRE, (a, b) => {
                  let replaceUrl = b
                  const cssUrlFirstWords = b.split('/')[0]
                  if (!/^(?:[^.]|\.+)$/.test(cssUrlFirstWords)) {
                    replaceUrl = `${baseUrl}${replaceUrl.replace(/^\/*/, '/')}`
                    return a.replace(b, replaceUrl)
                  }
                  return a
                })
              }
            })
          }
        }
      },
    })
  }

  return {
    ...viteConfig,
    build: {
      ...viteConfig?.build,
      cssCodeSplit: false,
    },
    css: {
      postcss: {
        plugins: postcssPlugins,
      },
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
        // emitCssInSsr: true,
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
