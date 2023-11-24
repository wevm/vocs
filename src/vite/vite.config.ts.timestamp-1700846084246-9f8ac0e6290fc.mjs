// ../src/vite/vite.config.ts
import { basename } from 'node:path'
import { vanillaExtractPlugin } from 'file:///Users/tmm/Developer/vocs/node_modules/.pnpm/@vanilla-extract+vite-plugin@3.9.2_@types+node@20.8.9_vite@5.0.2/node_modules/@vanilla-extract/vite-plugin/dist/vanilla-extract-vite-plugin.cjs.js'
import react from 'file:///Users/tmm/Developer/vocs/node_modules/.pnpm/@vitejs+plugin-react@4.2.0_vite@5.0.2/node_modules/@vitejs/plugin-react/dist/index.mjs'
import {
  defineConfig,
  splitVendorChunkPlugin,
} from 'file:///Users/tmm/Developer/vocs/node_modules/.pnpm/vite@5.0.2_@types+node@20.8.9/node_modules/vite/dist/node/index.js'

// ../src/vite/plugins/css.ts
import { accessSync } from 'node:fs'
import { resolve } from 'node:path'
import { default as autoprefixer } from 'file:///Users/tmm/Developer/vocs/node_modules/.pnpm/autoprefixer@10.4.16_postcss@8.4.31/node_modules/autoprefixer/lib/autoprefixer.js'
import { default as tailwindcss } from 'file:///Users/tmm/Developer/vocs/node_modules/.pnpm/tailwindcss@3.3.5/node_modules/tailwindcss/lib/index.js'
import { default as tailwindcssNesting } from 'file:///Users/tmm/Developer/vocs/node_modules/.pnpm/tailwindcss@3.3.5/node_modules/tailwindcss/nesting/index.js'
function css() {
  const tailwindConfig = findTailwindConfig()
  return {
    name: 'css',
    config() {
      return {
        css: {
          postcss: {
            plugins: [
              autoprefixer(),
              tailwindcssNesting(),
              tailwindConfig
                ? tailwindcss({
                    config: tailwindConfig,
                  })
                : void 0,
            ].filter(Boolean),
          },
        },
      }
    },
  }
}
function findTailwindConfig() {
  const configFiles = [
    './tailwind.config.js',
    './tailwind.config.cjs',
    './tailwind.config.mjs',
    './tailwind.config.ts',
  ]
  for (const configFile of configFiles) {
    try {
      const configPath = resolve(process.cwd(), configFile)
      accessSync(configPath)
      return configPath
    } catch (err) {}
  }
  return null
}

// ../src/vite/plugins/mdx.ts
import mdxPlugin from 'file:///Users/tmm/Developer/vocs/node_modules/.pnpm/@mdx-js+rollup@3.0.0_rollup@4.5.2/node_modules/@mdx-js/rollup/index.js'
import { h as h4 } from 'file:///Users/tmm/Developer/vocs/node_modules/.pnpm/hastscript@8.0.0/node_modules/hastscript/index.js'
import rehypeAutolinkHeadings from 'file:///Users/tmm/Developer/vocs/node_modules/.pnpm/rehype-autolink-headings@7.1.0/node_modules/rehype-autolink-headings/index.js'
import rehypePrettyCode from 'file:///Users/tmm/Developer/vocs/node_modules/.pnpm/rehype-pretty-code@0.10.2_shiki@0.14.5/node_modules/rehype-pretty-code/dist/rehype-pretty-code.js'
import rehypeSlug from 'file:///Users/tmm/Developer/vocs/node_modules/.pnpm/rehype-slug@6.0.0/node_modules/rehype-slug/index.js'
import remarkDirective from 'file:///Users/tmm/Developer/vocs/node_modules/.pnpm/remark-directive@3.0.0/node_modules/remark-directive/index.js'
import remarkFrontmatter from 'file:///Users/tmm/Developer/vocs/node_modules/.pnpm/remark-frontmatter@5.0.0/node_modules/remark-frontmatter/index.js'
import remarkGfm from 'file:///Users/tmm/Developer/vocs/node_modules/.pnpm/remark-gfm@4.0.0/node_modules/remark-gfm/index.js'
import remarkMdxFrontmatter from 'file:///Users/tmm/Developer/vocs/node_modules/.pnpm/remark-mdx-frontmatter@4.0.0/node_modules/remark-mdx-frontmatter/index.js'
import {
  createDiffProcessor,
  createFocusProcessor,
  createHighlightProcessor,
  getHighlighter,
} from 'file:///Users/tmm/Developer/vocs/node_modules/.pnpm/shiki-processor@0.1.3_shiki@0.14.5/node_modules/shiki-processor/dist/index.mjs'

// ../src/vite/plugins/remark/callout.ts
import { h } from 'file:///Users/tmm/Developer/vocs/node_modules/.pnpm/hastscript@8.0.0/node_modules/hastscript/index.js'
import { visit } from 'file:///Users/tmm/Developer/vocs/node_modules/.pnpm/unist-util-visit@5.0.0/node_modules/unist-util-visit/index.js'
function remarkCallout() {
  return (tree) => {
    visit(tree, (node) => {
      if (node.type !== 'containerDirective') return
      if (
        node.name !== 'callout' &&
        node.name !== 'info' &&
        node.name !== 'warning' &&
        node.name !== 'danger' &&
        node.name !== 'tip' &&
        node.name !== 'success' &&
        node.name !== 'note'
      )
        return
      const label = node.children.find((child) => child.data?.directiveLabel)?.children[0].value
      const data = node.data || (node.data = {})
      const tagName = 'aside'
      if (label) {
        node.children = node.children.filter((child) => !child.data?.directiveLabel)
        node.children.unshift({
          type: 'paragraph',
          data: { hProperties: { 'data-callout-title': true } },
          children: [
            {
              type: 'strong',
              children: [{ type: 'text', value: label }],
            },
          ],
        })
      }
      data.hName = tagName
      data.hProperties = {
        ...h(tagName, node.attributes || {}).properties,
        'data-callout': node.name !== 'callout' ? node.name : true,
      }
    })
  }
}

// ../src/vite/plugins/remark/code-group.ts
import { h as h2 } from 'file:///Users/tmm/Developer/vocs/node_modules/.pnpm/hastscript@8.0.0/node_modules/hastscript/index.js'
import { visit as visit2 } from 'file:///Users/tmm/Developer/vocs/node_modules/.pnpm/unist-util-visit@5.0.0/node_modules/unist-util-visit/index.js'
function remarkCodeGroup() {
  return (tree) => {
    visit2(tree, (node) => {
      if (node.type !== 'containerDirective') return
      if (node.name !== 'code-group') return
      const data = node.data || (node.data = {})
      const tagName = 'div'
      node.attributes = {
        ...node.attributes,
        class: 'code-group',
      }
      data.hName = tagName
      data.hProperties = h2(tagName, node.attributes || {}).properties
      node.children = node.children
        .map((child) => {
          const match = 'meta' in child && child?.meta?.match(/^\[(.*)\]/)
          return {
            type: 'paragraph',
            children: [child],
            data: {
              hName: 'div',
              hProperties: match
                ? {
                    'data-title': match[1],
                  }
                : void 0,
            },
          }
        })
        .filter(Boolean)
    })
  }
}

// ../src/vite/plugins/remark/code.ts
import { visit as visit3 } from 'file:///Users/tmm/Developer/vocs/node_modules/.pnpm/unist-util-visit@5.0.0/node_modules/unist-util-visit/index.js'
function remarkCode() {
  return (tree) => {
    visit3(tree, (node, _, parent) => {
      if (node.type !== 'code') return
      if (parent?.type === 'containerDirective' && parent.name !== 'steps') return
      const [match, title] = node.meta?.match(/\[(.*)\]/) || []
      if (match) node.meta = node.meta?.replace(match, `title="${title}"`)
    })
  }
}

// ../src/vite/plugins/remark/details.ts
import { visit as visit4 } from 'file:///Users/tmm/Developer/vocs/node_modules/.pnpm/unist-util-visit@5.0.0/node_modules/unist-util-visit/index.js'
function remarkDetails() {
  return (tree) => {
    visit4(tree, (node) => {
      if (node.type !== 'containerDirective') return
      if (node.name !== 'details') return
      const data = node.data || (node.data = {})
      const tagName = 'details'
      const summaryChild = node.children[0]
      if (summaryChild.type === 'paragraph' && summaryChild.data?.directiveLabel)
        summaryChild.data.hName = 'summary'
      else
        node.children.unshift({
          type: 'paragraph',
          children: [{ type: 'text', value: 'Details' }],
          data: { hName: 'summary' },
        })
      data.hName = tagName
    })
  }
}

// ../src/vite/plugins/remark/inferred-frontmatter.ts
import { visit as visit5 } from 'file:///Users/tmm/Developer/vocs/node_modules/.pnpm/unist-util-visit@5.0.0/node_modules/unist-util-visit/index.js'
function remarkInferFrontmatter() {
  return (tree) => {
    visit5(tree, (node, _, parent) => {
      if (parent?.type !== 'root') return
      if (node.type === 'heading' && node.depth === 1) {
        if (node.children.length === 0) return
        const child = node.children[0]
        if (!('value' in child)) return
        const value = child.value
        const [, title, description] = value.includes('[')
          ? value.match(/(.*) \[(.*)\]/) || []
          : [void 0, value]
        const frontmatterIndex = parent.children.findIndex((child2) => child2.type === 'yaml')
        const index = frontmatterIndex > 0 ? frontmatterIndex : 0
        const frontmatter = {
          ...(parent.children[frontmatterIndex] || {
            value: '',
            type: 'yaml',
          }),
        }
        if (!frontmatter.value.includes('title'))
          frontmatter.value += `
title: ${title}
`
        if (!frontmatter.value.includes('description'))
          frontmatter.value += `
description: ${description}
`
        if (frontmatterIndex === -1) tree.children.unshift(frontmatter)
        else parent.children.splice(index, 1, frontmatter)
      }
    })
  }
}

// ../src/vite/plugins/remark/steps.ts
import { h as h3 } from 'file:///Users/tmm/Developer/vocs/node_modules/.pnpm/hastscript@8.0.0/node_modules/hastscript/index.js'
import { visit as visit6 } from 'file:///Users/tmm/Developer/vocs/node_modules/.pnpm/unist-util-visit@5.0.0/node_modules/unist-util-visit/index.js'
function remarkSteps() {
  return (tree) => {
    visit6(tree, (node) => {
      if (node.type !== 'containerDirective') return
      if (node.name !== 'steps') return
      const data = node.data || (node.data = {})
      const tagName = 'div'
      node.attributes = {
        ...node.attributes,
        'data-vocs-steps': 'true',
      }
      data.hName = tagName
      data.hProperties = h3(tagName, node.attributes || {}).properties
      const depth = node.children.find((child) => child.type === 'heading')?.depth ?? 2
      let currentChild
      const children = []
      for (const child of node.children) {
        if (child.type === 'heading' && child.depth === depth) {
          if (currentChild && currentChild.children.length > 0) children.push(currentChild)
          currentChild = {
            type: 'paragraph',
            children: [],
            data: {
              hName: 'div',
              hProperties: {
                'data-depth': depth,
              },
            },
          }
        }
        currentChild.children.push(child)
      }
      children.push(currentChild)
      node.children = children
    })
  }
}

// ../src/vite/plugins/remark/strong-block.ts
import { visit as visit7 } from 'file:///Users/tmm/Developer/vocs/node_modules/.pnpm/unist-util-visit@5.0.0/node_modules/unist-util-visit/index.js'
function remarkStrongBlock() {
  return (tree) => {
    visit7(tree, 'strong', (node, _, parent) => {
      if (!parent) return
      if (parent.type !== 'paragraph') return
      if (parent.children.length > 1) return
      parent.type = 'strong'
      parent.children = node.children
    })
  }
}

// ../src/vite/plugins/remark/subheading.ts
import { visit as visit8 } from 'file:///Users/tmm/Developer/vocs/node_modules/.pnpm/unist-util-visit@5.0.0/node_modules/unist-util-visit/index.js'
function remarkSubheading() {
  return (tree) => {
    visit8(tree, 'heading', (node, index, parent) => {
      if (!index) return
      if (node.depth !== 1) return
      if (node.children.length === 0) return
      const subheadingRegex = / \[(.*)\]$/
      const subheadingChild = node.children.find(
        (child) =>
          'value' in child && typeof child.value === 'string' && child.value.match(subheadingRegex),
      )
      const [match, subheading] = subheadingChild?.value?.match(subheadingRegex) ?? []
      if (subheadingChild) subheadingChild.value = subheadingChild?.value?.replace(match, '')
      parent?.children.splice(index, 1)
      const header = {
        type: 'paragraph',
        data: {
          hName: 'header',
        },
        children: [
          node,
          subheading
            ? {
                type: 'paragraph',
                children: [{ type: 'text', value: subheading }],
                data: {
                  hName: 'div',
                  hProperties: {
                    role: 'doc-subtitle',
                  },
                },
              }
            : void 0,
        ].filter(Boolean),
      }
      parent?.children.splice(index, 0, header)
    })
  }
}

// ../src/vite/plugins/mdx.ts
function mdx() {
  return mdxPlugin({
    remarkPlugins: [
      remarkDirective,
      remarkInferFrontmatter,
      remarkFrontmatter,
      remarkMdxFrontmatter,
      remarkGfm,
      remarkCallout,
      remarkCode,
      remarkCodeGroup,
      remarkDetails,
      remarkSteps,
      remarkStrongBlock,
      remarkSubheading,
    ],
    rehypePlugins: [
      [
        rehypePrettyCode,
        {
          keepBackground: false,
          getHighlighter(options) {
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
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'append',
          content() {
            return [
              h4('div', {
                dataAutolinkIcon: true,
              }),
            ]
          },
        },
      ],
    ],
  })
}

// ../src/vite/plugins/virtual-config.ts
import 'file:///Users/tmm/Developer/vocs/node_modules/.pnpm/vite@5.0.2_@types+node@20.8.9/node_modules/vite/dist/node/index.js'

// ../src/vite/utils.ts
import { existsSync } from 'node:fs'
import { resolve as resolve2 } from 'node:path'
import { loadConfigFromFile } from 'file:///Users/tmm/Developer/vocs/node_modules/.pnpm/vite@5.0.2_@types+node@20.8.9/node_modules/vite/dist/node/index.js'
var extensions = ['js', 'ts', 'mjs', 'mts']
var defaultConfigPaths = ['.vocs/config', 'vocs.config']
async function resolveVocsConfig(parameters = {}) {
  const { command = 'serve', mode = 'development' } = parameters
  const configPath = (() => {
    for (const ext of extensions) {
      if (parameters.configPath) return parameters.configPath
      for (const filePath of defaultConfigPaths)
        if (existsSync(resolve2(process.cwd(), `${filePath}.${ext}`))) return `${filePath}.${ext}`
    }
    return
  })()
  const result = await loadConfigFromFile({ command, mode }, configPath)
  return {
    config: result ? result.config : {},
    configPath,
  }
}

// ../src/vite/plugins/virtual-config.ts
function virtualConfig() {
  const virtualModuleId = 'virtual:config'
  const resolvedVirtualModuleId = `\0${virtualModuleId}`
  return {
    name: 'vocs-config',
    async configureServer(server) {
      const { configPath } = await resolveVocsConfig()
      console.log('configPath', configPath)
      if (configPath) {
        server.watcher.add(configPath)
        server.watcher.on('change', async () => {
          server.ws.send('vocs:config', (await resolveVocsConfig()).config)
        })
      }
    },
    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId
      return
    },
    async load(id) {
      if (id === resolvedVirtualModuleId) {
        const { config } = await resolveVocsConfig()
        return `export const config = ${JSON.stringify(config)}`
      }
      return
    },
    handleHotUpdate() {
      return
    },
  }
}

// ../src/vite/plugins/virtual-root.ts
import { existsSync as existsSync2 } from 'node:fs'
import { resolve as resolve3 } from 'node:path'
function virtualRoot({ root = resolve3(process.cwd(), './root.tsx') } = {}) {
  const virtualModuleId = 'virtual:root'
  const resolvedVirtualModuleId = `\0${virtualModuleId}`
  return {
    name: 'routes',
    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId
      return
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        if (!existsSync2(root)) return 'export const Root = ({ children }) => children;'
        return `export { default as Root } from "${root}";`
      }
      return
    },
  }
}

// ../src/vite/plugins/virtual-routes.ts
import { resolve as resolve4 } from 'node:path'
import { globby } from 'file:///Users/tmm/Developer/vocs/node_modules/.pnpm/globby@13.2.2/node_modules/globby/index.js'
function virtualRoutes() {
  const virtualModuleId = 'virtual:routes'
  const resolvedVirtualModuleId = `\0${virtualModuleId}`
  let glob
  let paths = []
  return {
    name: 'routes',
    async configureServer(server) {
      const { config } = await resolveVocsConfig()
      const { root } = config
      const pagesPath = resolve4(root, 'pages')
      server.watcher.add(pagesPath)
      server.watcher.on('add', () => server.restart())
      server.watcher.on('unlink', () => server.restart())
    },
    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId
      return
    },
    async load(id) {
      if (id === resolvedVirtualModuleId) {
        let code = 'export const routes = ['
        for (const path2 of paths) {
          const type = path2
            .split('.')
            .pop()
            ?.match(/(mdx|md)/)
            ? 'mdx'
            : 'jsx'
          const replacer = glob.split('*')[0]
          let pagePath = path2.replace(replacer, '').replace(/\.(.*)/, '')
          if (pagePath.endsWith('index'))
            pagePath = pagePath.replace('index', '').replace(/\/$/, '')
          code += `  { lazy: () => import("${path2}"), path: "/${pagePath}", type: "${type}" },`
          if (pagePath)
            code += `  { lazy: () => import("${path2}"), path: "/${pagePath}.html", type: "${type}" },`
        }
        code += ']'
        return code
      }
      return
    },
    async buildStart() {
      const { config } = await resolveVocsConfig()
      const { root } = config
      const pagesPath = resolve4(root, 'pages')
      glob = `${pagesPath}/**/*.{md,mdx,ts,tsx,js,jsx}`
      paths = await globby(glob)
    },
    handleHotUpdate() {
      return
    },
  }
}

// ../src/vite/plugins/docgen.ts
import path from 'path'
import { Project } from 'file:///Users/tmm/Developer/vocs/node_modules/.pnpm/ts-morph@20.0.0/node_modules/ts-morph/dist/ts-morph.js'
import 'file:///Users/tmm/Developer/vocs/node_modules/.pnpm/vite@5.0.2_@types+node@20.8.9/node_modules/vite/dist/node/index.js'
var project = new Project({ tsConfigFilePath: '../tsconfig.json' })
function docgen(parameters = {}) {
  const { entryPoints } = parameters
  const virtualModuleId = 'virtual:docgen'
  const resolvedVirtualModuleId = `\0${virtualModuleId}`
  return {
    name: 'docgen',
    async configureServer(server) {
      const sourceFiles = project.getSourceFiles()
      if (sourceFiles.length) {
        const rootDirs = /* @__PURE__ */ new Set()
        for (const sourceFile of sourceFiles) {
          const key = sourceFile
            .getFilePath()
            .replace(`${path.dirname(process.cwd())}/`, '')
            .split('/')[0]
          rootDirs.add(key)
        }
        for (const rootDir of rootDirs) {
          server.watcher.add(`${rootDir}/**/*`)
          server.watcher.on('change', async () => server.ws.send('vocs:docgen', getFiles()))
        }
      }
    },
    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId
      return
    },
    async load(id) {
      if (id !== resolvedVirtualModuleId) return
      const files = getFiles()
      return `export const docgen = ${JSON.stringify(files)}`
    },
  }
}
function getFiles() {
  const sourceFiles = project.getSourceFiles()
  const files = {}
  for (const sourceFile of sourceFiles) {
    const key = sourceFile.getFilePath().replace(`${path.dirname(process.cwd())}/`, '')
    files[key] = sourceFile.getFullText()
  }
  return files
}

// ../src/vite/vite.config.ts
var vite_config_default = defineConfig({
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
export { vite_config_default as default }
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL3ZpdGUvdml0ZS5jb25maWcudHMiLCAiLi4vc3JjL3ZpdGUvcGx1Z2lucy9jc3MudHMiLCAiLi4vc3JjL3ZpdGUvcGx1Z2lucy9tZHgudHMiLCAiLi4vc3JjL3ZpdGUvcGx1Z2lucy9yZW1hcmsvY2FsbG91dC50cyIsICIuLi9zcmMvdml0ZS9wbHVnaW5zL3JlbWFyay9jb2RlLWdyb3VwLnRzIiwgIi4uL3NyYy92aXRlL3BsdWdpbnMvcmVtYXJrL2NvZGUudHMiLCAiLi4vc3JjL3ZpdGUvcGx1Z2lucy9yZW1hcmsvZGV0YWlscy50cyIsICIuLi9zcmMvdml0ZS9wbHVnaW5zL3JlbWFyay9pbmZlcnJlZC1mcm9udG1hdHRlci50cyIsICIuLi9zcmMvdml0ZS9wbHVnaW5zL3JlbWFyay9zdGVwcy50cyIsICIuLi9zcmMvdml0ZS9wbHVnaW5zL3JlbWFyay9zdHJvbmctYmxvY2sudHMiLCAiLi4vc3JjL3ZpdGUvcGx1Z2lucy9yZW1hcmsvc3ViaGVhZGluZy50cyIsICIuLi9zcmMvdml0ZS9wbHVnaW5zL3ZpcnR1YWwtY29uZmlnLnRzIiwgIi4uL3NyYy92aXRlL3V0aWxzLnRzIiwgIi4uL3NyYy92aXRlL3BsdWdpbnMvdmlydHVhbC1yb290LnRzIiwgIi4uL3NyYy92aXRlL3BsdWdpbnMvdmlydHVhbC1yb3V0ZXMudHMiLCAiLi4vc3JjL3ZpdGUvcGx1Z2lucy9kb2NnZW4udHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvdG1tL0RldmVsb3Blci92b2NzL3NyYy92aXRlXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvdG1tL0RldmVsb3Blci92b2NzL3NyYy92aXRlL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy90bW0vRGV2ZWxvcGVyL3ZvY3Mvc3JjL3ZpdGUvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBiYXNlbmFtZSB9IGZyb20gJ25vZGU6cGF0aCdcbmltcG9ydCB7IHZhbmlsbGFFeHRyYWN0UGx1Z2luIH0gZnJvbSAnQHZhbmlsbGEtZXh0cmFjdC92aXRlLXBsdWdpbidcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCdcbmltcG9ydCB7IGRlZmluZUNvbmZpZywgc3BsaXRWZW5kb3JDaHVua1BsdWdpbiB9IGZyb20gJ3ZpdGUnXG5cbmltcG9ydCB7IGNzcyB9IGZyb20gJy4vcGx1Z2lucy9jc3MuanMnXG5pbXBvcnQgeyBtZHggfSBmcm9tICcuL3BsdWdpbnMvbWR4LmpzJ1xuaW1wb3J0IHsgdmlydHVhbENvbmZpZyB9IGZyb20gJy4vcGx1Z2lucy92aXJ0dWFsLWNvbmZpZy5qcydcbmltcG9ydCB7IHZpcnR1YWxSb290IH0gZnJvbSAnLi9wbHVnaW5zL3ZpcnR1YWwtcm9vdC5qcydcbmltcG9ydCB7IHZpcnR1YWxSb3V0ZXMgfSBmcm9tICcuL3BsdWdpbnMvdmlydHVhbC1yb3V0ZXMuanMnXG5pbXBvcnQgeyBkb2NnZW4gfSBmcm9tICcuL3BsdWdpbnMvZG9jZ2VuLmpzJ1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgc3BsaXRWZW5kb3JDaHVua1BsdWdpbigpLFxuICAgIHZpcnR1YWxDb25maWcoKSxcbiAgICByZWFjdCgpLFxuICAgIHZhbmlsbGFFeHRyYWN0UGx1Z2luKHtcbiAgICAgIGlkZW50aWZpZXJzKHsgZmlsZVBhdGgsIGRlYnVnSWQgfSkge1xuICAgICAgICBjb25zdCBzY29wZSA9IGJhc2VuYW1lKGZpbGVQYXRoKS5yZXBsYWNlKCcuY3NzLnRzJywgJycpXG4gICAgICAgIHJldHVybiBgdm9jc18ke3Njb3BlfSR7ZGVidWdJZCA/IGBfJHtkZWJ1Z0lkfWAgOiAnJ31gXG4gICAgICB9LFxuICAgICAgZW1pdENzc0luU3NyOiB0cnVlLFxuICAgIH0pLFxuICAgIGNzcygpLFxuICAgIGRvY2dlbigpLFxuICAgIG1keCgpLFxuICAgIHZpcnR1YWxSb3V0ZXMoKSxcbiAgICB2aXJ0dWFsUm9vdCgpLFxuICBdLFxuICBzZXJ2ZXI6IHtcbiAgICBmczoge1xuICAgICAgYWxsb3c6IFsnLi4nXSxcbiAgICB9LFxuICB9LFxufSlcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL3RtbS9EZXZlbG9wZXIvdm9jcy9zcmMvdml0ZS9wbHVnaW5zXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvdG1tL0RldmVsb3Blci92b2NzL3NyYy92aXRlL3BsdWdpbnMvY3NzLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy90bW0vRGV2ZWxvcGVyL3ZvY3Mvc3JjL3ZpdGUvcGx1Z2lucy9jc3MudHNcIjtpbXBvcnQgeyBhY2Nlc3NTeW5jIH0gZnJvbSAnbm9kZTpmcydcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tICdub2RlOnBhdGgnXG5pbXBvcnQgeyBkZWZhdWx0IGFzIGF1dG9wcmVmaXhlciB9IGZyb20gJ2F1dG9wcmVmaXhlcidcbmltcG9ydCB7IGRlZmF1bHQgYXMgdGFpbHdpbmRjc3MgfSBmcm9tICd0YWlsd2luZGNzcydcbmltcG9ydCB7IGRlZmF1bHQgYXMgdGFpbHdpbmRjc3NOZXN0aW5nIH0gZnJvbSAndGFpbHdpbmRjc3MvbmVzdGluZydcbmltcG9ydCB0eXBlIHsgUGx1Z2luT3B0aW9uIH0gZnJvbSAndml0ZSdcblxuZXhwb3J0IGZ1bmN0aW9uIGNzcygpOiBQbHVnaW5PcHRpb24ge1xuICBjb25zdCB0YWlsd2luZENvbmZpZyA9IGZpbmRUYWlsd2luZENvbmZpZygpXG5cbiAgcmV0dXJuIHtcbiAgICBuYW1lOiAnY3NzJyxcbiAgICBjb25maWcoKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjc3M6IHtcbiAgICAgICAgICBwb3N0Y3NzOiB7XG4gICAgICAgICAgICBwbHVnaW5zOiBbXG4gICAgICAgICAgICAgIGF1dG9wcmVmaXhlcigpLFxuICAgICAgICAgICAgICB0YWlsd2luZGNzc05lc3RpbmcoKSxcbiAgICAgICAgICAgICAgdGFpbHdpbmRDb25maWdcbiAgICAgICAgICAgICAgICA/ICh0YWlsd2luZGNzcyBhcyBhbnkpKHtcbiAgICAgICAgICAgICAgICAgICAgY29uZmlnOiB0YWlsd2luZENvbmZpZyxcbiAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBdLmZpbHRlcihCb29sZWFuKSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgfVxuICAgIH0sXG4gIH1cbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFRhaWx3aW5kXG5cbmV4cG9ydCBmdW5jdGlvbiBmaW5kVGFpbHdpbmRDb25maWcoKSB7XG4gIGNvbnN0IGNvbmZpZ0ZpbGVzID0gW1xuICAgICcuL3RhaWx3aW5kLmNvbmZpZy5qcycsXG4gICAgJy4vdGFpbHdpbmQuY29uZmlnLmNqcycsXG4gICAgJy4vdGFpbHdpbmQuY29uZmlnLm1qcycsXG4gICAgJy4vdGFpbHdpbmQuY29uZmlnLnRzJyxcbiAgXVxuICBmb3IgKGNvbnN0IGNvbmZpZ0ZpbGUgb2YgY29uZmlnRmlsZXMpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgY29uZmlnUGF0aCA9IHJlc29sdmUocHJvY2Vzcy5jd2QoKSwgY29uZmlnRmlsZSlcbiAgICAgIGFjY2Vzc1N5bmMoY29uZmlnUGF0aClcbiAgICAgIHJldHVybiBjb25maWdQYXRoXG4gICAgfSBjYXRjaCAoZXJyKSB7fVxuICB9XG5cbiAgcmV0dXJuIG51bGxcbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL3RtbS9EZXZlbG9wZXIvdm9jcy9zcmMvdml0ZS9wbHVnaW5zXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvdG1tL0RldmVsb3Blci92b2NzL3NyYy92aXRlL3BsdWdpbnMvbWR4LnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy90bW0vRGV2ZWxvcGVyL3ZvY3Mvc3JjL3ZpdGUvcGx1Z2lucy9tZHgudHNcIjtpbXBvcnQgbWR4UGx1Z2luIGZyb20gJ0BtZHgtanMvcm9sbHVwJ1xuaW1wb3J0IHsgaCB9IGZyb20gJ2hhc3RzY3JpcHQnXG5pbXBvcnQgcmVoeXBlQXV0b2xpbmtIZWFkaW5ncyBmcm9tICdyZWh5cGUtYXV0b2xpbmstaGVhZGluZ3MnXG5pbXBvcnQgcmVoeXBlUHJldHR5Q29kZSBmcm9tICdyZWh5cGUtcHJldHR5LWNvZGUnXG5pbXBvcnQgcmVoeXBlU2x1ZyBmcm9tICdyZWh5cGUtc2x1ZydcbmltcG9ydCByZW1hcmtEaXJlY3RpdmUgZnJvbSAncmVtYXJrLWRpcmVjdGl2ZSdcbmltcG9ydCByZW1hcmtGcm9udG1hdHRlciBmcm9tICdyZW1hcmstZnJvbnRtYXR0ZXInXG5pbXBvcnQgcmVtYXJrR2ZtIGZyb20gJ3JlbWFyay1nZm0nXG5pbXBvcnQgcmVtYXJrTWR4RnJvbnRtYXR0ZXIgZnJvbSAncmVtYXJrLW1keC1mcm9udG1hdHRlcidcbmltcG9ydCB7XG4gIGNyZWF0ZURpZmZQcm9jZXNzb3IsXG4gIGNyZWF0ZUZvY3VzUHJvY2Vzc29yLFxuICBjcmVhdGVIaWdobGlnaHRQcm9jZXNzb3IsXG4gIGdldEhpZ2hsaWdodGVyLFxufSBmcm9tICdzaGlraS1wcm9jZXNzb3InXG5pbXBvcnQgdHlwZSB7IFBsdWdpbk9wdGlvbiB9IGZyb20gJ3ZpdGUnXG5cbmltcG9ydCB7IHJlbWFya0NhbGxvdXQgfSBmcm9tICcuL3JlbWFyay9jYWxsb3V0LmpzJ1xuaW1wb3J0IHsgcmVtYXJrQ29kZUdyb3VwIH0gZnJvbSAnLi9yZW1hcmsvY29kZS1ncm91cC5qcydcbmltcG9ydCB7IHJlbWFya0NvZGUgfSBmcm9tICcuL3JlbWFyay9jb2RlLmpzJ1xuaW1wb3J0IHsgcmVtYXJrRGV0YWlscyB9IGZyb20gJy4vcmVtYXJrL2RldGFpbHMuanMnXG5pbXBvcnQgeyByZW1hcmtJbmZlckZyb250bWF0dGVyIH0gZnJvbSAnLi9yZW1hcmsvaW5mZXJyZWQtZnJvbnRtYXR0ZXIuanMnXG5pbXBvcnQgeyByZW1hcmtTdGVwcyB9IGZyb20gJy4vcmVtYXJrL3N0ZXBzLmpzJ1xuaW1wb3J0IHsgcmVtYXJrU3Ryb25nQmxvY2sgfSBmcm9tICcuL3JlbWFyay9zdHJvbmctYmxvY2suanMnXG5pbXBvcnQgeyByZW1hcmtTdWJoZWFkaW5nIH0gZnJvbSAnLi9yZW1hcmsvc3ViaGVhZGluZy5qcydcblxuZXhwb3J0IGZ1bmN0aW9uIG1keCgpIHtcbiAgcmV0dXJuIG1keFBsdWdpbih7XG4gICAgcmVtYXJrUGx1Z2luczogW1xuICAgICAgcmVtYXJrRGlyZWN0aXZlLFxuICAgICAgcmVtYXJrSW5mZXJGcm9udG1hdHRlcixcbiAgICAgIHJlbWFya0Zyb250bWF0dGVyLFxuICAgICAgcmVtYXJrTWR4RnJvbnRtYXR0ZXIsXG4gICAgICByZW1hcmtHZm0sXG4gICAgICByZW1hcmtDYWxsb3V0LFxuICAgICAgcmVtYXJrQ29kZSxcbiAgICAgIHJlbWFya0NvZGVHcm91cCxcbiAgICAgIHJlbWFya0RldGFpbHMsXG4gICAgICByZW1hcmtTdGVwcyxcbiAgICAgIHJlbWFya1N0cm9uZ0Jsb2NrLFxuICAgICAgcmVtYXJrU3ViaGVhZGluZyxcbiAgICBdLFxuICAgIHJlaHlwZVBsdWdpbnM6IFtcbiAgICAgIFtcbiAgICAgICAgcmVoeXBlUHJldHR5Q29kZSBhcyBhbnksXG4gICAgICAgIHtcbiAgICAgICAgICBrZWVwQmFja2dyb3VuZDogZmFsc2UsXG4gICAgICAgICAgZ2V0SGlnaGxpZ2h0ZXIob3B0aW9uczogYW55KSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0SGlnaGxpZ2h0ZXIoe1xuICAgICAgICAgICAgICAuLi5vcHRpb25zLFxuICAgICAgICAgICAgICBwcm9jZXNzb3JzOiBbXG4gICAgICAgICAgICAgICAgY3JlYXRlRGlmZlByb2Nlc3NvcigpLFxuICAgICAgICAgICAgICAgIGNyZWF0ZUZvY3VzUHJvY2Vzc29yKCksXG4gICAgICAgICAgICAgICAgY3JlYXRlSGlnaGxpZ2h0UHJvY2Vzc29yKCksXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9KVxuICAgICAgICAgIH0sXG4gICAgICAgICAgdGhlbWU6IHtcbiAgICAgICAgICAgIGRhcms6ICdnaXRodWItZGFyay1kaW1tZWQnLFxuICAgICAgICAgICAgbGlnaHQ6ICdnaXRodWItbGlnaHQnLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgICAgcmVoeXBlU2x1ZyxcbiAgICAgIFtcbiAgICAgICAgcmVoeXBlQXV0b2xpbmtIZWFkaW5ncyxcbiAgICAgICAge1xuICAgICAgICAgIGJlaGF2aW9yOiAnYXBwZW5kJyxcbiAgICAgICAgICBjb250ZW50KCkge1xuICAgICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgICAgaCgnZGl2Jywge1xuICAgICAgICAgICAgICAgIGRhdGFBdXRvbGlua0ljb246IHRydWUsXG4gICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgXVxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIF0sXG4gIH0pIGFzIFBsdWdpbk9wdGlvblxufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvdG1tL0RldmVsb3Blci92b2NzL3NyYy92aXRlL3BsdWdpbnMvcmVtYXJrXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvdG1tL0RldmVsb3Blci92b2NzL3NyYy92aXRlL3BsdWdpbnMvcmVtYXJrL2NhbGxvdXQudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3RtbS9EZXZlbG9wZXIvdm9jcy9zcmMvdml0ZS9wbHVnaW5zL3JlbWFyay9jYWxsb3V0LnRzXCI7Ly8vIDxyZWZlcmVuY2UgdHlwZXM9XCJtZGFzdC11dGlsLXRvLWhhc3RcIiAvPlxuLy8vIDxyZWZlcmVuY2UgdHlwZXM9XCJtZGFzdC11dGlsLWRpcmVjdGl2ZVwiIC8+XG5cbmltcG9ydCB7IGggfSBmcm9tICdoYXN0c2NyaXB0J1xuaW1wb3J0IHR5cGUgeyBSb290IH0gZnJvbSAnbWRhc3QnXG5pbXBvcnQgeyB2aXNpdCB9IGZyb20gJ3VuaXN0LXV0aWwtdmlzaXQnXG5cbmV4cG9ydCBmdW5jdGlvbiByZW1hcmtDYWxsb3V0KCkge1xuICByZXR1cm4gKHRyZWU6IFJvb3QpID0+IHtcbiAgICB2aXNpdCh0cmVlLCAobm9kZSkgPT4ge1xuICAgICAgaWYgKG5vZGUudHlwZSAhPT0gJ2NvbnRhaW5lckRpcmVjdGl2ZScpIHJldHVyblxuICAgICAgaWYgKFxuICAgICAgICBub2RlLm5hbWUgIT09ICdjYWxsb3V0JyAmJlxuICAgICAgICBub2RlLm5hbWUgIT09ICdpbmZvJyAmJlxuICAgICAgICBub2RlLm5hbWUgIT09ICd3YXJuaW5nJyAmJlxuICAgICAgICBub2RlLm5hbWUgIT09ICdkYW5nZXInICYmXG4gICAgICAgIG5vZGUubmFtZSAhPT0gJ3RpcCcgJiZcbiAgICAgICAgbm9kZS5uYW1lICE9PSAnc3VjY2VzcycgJiZcbiAgICAgICAgbm9kZS5uYW1lICE9PSAnbm90ZSdcbiAgICAgIClcbiAgICAgICAgcmV0dXJuXG5cbiAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3JcbiAgICAgIGNvbnN0IGxhYmVsID0gbm9kZS5jaGlsZHJlbi5maW5kKChjaGlsZCkgPT4gY2hpbGQuZGF0YT8uZGlyZWN0aXZlTGFiZWwpPy5jaGlsZHJlblswXS52YWx1ZVxuXG4gICAgICBjb25zdCBkYXRhID0gbm9kZS5kYXRhIHx8IChub2RlLmRhdGEgPSB7fSlcbiAgICAgIGNvbnN0IHRhZ05hbWUgPSAnYXNpZGUnXG5cbiAgICAgIGlmIChsYWJlbCkge1xuICAgICAgICBub2RlLmNoaWxkcmVuID0gbm9kZS5jaGlsZHJlbi5maWx0ZXIoKGNoaWxkOiBhbnkpID0+ICFjaGlsZC5kYXRhPy5kaXJlY3RpdmVMYWJlbClcbiAgICAgICAgbm9kZS5jaGlsZHJlbi51bnNoaWZ0KHtcbiAgICAgICAgICB0eXBlOiAncGFyYWdyYXBoJyxcbiAgICAgICAgICBkYXRhOiB7IGhQcm9wZXJ0aWVzOiB7ICdkYXRhLWNhbGxvdXQtdGl0bGUnOiB0cnVlIH0gfSxcbiAgICAgICAgICBjaGlsZHJlbjogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICB0eXBlOiAnc3Ryb25nJyxcbiAgICAgICAgICAgICAgY2hpbGRyZW46IFt7IHR5cGU6ICd0ZXh0JywgdmFsdWU6IGxhYmVsIH1dLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9KVxuICAgICAgfVxuXG4gICAgICBkYXRhLmhOYW1lID0gdGFnTmFtZVxuICAgICAgZGF0YS5oUHJvcGVydGllcyA9IHtcbiAgICAgICAgLi4uaCh0YWdOYW1lLCBub2RlLmF0dHJpYnV0ZXMgfHwge30pLnByb3BlcnRpZXMsXG4gICAgICAgICdkYXRhLWNhbGxvdXQnOiBub2RlLm5hbWUgIT09ICdjYWxsb3V0JyA/IG5vZGUubmFtZSA6IHRydWUsXG4gICAgICB9XG4gICAgfSlcbiAgfVxufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvdG1tL0RldmVsb3Blci92b2NzL3NyYy92aXRlL3BsdWdpbnMvcmVtYXJrXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvdG1tL0RldmVsb3Blci92b2NzL3NyYy92aXRlL3BsdWdpbnMvcmVtYXJrL2NvZGUtZ3JvdXAudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3RtbS9EZXZlbG9wZXIvdm9jcy9zcmMvdml0ZS9wbHVnaW5zL3JlbWFyay9jb2RlLWdyb3VwLnRzXCI7Ly8vIDxyZWZlcmVuY2UgdHlwZXM9XCJtZGFzdC11dGlsLXRvLWhhc3RcIiAvPlxuLy8vIDxyZWZlcmVuY2UgdHlwZXM9XCJtZGFzdC11dGlsLWRpcmVjdGl2ZVwiIC8+XG5cbmltcG9ydCB7IGggfSBmcm9tICdoYXN0c2NyaXB0J1xuaW1wb3J0IHR5cGUgeyBCbG9ja0NvbnRlbnQsIERlZmluaXRpb25Db250ZW50LCBSb290IH0gZnJvbSAnbWRhc3QnXG5pbXBvcnQgeyB2aXNpdCB9IGZyb20gJ3VuaXN0LXV0aWwtdmlzaXQnXG5cbmV4cG9ydCBmdW5jdGlvbiByZW1hcmtDb2RlR3JvdXAoKSB7XG4gIHJldHVybiAodHJlZTogUm9vdCkgPT4ge1xuICAgIHZpc2l0KHRyZWUsIChub2RlKSA9PiB7XG4gICAgICBpZiAobm9kZS50eXBlICE9PSAnY29udGFpbmVyRGlyZWN0aXZlJykgcmV0dXJuXG4gICAgICBpZiAobm9kZS5uYW1lICE9PSAnY29kZS1ncm91cCcpIHJldHVyblxuXG4gICAgICBjb25zdCBkYXRhID0gbm9kZS5kYXRhIHx8IChub2RlLmRhdGEgPSB7fSlcbiAgICAgIGNvbnN0IHRhZ05hbWUgPSAnZGl2J1xuXG4gICAgICBub2RlLmF0dHJpYnV0ZXMgPSB7XG4gICAgICAgIC4uLm5vZGUuYXR0cmlidXRlcyxcbiAgICAgICAgY2xhc3M6ICdjb2RlLWdyb3VwJyxcbiAgICAgIH1cblxuICAgICAgZGF0YS5oTmFtZSA9IHRhZ05hbWVcbiAgICAgIGRhdGEuaFByb3BlcnRpZXMgPSBoKHRhZ05hbWUsIG5vZGUuYXR0cmlidXRlcyB8fCB7fSkucHJvcGVydGllc1xuXG4gICAgICBub2RlLmNoaWxkcmVuID0gbm9kZS5jaGlsZHJlblxuICAgICAgICAubWFwKChjaGlsZCkgPT4ge1xuICAgICAgICAgIGNvbnN0IG1hdGNoID0gJ21ldGEnIGluIGNoaWxkICYmIGNoaWxkPy5tZXRhPy5tYXRjaCgvXlxcWyguKilcXF0vKVxuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiAncGFyYWdyYXBoJyxcbiAgICAgICAgICAgIGNoaWxkcmVuOiBbY2hpbGRdLFxuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICBoTmFtZTogJ2RpdicsXG4gICAgICAgICAgICAgIGhQcm9wZXJ0aWVzOiBtYXRjaFxuICAgICAgICAgICAgICAgID8ge1xuICAgICAgICAgICAgICAgICAgICAnZGF0YS10aXRsZSc6IG1hdGNoWzFdLFxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5maWx0ZXIoQm9vbGVhbikgYXMgKEJsb2NrQ29udGVudCB8IERlZmluaXRpb25Db250ZW50KVtdXG4gICAgfSlcbiAgfVxufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvdG1tL0RldmVsb3Blci92b2NzL3NyYy92aXRlL3BsdWdpbnMvcmVtYXJrXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvdG1tL0RldmVsb3Blci92b2NzL3NyYy92aXRlL3BsdWdpbnMvcmVtYXJrL2NvZGUudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3RtbS9EZXZlbG9wZXIvdm9jcy9zcmMvdml0ZS9wbHVnaW5zL3JlbWFyay9jb2RlLnRzXCI7Ly8vIDxyZWZlcmVuY2UgdHlwZXM9XCJtZGFzdC11dGlsLXRvLWhhc3RcIiAvPlxuLy8vIDxyZWZlcmVuY2UgdHlwZXM9XCJtZGFzdC11dGlsLWRpcmVjdGl2ZVwiIC8+XG5cbmltcG9ydCB0eXBlIHsgUm9vdCB9IGZyb20gJ21kYXN0J1xuaW1wb3J0IHsgdmlzaXQgfSBmcm9tICd1bmlzdC11dGlsLXZpc2l0J1xuXG5leHBvcnQgZnVuY3Rpb24gcmVtYXJrQ29kZSgpIHtcbiAgcmV0dXJuICh0cmVlOiBSb290KSA9PiB7XG4gICAgdmlzaXQodHJlZSwgKG5vZGUsIF8sIHBhcmVudCkgPT4ge1xuICAgICAgaWYgKG5vZGUudHlwZSAhPT0gJ2NvZGUnKSByZXR1cm5cbiAgICAgIGlmIChwYXJlbnQ/LnR5cGUgPT09ICdjb250YWluZXJEaXJlY3RpdmUnICYmIHBhcmVudC5uYW1lICE9PSAnc3RlcHMnKSByZXR1cm5cblxuICAgICAgY29uc3QgW21hdGNoLCB0aXRsZV0gPSBub2RlLm1ldGE/Lm1hdGNoKC9cXFsoLiopXFxdLykgfHwgW11cbiAgICAgIGlmIChtYXRjaCkgbm9kZS5tZXRhID0gbm9kZS5tZXRhPy5yZXBsYWNlKG1hdGNoLCBgdGl0bGU9XFxcIiR7dGl0bGV9XFxcImApXG4gICAgfSlcbiAgfVxufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvdG1tL0RldmVsb3Blci92b2NzL3NyYy92aXRlL3BsdWdpbnMvcmVtYXJrXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvdG1tL0RldmVsb3Blci92b2NzL3NyYy92aXRlL3BsdWdpbnMvcmVtYXJrL2RldGFpbHMudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3RtbS9EZXZlbG9wZXIvdm9jcy9zcmMvdml0ZS9wbHVnaW5zL3JlbWFyay9kZXRhaWxzLnRzXCI7Ly8vIDxyZWZlcmVuY2UgdHlwZXM9XCJtZGFzdC11dGlsLXRvLWhhc3RcIiAvPlxuLy8vIDxyZWZlcmVuY2UgdHlwZXM9XCJtZGFzdC11dGlsLWRpcmVjdGl2ZVwiIC8+XG5cbmltcG9ydCB0eXBlIHsgUm9vdCB9IGZyb20gJ21kYXN0J1xuaW1wb3J0IHsgdmlzaXQgfSBmcm9tICd1bmlzdC11dGlsLXZpc2l0J1xuXG5leHBvcnQgZnVuY3Rpb24gcmVtYXJrRGV0YWlscygpIHtcbiAgcmV0dXJuICh0cmVlOiBSb290KSA9PiB7XG4gICAgdmlzaXQodHJlZSwgKG5vZGUpID0+IHtcbiAgICAgIGlmIChub2RlLnR5cGUgIT09ICdjb250YWluZXJEaXJlY3RpdmUnKSByZXR1cm5cbiAgICAgIGlmIChub2RlLm5hbWUgIT09ICdkZXRhaWxzJykgcmV0dXJuXG5cbiAgICAgIGNvbnN0IGRhdGEgPSBub2RlLmRhdGEgfHwgKG5vZGUuZGF0YSA9IHt9KVxuICAgICAgY29uc3QgdGFnTmFtZSA9ICdkZXRhaWxzJ1xuXG4gICAgICBjb25zdCBzdW1tYXJ5Q2hpbGQgPSBub2RlLmNoaWxkcmVuWzBdXG4gICAgICBpZiAoc3VtbWFyeUNoaWxkLnR5cGUgPT09ICdwYXJhZ3JhcGgnICYmIHN1bW1hcnlDaGlsZC5kYXRhPy5kaXJlY3RpdmVMYWJlbClcbiAgICAgICAgc3VtbWFyeUNoaWxkLmRhdGEuaE5hbWUgPSAnc3VtbWFyeSdcbiAgICAgIGVsc2VcbiAgICAgICAgbm9kZS5jaGlsZHJlbi51bnNoaWZ0KHtcbiAgICAgICAgICB0eXBlOiAncGFyYWdyYXBoJyxcbiAgICAgICAgICBjaGlsZHJlbjogW3sgdHlwZTogJ3RleHQnLCB2YWx1ZTogJ0RldGFpbHMnIH1dLFxuICAgICAgICAgIGRhdGE6IHsgaE5hbWU6ICdzdW1tYXJ5JyB9LFxuICAgICAgICB9KVxuXG4gICAgICBkYXRhLmhOYW1lID0gdGFnTmFtZVxuICAgIH0pXG4gIH1cbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL3RtbS9EZXZlbG9wZXIvdm9jcy9zcmMvdml0ZS9wbHVnaW5zL3JlbWFya1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL3RtbS9EZXZlbG9wZXIvdm9jcy9zcmMvdml0ZS9wbHVnaW5zL3JlbWFyay9pbmZlcnJlZC1mcm9udG1hdHRlci50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvdG1tL0RldmVsb3Blci92b2NzL3NyYy92aXRlL3BsdWdpbnMvcmVtYXJrL2luZmVycmVkLWZyb250bWF0dGVyLnRzXCI7Ly8vIDxyZWZlcmVuY2UgdHlwZXM9XCJtZGFzdC11dGlsLXRvLWhhc3RcIiAvPlxuLy8vIDxyZWZlcmVuY2UgdHlwZXM9XCJtZGFzdC11dGlsLWRpcmVjdGl2ZVwiIC8+XG5cbmltcG9ydCB0eXBlIHsgUm9vdCwgWWFtbCB9IGZyb20gJ21kYXN0J1xuaW1wb3J0IHsgdmlzaXQgfSBmcm9tICd1bmlzdC11dGlsLXZpc2l0J1xuXG5leHBvcnQgZnVuY3Rpb24gcmVtYXJrSW5mZXJGcm9udG1hdHRlcigpIHtcbiAgcmV0dXJuICh0cmVlOiBSb290KSA9PiB7XG4gICAgdmlzaXQodHJlZSwgKG5vZGUsIF8sIHBhcmVudCkgPT4ge1xuICAgICAgaWYgKHBhcmVudD8udHlwZSAhPT0gJ3Jvb3QnKSByZXR1cm5cblxuICAgICAgaWYgKG5vZGUudHlwZSA9PT0gJ2hlYWRpbmcnICYmIG5vZGUuZGVwdGggPT09IDEpIHtcbiAgICAgICAgaWYgKG5vZGUuY2hpbGRyZW4ubGVuZ3RoID09PSAwKSByZXR1cm5cblxuICAgICAgICBjb25zdCBjaGlsZCA9IG5vZGUuY2hpbGRyZW5bMF1cbiAgICAgICAgaWYgKCEoJ3ZhbHVlJyBpbiBjaGlsZCkpIHJldHVyblxuXG4gICAgICAgIGNvbnN0IHZhbHVlID0gY2hpbGQudmFsdWVcbiAgICAgICAgY29uc3QgWywgdGl0bGUsIGRlc2NyaXB0aW9uXSA9IHZhbHVlLmluY2x1ZGVzKCdbJylcbiAgICAgICAgICA/IHZhbHVlLm1hdGNoKC8oLiopIFxcWyguKilcXF0vKSB8fCBbXVxuICAgICAgICAgIDogW3VuZGVmaW5lZCwgdmFsdWVdXG5cbiAgICAgICAgY29uc3QgZnJvbnRtYXR0ZXJJbmRleCA9IHBhcmVudC5jaGlsZHJlbi5maW5kSW5kZXgoKGNoaWxkKSA9PiBjaGlsZC50eXBlID09PSAneWFtbCcpXG4gICAgICAgIGNvbnN0IGluZGV4ID0gZnJvbnRtYXR0ZXJJbmRleCA+IDAgPyBmcm9udG1hdHRlckluZGV4IDogMFxuXG4gICAgICAgIGNvbnN0IGZyb250bWF0dGVyID0ge1xuICAgICAgICAgIC4uLihwYXJlbnQuY2hpbGRyZW5bZnJvbnRtYXR0ZXJJbmRleF0gfHwge1xuICAgICAgICAgICAgdmFsdWU6ICcnLFxuICAgICAgICAgICAgdHlwZTogJ3lhbWwnLFxuICAgICAgICAgIH0pLFxuICAgICAgICB9IGFzIFlhbWxcbiAgICAgICAgaWYgKCFmcm9udG1hdHRlci52YWx1ZS5pbmNsdWRlcygndGl0bGUnKSkgZnJvbnRtYXR0ZXIudmFsdWUgKz0gYFxcbnRpdGxlOiAke3RpdGxlfVxcbmBcbiAgICAgICAgaWYgKCFmcm9udG1hdHRlci52YWx1ZS5pbmNsdWRlcygnZGVzY3JpcHRpb24nKSlcbiAgICAgICAgICBmcm9udG1hdHRlci52YWx1ZSArPSBgXFxuZGVzY3JpcHRpb246ICR7ZGVzY3JpcHRpb259XFxuYFxuXG4gICAgICAgIGlmIChmcm9udG1hdHRlckluZGV4ID09PSAtMSkgdHJlZS5jaGlsZHJlbi51bnNoaWZ0KGZyb250bWF0dGVyKVxuICAgICAgICBlbHNlIHBhcmVudC5jaGlsZHJlbi5zcGxpY2UoaW5kZXgsIDEsIGZyb250bWF0dGVyKVxuICAgICAgfVxuICAgIH0pXG4gIH1cbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL3RtbS9EZXZlbG9wZXIvdm9jcy9zcmMvdml0ZS9wbHVnaW5zL3JlbWFya1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL3RtbS9EZXZlbG9wZXIvdm9jcy9zcmMvdml0ZS9wbHVnaW5zL3JlbWFyay9zdGVwcy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvdG1tL0RldmVsb3Blci92b2NzL3NyYy92aXRlL3BsdWdpbnMvcmVtYXJrL3N0ZXBzLnRzXCI7Ly8vIDxyZWZlcmVuY2UgdHlwZXM9XCJtZGFzdC11dGlsLXRvLWhhc3RcIiAvPlxuLy8vIDxyZWZlcmVuY2UgdHlwZXM9XCJtZGFzdC11dGlsLWRpcmVjdGl2ZVwiIC8+XG5cbmltcG9ydCB7IGggfSBmcm9tICdoYXN0c2NyaXB0J1xuaW1wb3J0IHR5cGUgeyBIZWFkaW5nLCBSb290IH0gZnJvbSAnbWRhc3QnXG5pbXBvcnQgeyB2aXNpdCB9IGZyb20gJ3VuaXN0LXV0aWwtdmlzaXQnXG5cbmV4cG9ydCBmdW5jdGlvbiByZW1hcmtTdGVwcygpIHtcbiAgcmV0dXJuICh0cmVlOiBSb290KSA9PiB7XG4gICAgdmlzaXQodHJlZSwgKG5vZGUpID0+IHtcbiAgICAgIGlmIChub2RlLnR5cGUgIT09ICdjb250YWluZXJEaXJlY3RpdmUnKSByZXR1cm5cbiAgICAgIGlmIChub2RlLm5hbWUgIT09ICdzdGVwcycpIHJldHVyblxuXG4gICAgICBjb25zdCBkYXRhID0gbm9kZS5kYXRhIHx8IChub2RlLmRhdGEgPSB7fSlcbiAgICAgIGNvbnN0IHRhZ05hbWUgPSAnZGl2J1xuXG4gICAgICBub2RlLmF0dHJpYnV0ZXMgPSB7XG4gICAgICAgIC4uLm5vZGUuYXR0cmlidXRlcyxcbiAgICAgICAgJ2RhdGEtdm9jcy1zdGVwcyc6ICd0cnVlJyxcbiAgICAgIH1cblxuICAgICAgZGF0YS5oTmFtZSA9IHRhZ05hbWVcbiAgICAgIGRhdGEuaFByb3BlcnRpZXMgPSBoKHRhZ05hbWUsIG5vZGUuYXR0cmlidXRlcyB8fCB7fSkucHJvcGVydGllc1xuXG4gICAgICBjb25zdCBkZXB0aCA9IChub2RlLmNoaWxkcmVuLmZpbmQoKGNoaWxkKSA9PiBjaGlsZC50eXBlID09PSAnaGVhZGluZycpIGFzIEhlYWRpbmcpPy5kZXB0aCA/PyAyXG5cbiAgICAgIGxldCBjdXJyZW50Q2hpbGRcbiAgICAgIGNvbnN0IGNoaWxkcmVuID0gW11cbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2Ygbm9kZS5jaGlsZHJlbikge1xuICAgICAgICBpZiAoY2hpbGQudHlwZSA9PT0gJ2hlYWRpbmcnICYmIGNoaWxkLmRlcHRoID09PSBkZXB0aCkge1xuICAgICAgICAgIGlmIChjdXJyZW50Q2hpbGQgJiYgY3VycmVudENoaWxkLmNoaWxkcmVuLmxlbmd0aCA+IDApIGNoaWxkcmVuLnB1c2goY3VycmVudENoaWxkKVxuICAgICAgICAgIGN1cnJlbnRDaGlsZCA9IHtcbiAgICAgICAgICAgIHR5cGU6ICdwYXJhZ3JhcGgnLFxuICAgICAgICAgICAgY2hpbGRyZW46IFtdLFxuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICBoTmFtZTogJ2RpdicsXG4gICAgICAgICAgICAgIGhQcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgJ2RhdGEtZGVwdGgnOiBkZXB0aCxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSBhcyBhbnlcbiAgICAgICAgfVxuICAgICAgICBjdXJyZW50Q2hpbGQhLmNoaWxkcmVuLnB1c2goY2hpbGQpXG4gICAgICB9XG4gICAgICBjaGlsZHJlbi5wdXNoKGN1cnJlbnRDaGlsZClcblxuICAgICAgbm9kZS5jaGlsZHJlbiA9IGNoaWxkcmVuXG4gICAgfSlcbiAgfVxufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvdG1tL0RldmVsb3Blci92b2NzL3NyYy92aXRlL3BsdWdpbnMvcmVtYXJrXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvdG1tL0RldmVsb3Blci92b2NzL3NyYy92aXRlL3BsdWdpbnMvcmVtYXJrL3N0cm9uZy1ibG9jay50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvdG1tL0RldmVsb3Blci92b2NzL3NyYy92aXRlL3BsdWdpbnMvcmVtYXJrL3N0cm9uZy1ibG9jay50c1wiOy8vLyA8cmVmZXJlbmNlIHR5cGVzPVwibWRhc3QtdXRpbC10by1oYXN0XCIgLz5cbi8vLyA8cmVmZXJlbmNlIHR5cGVzPVwibWRhc3QtdXRpbC1kaXJlY3RpdmVcIiAvPlxuXG5pbXBvcnQgdHlwZSB7IFJvb3QgfSBmcm9tICdtZGFzdCdcbmltcG9ydCB7IHZpc2l0IH0gZnJvbSAndW5pc3QtdXRpbC12aXNpdCdcblxuZXhwb3J0IGZ1bmN0aW9uIHJlbWFya1N0cm9uZ0Jsb2NrKCkge1xuICByZXR1cm4gKHRyZWU6IFJvb3QpID0+IHtcbiAgICB2aXNpdCh0cmVlLCAnc3Ryb25nJywgKG5vZGUsIF8sIHBhcmVudCkgPT4ge1xuICAgICAgaWYgKCFwYXJlbnQpIHJldHVyblxuICAgICAgaWYgKHBhcmVudC50eXBlICE9PSAncGFyYWdyYXBoJykgcmV0dXJuXG4gICAgICBpZiAocGFyZW50LmNoaWxkcmVuLmxlbmd0aCA+IDEpIHJldHVyblxuXG4gICAgICBwYXJlbnQudHlwZSA9ICdzdHJvbmcnIGFzIGFueVxuICAgICAgcGFyZW50LmNoaWxkcmVuID0gbm9kZS5jaGlsZHJlblxuICAgIH0pXG4gIH1cbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL3RtbS9EZXZlbG9wZXIvdm9jcy9zcmMvdml0ZS9wbHVnaW5zL3JlbWFya1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL3RtbS9EZXZlbG9wZXIvdm9jcy9zcmMvdml0ZS9wbHVnaW5zL3JlbWFyay9zdWJoZWFkaW5nLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy90bW0vRGV2ZWxvcGVyL3ZvY3Mvc3JjL3ZpdGUvcGx1Z2lucy9yZW1hcmsvc3ViaGVhZGluZy50c1wiOy8vLyA8cmVmZXJlbmNlIHR5cGVzPVwibWRhc3QtdXRpbC10by1oYXN0XCIgLz5cbi8vLyA8cmVmZXJlbmNlIHR5cGVzPVwibWRhc3QtdXRpbC1kaXJlY3RpdmVcIiAvPlxuXG5pbXBvcnQgdHlwZSB7IFJvb3QgfSBmcm9tICdtZGFzdCdcbmltcG9ydCB7IHZpc2l0IH0gZnJvbSAndW5pc3QtdXRpbC12aXNpdCdcblxuZXhwb3J0IGZ1bmN0aW9uIHJlbWFya1N1YmhlYWRpbmcoKSB7XG4gIHJldHVybiAodHJlZTogUm9vdCkgPT4ge1xuICAgIHZpc2l0KHRyZWUsICdoZWFkaW5nJywgKG5vZGUsIGluZGV4LCBwYXJlbnQpID0+IHtcbiAgICAgIGlmICghaW5kZXgpIHJldHVyblxuICAgICAgaWYgKG5vZGUuZGVwdGggIT09IDEpIHJldHVyblxuICAgICAgaWYgKG5vZGUuY2hpbGRyZW4ubGVuZ3RoID09PSAwKSByZXR1cm5cblxuICAgICAgY29uc3Qgc3ViaGVhZGluZ1JlZ2V4ID0gLyBcXFsoLiopXFxdJC9cbiAgICAgIGNvbnN0IHN1YmhlYWRpbmdDaGlsZCA9IG5vZGUuY2hpbGRyZW4uZmluZChcbiAgICAgICAgKGNoaWxkKSA9PlxuICAgICAgICAgICd2YWx1ZScgaW4gY2hpbGQgJiYgdHlwZW9mIGNoaWxkLnZhbHVlID09PSAnc3RyaW5nJyAmJiBjaGlsZC52YWx1ZS5tYXRjaChzdWJoZWFkaW5nUmVnZXgpLFxuICAgICAgKSBhcyBhbnlcbiAgICAgIGNvbnN0IFttYXRjaCwgc3ViaGVhZGluZ10gPSBzdWJoZWFkaW5nQ2hpbGQ/LnZhbHVlPy5tYXRjaChzdWJoZWFkaW5nUmVnZXgpID8/IFtdXG4gICAgICBpZiAoc3ViaGVhZGluZ0NoaWxkKSBzdWJoZWFkaW5nQ2hpbGQudmFsdWUgPSBzdWJoZWFkaW5nQ2hpbGQ/LnZhbHVlPy5yZXBsYWNlKG1hdGNoLCAnJylcblxuICAgICAgLy8gcmVtb3ZlIG9yaWdpbmFsIGhlYWRpbmdcbiAgICAgIHBhcmVudD8uY2hpbGRyZW4uc3BsaWNlKGluZGV4LCAxKVxuXG4gICAgICBjb25zdCBoZWFkZXIgPSB7XG4gICAgICAgIHR5cGU6ICdwYXJhZ3JhcGgnLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgaE5hbWU6ICdoZWFkZXInLFxuICAgICAgICB9LFxuICAgICAgICBjaGlsZHJlbjogW1xuICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgc3ViaGVhZGluZ1xuICAgICAgICAgICAgPyB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ3BhcmFncmFwaCcsXG4gICAgICAgICAgICAgICAgY2hpbGRyZW46IFt7IHR5cGU6ICd0ZXh0JywgdmFsdWU6IHN1YmhlYWRpbmcgfV0sXG4gICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgaE5hbWU6ICdkaXYnLFxuICAgICAgICAgICAgICAgICAgaFByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgcm9sZTogJ2RvYy1zdWJ0aXRsZScsXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgICBdLmZpbHRlcihCb29sZWFuKSxcbiAgICAgIH0gYXMgYW55XG4gICAgICBwYXJlbnQ/LmNoaWxkcmVuLnNwbGljZShpbmRleCwgMCwgaGVhZGVyKVxuICAgIH0pXG4gIH1cbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL3RtbS9EZXZlbG9wZXIvdm9jcy9zcmMvdml0ZS9wbHVnaW5zXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvdG1tL0RldmVsb3Blci92b2NzL3NyYy92aXRlL3BsdWdpbnMvdmlydHVhbC1jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3RtbS9EZXZlbG9wZXIvdm9jcy9zcmMvdml0ZS9wbHVnaW5zL3ZpcnR1YWwtY29uZmlnLnRzXCI7aW1wb3J0IHsgdHlwZSBQbHVnaW5PcHRpb24gfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHsgcmVzb2x2ZVZvY3NDb25maWcgfSBmcm9tICcuLi91dGlscy5qcydcblxuZXhwb3J0IGZ1bmN0aW9uIHZpcnR1YWxDb25maWcoKTogUGx1Z2luT3B0aW9uIHtcbiAgY29uc3QgdmlydHVhbE1vZHVsZUlkID0gJ3ZpcnR1YWw6Y29uZmlnJ1xuICBjb25zdCByZXNvbHZlZFZpcnR1YWxNb2R1bGVJZCA9IGBcXDAke3ZpcnR1YWxNb2R1bGVJZH1gXG5cbiAgcmV0dXJuIHtcbiAgICBuYW1lOiAndm9jcy1jb25maWcnLFxuICAgIGFzeW5jIGNvbmZpZ3VyZVNlcnZlcihzZXJ2ZXIpIHtcbiAgICAgIGNvbnN0IHsgY29uZmlnUGF0aCB9ID0gYXdhaXQgcmVzb2x2ZVZvY3NDb25maWcoKVxuICAgICAgaWYgKGNvbmZpZ1BhdGgpIHtcbiAgICAgICAgc2VydmVyLndhdGNoZXIuYWRkKGNvbmZpZ1BhdGgpXG4gICAgICAgIHNlcnZlci53YXRjaGVyLm9uKCdjaGFuZ2UnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgc2VydmVyLndzLnNlbmQoJ3ZvY3M6Y29uZmlnJywgKGF3YWl0IHJlc29sdmVWb2NzQ29uZmlnKCkpLmNvbmZpZylcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9LFxuICAgIHJlc29sdmVJZChpZCkge1xuICAgICAgaWYgKGlkID09PSB2aXJ0dWFsTW9kdWxlSWQpIHJldHVybiByZXNvbHZlZFZpcnR1YWxNb2R1bGVJZFxuICAgICAgcmV0dXJuXG4gICAgfSxcbiAgICBhc3luYyBsb2FkKGlkKSB7XG4gICAgICBpZiAoaWQgPT09IHJlc29sdmVkVmlydHVhbE1vZHVsZUlkKSB7XG4gICAgICAgIGNvbnN0IHsgY29uZmlnIH0gPSBhd2FpdCByZXNvbHZlVm9jc0NvbmZpZygpXG4gICAgICAgIC8vIFRPRE86IHNlcmlhbGl6ZSBmbnNcbiAgICAgICAgcmV0dXJuIGBleHBvcnQgY29uc3QgY29uZmlnID0gJHtKU09OLnN0cmluZ2lmeShjb25maWcpfWBcbiAgICAgIH1cbiAgICAgIHJldHVyblxuICAgIH0sXG4gICAgaGFuZGxlSG90VXBkYXRlKCkge1xuICAgICAgLy8gVE9ETzogaGFuZGxlIGNoYW5nZXNcbiAgICAgIHJldHVyblxuICAgIH0sXG4gIH1cbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL3RtbS9EZXZlbG9wZXIvdm9jcy9zcmMvdml0ZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL3RtbS9EZXZlbG9wZXIvdm9jcy9zcmMvdml0ZS91dGlscy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvdG1tL0RldmVsb3Blci92b2NzL3NyYy92aXRlL3V0aWxzLnRzXCI7aW1wb3J0IHsgZXhpc3RzU3luYyB9IGZyb20gJ25vZGU6ZnMnXG5pbXBvcnQgeyByZXNvbHZlIH0gZnJvbSAnbm9kZTpwYXRoJ1xuaW1wb3J0IHsgdHlwZSBDb25maWdFbnYsIGxvYWRDb25maWdGcm9tRmlsZSB9IGZyb20gJ3ZpdGUnXG5pbXBvcnQgdHlwZSB7IFBhcnNlZENvbmZpZyB9IGZyb20gJy4uL2NvbmZpZy5qcydcblxuY29uc3QgZXh0ZW5zaW9ucyA9IFsnanMnLCAndHMnLCAnbWpzJywgJ210cyddXG5jb25zdCBkZWZhdWx0Q29uZmlnUGF0aHMgPSBbJy52b2NzL2NvbmZpZycsICd2b2NzLmNvbmZpZyddXG5cbnR5cGUgUmVzb2x2ZVZvY3NDb25maWdQYXJhbWV0ZXJzID0ge1xuICBjb21tYW5kPzogQ29uZmlnRW52Wydjb21tYW5kJ11cbiAgY29uZmlnUGF0aD86IHN0cmluZ1xuICBtb2RlPzogQ29uZmlnRW52Wydtb2RlJ11cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlc29sdmVWb2NzQ29uZmlnKHBhcmFtZXRlcnM6IFJlc29sdmVWb2NzQ29uZmlnUGFyYW1ldGVycyA9IHt9KSB7XG4gIGNvbnN0IHsgY29tbWFuZCA9ICdzZXJ2ZScsIG1vZGUgPSAnZGV2ZWxvcG1lbnQnIH0gPSBwYXJhbWV0ZXJzXG5cbiAgY29uc3QgY29uZmlnUGF0aCA9ICgoKSA9PiB7XG4gICAgZm9yIChjb25zdCBleHQgb2YgZXh0ZW5zaW9ucykge1xuICAgICAgaWYgKHBhcmFtZXRlcnMuY29uZmlnUGF0aCkgcmV0dXJuIHBhcmFtZXRlcnMuY29uZmlnUGF0aFxuICAgICAgZm9yIChjb25zdCBmaWxlUGF0aCBvZiBkZWZhdWx0Q29uZmlnUGF0aHMpXG4gICAgICAgIGlmIChleGlzdHNTeW5jKHJlc29sdmUocHJvY2Vzcy5jd2QoKSwgYCR7ZmlsZVBhdGh9LiR7ZXh0fWApKSkgcmV0dXJuIGAke2ZpbGVQYXRofS4ke2V4dH1gXG4gICAgfVxuICAgIHJldHVyblxuICB9KSgpXG5cbiAgY29uc3QgcmVzdWx0ID0gYXdhaXQgbG9hZENvbmZpZ0Zyb21GaWxlKHsgY29tbWFuZCwgbW9kZSB9LCBjb25maWdQYXRoKVxuXG4gIHJldHVybiB7XG4gICAgY29uZmlnOiAocmVzdWx0ID8gcmVzdWx0LmNvbmZpZyA6IHt9KSBhcyBQYXJzZWRDb25maWcsXG4gICAgY29uZmlnUGF0aCxcbiAgfVxufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvdG1tL0RldmVsb3Blci92b2NzL3NyYy92aXRlL3BsdWdpbnNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy90bW0vRGV2ZWxvcGVyL3ZvY3Mvc3JjL3ZpdGUvcGx1Z2lucy92aXJ0dWFsLXJvb3QudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3RtbS9EZXZlbG9wZXIvdm9jcy9zcmMvdml0ZS9wbHVnaW5zL3ZpcnR1YWwtcm9vdC50c1wiO2ltcG9ydCB7IGV4aXN0c1N5bmMgfSBmcm9tICdub2RlOmZzJ1xuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ25vZGU6cGF0aCdcbmltcG9ydCB0eXBlIHsgUGx1Z2luT3B0aW9uIH0gZnJvbSAndml0ZSdcblxudHlwZSBSb3V0ZXNQYXJhbWV0ZXJzID0geyByb290Pzogc3RyaW5nIH1cblxuZXhwb3J0IGZ1bmN0aW9uIHZpcnR1YWxSb290KHtcbiAgcm9vdCA9IHJlc29sdmUocHJvY2Vzcy5jd2QoKSwgJy4vcm9vdC50c3gnKSxcbn06IFJvdXRlc1BhcmFtZXRlcnMgPSB7fSk6IFBsdWdpbk9wdGlvbiB7XG4gIGNvbnN0IHZpcnR1YWxNb2R1bGVJZCA9ICd2aXJ0dWFsOnJvb3QnXG4gIGNvbnN0IHJlc29sdmVkVmlydHVhbE1vZHVsZUlkID0gYFxcMCR7dmlydHVhbE1vZHVsZUlkfWBcblxuICByZXR1cm4ge1xuICAgIG5hbWU6ICdyb3V0ZXMnLFxuICAgIHJlc29sdmVJZChpZCkge1xuICAgICAgaWYgKGlkID09PSB2aXJ0dWFsTW9kdWxlSWQpIHJldHVybiByZXNvbHZlZFZpcnR1YWxNb2R1bGVJZFxuICAgICAgcmV0dXJuXG4gICAgfSxcbiAgICBsb2FkKGlkKSB7XG4gICAgICBpZiAoaWQgPT09IHJlc29sdmVkVmlydHVhbE1vZHVsZUlkKSB7XG4gICAgICAgIGlmICghZXhpc3RzU3luYyhyb290KSkgcmV0dXJuICdleHBvcnQgY29uc3QgUm9vdCA9ICh7IGNoaWxkcmVuIH0pID0+IGNoaWxkcmVuOydcbiAgICAgICAgcmV0dXJuIGBleHBvcnQgeyBkZWZhdWx0IGFzIFJvb3QgfSBmcm9tIFwiJHtyb290fVwiO2BcbiAgICAgIH1cbiAgICAgIHJldHVyblxuICAgIH0sXG4gIH1cbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL3RtbS9EZXZlbG9wZXIvdm9jcy9zcmMvdml0ZS9wbHVnaW5zXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvdG1tL0RldmVsb3Blci92b2NzL3NyYy92aXRlL3BsdWdpbnMvdmlydHVhbC1yb3V0ZXMudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3RtbS9EZXZlbG9wZXIvdm9jcy9zcmMvdml0ZS9wbHVnaW5zL3ZpcnR1YWwtcm91dGVzLnRzXCI7aW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ25vZGU6cGF0aCdcbmltcG9ydCB7IGdsb2JieSB9IGZyb20gJ2dsb2JieSdcbmltcG9ydCB0eXBlIHsgUGx1Z2luT3B0aW9uIH0gZnJvbSAndml0ZSdcbmltcG9ydCB7IHJlc29sdmVWb2NzQ29uZmlnIH0gZnJvbSAnLi4vdXRpbHMuanMnXG5cbmV4cG9ydCBmdW5jdGlvbiB2aXJ0dWFsUm91dGVzKCk6IFBsdWdpbk9wdGlvbiB7XG4gIGNvbnN0IHZpcnR1YWxNb2R1bGVJZCA9ICd2aXJ0dWFsOnJvdXRlcydcbiAgY29uc3QgcmVzb2x2ZWRWaXJ0dWFsTW9kdWxlSWQgPSBgXFwwJHt2aXJ0dWFsTW9kdWxlSWR9YFxuXG4gIGxldCBnbG9iOiBzdHJpbmdcbiAgbGV0IHBhdGhzOiBzdHJpbmdbXSA9IFtdXG5cbiAgcmV0dXJuIHtcbiAgICBuYW1lOiAncm91dGVzJyxcbiAgICBhc3luYyBjb25maWd1cmVTZXJ2ZXIoc2VydmVyKSB7XG4gICAgICBjb25zdCB7IGNvbmZpZyB9ID0gYXdhaXQgcmVzb2x2ZVZvY3NDb25maWcoKVxuICAgICAgY29uc3QgeyByb290IH0gPSBjb25maWdcbiAgICAgIGNvbnN0IHBhZ2VzUGF0aCA9IHJlc29sdmUocm9vdCwgJ3BhZ2VzJylcbiAgICAgIHNlcnZlci53YXRjaGVyLmFkZChwYWdlc1BhdGgpXG4gICAgICBzZXJ2ZXIud2F0Y2hlci5vbignYWRkJywgKCkgPT4gc2VydmVyLnJlc3RhcnQoKSlcbiAgICAgIHNlcnZlci53YXRjaGVyLm9uKCd1bmxpbmsnLCAoKSA9PiBzZXJ2ZXIucmVzdGFydCgpKVxuICAgIH0sXG4gICAgcmVzb2x2ZUlkKGlkKSB7XG4gICAgICBpZiAoaWQgPT09IHZpcnR1YWxNb2R1bGVJZCkgcmV0dXJuIHJlc29sdmVkVmlydHVhbE1vZHVsZUlkXG4gICAgICByZXR1cm5cbiAgICB9LFxuICAgIGFzeW5jIGxvYWQoaWQpIHtcbiAgICAgIGlmIChpZCA9PT0gcmVzb2x2ZWRWaXJ0dWFsTW9kdWxlSWQpIHtcbiAgICAgICAgbGV0IGNvZGUgPSAnZXhwb3J0IGNvbnN0IHJvdXRlcyA9IFsnXG4gICAgICAgIGZvciAoY29uc3QgcGF0aCBvZiBwYXRocykge1xuICAgICAgICAgIGNvbnN0IHR5cGUgPSBwYXRoXG4gICAgICAgICAgICAuc3BsaXQoJy4nKVxuICAgICAgICAgICAgLnBvcCgpXG4gICAgICAgICAgICA/Lm1hdGNoKC8obWR4fG1kKS8pXG4gICAgICAgICAgICA/ICdtZHgnXG4gICAgICAgICAgICA6ICdqc3gnXG4gICAgICAgICAgY29uc3QgcmVwbGFjZXIgPSBnbG9iLnNwbGl0KCcqJylbMF1cbiAgICAgICAgICBsZXQgcGFnZVBhdGggPSBwYXRoLnJlcGxhY2UocmVwbGFjZXIsICcnKS5yZXBsYWNlKC9cXC4oLiopLywgJycpXG4gICAgICAgICAgaWYgKHBhZ2VQYXRoLmVuZHNXaXRoKCdpbmRleCcpKVxuICAgICAgICAgICAgcGFnZVBhdGggPSBwYWdlUGF0aC5yZXBsYWNlKCdpbmRleCcsICcnKS5yZXBsYWNlKC9cXC8kLywgJycpXG4gICAgICAgICAgY29kZSArPSBgICB7IGxhenk6ICgpID0+IGltcG9ydChcIiR7cGF0aH1cIiksIHBhdGg6IFwiLyR7cGFnZVBhdGh9XCIsIHR5cGU6IFwiJHt0eXBlfVwiIH0sYFxuICAgICAgICAgIGlmIChwYWdlUGF0aClcbiAgICAgICAgICAgIGNvZGUgKz0gYCAgeyBsYXp5OiAoKSA9PiBpbXBvcnQoXCIke3BhdGh9XCIpLCBwYXRoOiBcIi8ke3BhZ2VQYXRofS5odG1sXCIsIHR5cGU6IFwiJHt0eXBlfVwiIH0sYFxuICAgICAgICB9XG4gICAgICAgIGNvZGUgKz0gJ10nXG4gICAgICAgIHJldHVybiBjb2RlXG4gICAgICB9XG4gICAgICByZXR1cm5cbiAgICB9LFxuICAgIGFzeW5jIGJ1aWxkU3RhcnQoKSB7XG4gICAgICBjb25zdCB7IGNvbmZpZyB9ID0gYXdhaXQgcmVzb2x2ZVZvY3NDb25maWcoKVxuICAgICAgY29uc3QgeyByb290IH0gPSBjb25maWdcbiAgICAgIGNvbnN0IHBhZ2VzUGF0aCA9IHJlc29sdmUocm9vdCwgJ3BhZ2VzJylcbiAgICAgIGdsb2IgPSBgJHtwYWdlc1BhdGh9LyoqLyoue21kLG1keCx0cyx0c3gsanMsanN4fWBcbiAgICAgIHBhdGhzID0gYXdhaXQgZ2xvYmJ5KGdsb2IpXG4gICAgfSxcbiAgICBoYW5kbGVIb3RVcGRhdGUoKSB7XG4gICAgICAvLyBUT0RPOiBoYW5kbGUgY2hhbmdlc1xuICAgICAgcmV0dXJuXG4gICAgfSxcbiAgfVxufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvdG1tL0RldmVsb3Blci92b2NzL3NyYy92aXRlL3BsdWdpbnNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy90bW0vRGV2ZWxvcGVyL3ZvY3Mvc3JjL3ZpdGUvcGx1Z2lucy9kb2NnZW4udHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3RtbS9EZXZlbG9wZXIvdm9jcy9zcmMvdml0ZS9wbHVnaW5zL2RvY2dlbi50c1wiO2ltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgeyBQcm9qZWN0IH0gZnJvbSAndHMtbW9ycGgnXG5pbXBvcnQgeyB0eXBlIFBsdWdpbk9wdGlvbiB9IGZyb20gJ3ZpdGUnXG5cbmV4cG9ydCB0eXBlIERvY2dlblBsdWdpblBhcmFtZXRlcnMgPSB7XG4gIGVudHJ5UG9pbnRzPzogc3RyaW5nW10gfCB1bmRlZmluZWRcbn1cblxuY29uc3QgcHJvamVjdCA9IG5ldyBQcm9qZWN0KHsgdHNDb25maWdGaWxlUGF0aDogJy4uL3RzY29uZmlnLmpzb24nIH0pXG5cbmV4cG9ydCBmdW5jdGlvbiBkb2NnZW4ocGFyYW1ldGVyczogRG9jZ2VuUGx1Z2luUGFyYW1ldGVycyA9IHt9KTogUGx1Z2luT3B0aW9uIHtcbiAgY29uc3QgeyBlbnRyeVBvaW50cyB9ID0gcGFyYW1ldGVyc1xuXG4gIGNvbnN0IHZpcnR1YWxNb2R1bGVJZCA9ICd2aXJ0dWFsOmRvY2dlbidcbiAgY29uc3QgcmVzb2x2ZWRWaXJ0dWFsTW9kdWxlSWQgPSBgXFwwJHt2aXJ0dWFsTW9kdWxlSWR9YFxuXG4gIHJldHVybiB7XG4gICAgbmFtZTogJ2RvY2dlbicsXG4gICAgYXN5bmMgY29uZmlndXJlU2VydmVyKHNlcnZlcikge1xuICAgICAgY29uc3Qgc291cmNlRmlsZXMgPSBwcm9qZWN0LmdldFNvdXJjZUZpbGVzKClcbiAgICAgIGlmIChzb3VyY2VGaWxlcy5sZW5ndGgpIHtcbiAgICAgICAgY29uc3Qgcm9vdERpcnMgPSBuZXcgU2V0PHN0cmluZz4oKVxuICAgICAgICBmb3IgKGNvbnN0IHNvdXJjZUZpbGUgb2Ygc291cmNlRmlsZXMpIHtcbiAgICAgICAgICBjb25zdCBrZXkgPSBzb3VyY2VGaWxlXG4gICAgICAgICAgICAuZ2V0RmlsZVBhdGgoKVxuICAgICAgICAgICAgLnJlcGxhY2UoYCR7cGF0aC5kaXJuYW1lKHByb2Nlc3MuY3dkKCkpfS9gLCAnJylcbiAgICAgICAgICAgIC5zcGxpdCgnLycpWzBdXG4gICAgICAgICAgcm9vdERpcnMuYWRkKGtleSlcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGNvbnN0IHJvb3REaXIgb2Ygcm9vdERpcnMpIHtcbiAgICAgICAgICBzZXJ2ZXIud2F0Y2hlci5hZGQoYCR7cm9vdERpcn0vKiovKmApXG4gICAgICAgICAgc2VydmVyLndhdGNoZXIub24oJ2NoYW5nZScsIGFzeW5jICgpID0+IHNlcnZlci53cy5zZW5kKCd2b2NzOmRvY2dlbicsIGdldEZpbGVzKCkpKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICByZXNvbHZlSWQoaWQpIHtcbiAgICAgIGlmIChpZCA9PT0gdmlydHVhbE1vZHVsZUlkKSByZXR1cm4gcmVzb2x2ZWRWaXJ0dWFsTW9kdWxlSWRcbiAgICAgIHJldHVyblxuICAgIH0sXG4gICAgYXN5bmMgbG9hZChpZCkge1xuICAgICAgaWYgKGlkICE9PSByZXNvbHZlZFZpcnR1YWxNb2R1bGVJZCkgcmV0dXJuXG5cbiAgICAgIGNvbnN0IGZpbGVzID0gZ2V0RmlsZXMoKVxuXG4gICAgICByZXR1cm4gYGV4cG9ydCBjb25zdCBkb2NnZW4gPSAke0pTT04uc3RyaW5naWZ5KGZpbGVzKX1gXG4gICAgfSxcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRGaWxlcygpIHtcbiAgY29uc3Qgc291cmNlRmlsZXMgPSBwcm9qZWN0LmdldFNvdXJjZUZpbGVzKClcblxuICBjb25zdCBmaWxlczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9XG4gIGZvciAoY29uc3Qgc291cmNlRmlsZSBvZiBzb3VyY2VGaWxlcykge1xuICAgIGNvbnN0IGtleSA9IHNvdXJjZUZpbGUuZ2V0RmlsZVBhdGgoKS5yZXBsYWNlKGAke3BhdGguZGlybmFtZShwcm9jZXNzLmN3ZCgpKX0vYCwgJycpXG4gICAgZmlsZXNba2V5XSA9IHNvdXJjZUZpbGUuZ2V0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SyxFQUFFO0FBQUEsTUFDckQ7QUFBQSxNQUNBLGNBQWM7QUFBQSxJQUNoQixDQUFDO0FBQUEsSUFDRCxJQUFJO0FBQUEsSUFDSixPQUFPO0FBQUEsSUFDUCxJQUFJO0FBQUEsSUFDSixjQUFjO0FBQUEsSUFDZCxZQUFZO0FBQUEsRUFDZDtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sSUFBSTtBQUFBLE1BQ0YsT0FBTyxDQUFDLElBQUk7QUFBQSxJQUNkO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbImgiLCAiaCIsICJ2aXNpdCIsICJ2aXNpdCIsICJoIiwgInZpc2l0IiwgInZpc2l0IiwgInZpc2l0IiwgInZpc2l0IiwgInZpc2l0IiwgInZpc2l0IiwgImNoaWxkIiwgImgiLCAidmlzaXQiLCAidmlzaXQiLCAiaCIsICJ2aXNpdCIsICJ2aXNpdCIsICJ2aXNpdCIsICJ2aXNpdCIsICJoIiwgInJlc29sdmUiLCAicmVzb2x2ZSIsICJleGlzdHNTeW5jIiwgInJlc29sdmUiLCAicmVzb2x2ZSIsICJleGlzdHNTeW5jIiwgInJlc29sdmUiLCAicmVzb2x2ZSIsICJwYXRoIl0KfQo=
