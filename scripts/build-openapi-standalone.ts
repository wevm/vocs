// Builds the standalone OpenAPI browser bundle (JS + CSS + fonts) and inlines it
// into `src/server/openapi/assets.generated.ts`, so `Handler.openApi` can serve a
// self-contained, build-free API reference from any server runtime.
//
// Run as part of `pnpm build` (before `zile`, which then compiles the generated
// module into `dist`). Can also be run directly: `node scripts/build-openapi-standalone.ts`.

import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getIconData, iconToHTML, iconToSVG } from '@iconify/utils'
import { icons as lucide } from '@iconify-json/lucide'
import { icons as simple } from '@iconify-json/simple-icons'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import Icons from 'unplugin-icons/vite'
import { build, type Plugin } from 'vite'
import type { AssetFile } from '../src/server/openapi/assets.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.resolve(root, '.vocs/openapi-app')
const appDir = path.resolve(root, 'src/openapi-app')
const entry = path.resolve(appDir, 'client.tsx')
const generated = path.resolve(root, 'src/server/openapi/assets.generated.ts')

function getIcon(set: Parameters<typeof getIconData>[0]) {
  return async (name: string): Promise<string | undefined> => {
    const data = getIconData(set, name)
    if (!data) return undefined
    const { attributes, body } = iconToSVG(data)
    return iconToHTML(body, attributes)
  }
}

/**
 * Resolves the `virtual:vocs/*` modules the real Vocs components import to the
 * prebuilt app's runtime-backed implementations (which read the embedded
 * payload). This is what lets the genuine layout render in a plain SPA.
 */
function virtualModulesPlugin(): Plugin {
  const map: Record<string, string> = {
    'virtual:vocs/config': path.resolve(appDir, 'virtual/config.ts'),
    'virtual:vocs/langs': path.resolve(appDir, 'virtual/langs.ts'),
    'virtual:vocs/openapi': path.resolve(appDir, 'virtual/openapi.ts'),
    'virtual:vocs/search-index': path.resolve(appDir, 'virtual/search-index.ts'),
    'virtual:vocs/slots': path.resolve(appDir, 'virtual/slots.ts'),
    'virtual:vocs/user-styles': path.resolve(appDir, 'virtual/user-styles.ts'),
    'virtual:vocs/group-icons.css?url': path.resolve(appDir, 'virtual/group-icons.ts'),
  }
  return {
    name: 'vocs:openapi-app-virtual-modules',
    enforce: 'pre',
    resolveId(source) {
      if (map[source]) return map[source]
    },
  }
}

console.log('[vocs] Building standalone OpenAPI bundle…')

await build({
  configFile: false,
  root,
  // Relative base so bundle-internal references (dynamic-import chunks, CSS
  // `url()` fonts) resolve against the served asset URL — and therefore route
  // back to the handler wherever it is mounted.
  base: './',
  logLevel: 'warn',
  resolve: {
    alias: {
      // The real Vocs layout/chrome only touches Waku via `useRouter`/`Link`;
      // swap it for the SPA history shim so genuine components render here.
      waku: path.resolve(appDir, 'waku.tsx'),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    Icons({
      compiler: 'jsx',
      jsx: 'react',
      customCollections: {
        lucide: getIcon(lucide),
        'simple-icons': getIcon(simple),
      },
    }),
    virtualModulesPlugin(),
  ],
  build: {
    outDir,
    emptyOutDir: true,
    cssCodeSplit: false,
    manifest: false,
    rollupOptions: {
      input: entry,
      output: {
        entryFileNames: 'client.js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
      onwarn(warning, warn) {
        // `'use client'` directives are intentional; they're harmless in a
        // browser bundle but Rollup warns about unresolved module directives.
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return
        warn(warning)
      },
    },
  },
})

// Collect emitted files into an inlined asset map.
const textExt = new Set(['.js', '.css', '.map'])
const files: Record<string, AssetFile> = {}
const styles: string[] = []
let entryName = ''

async function walk(dir: string, base = ''): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const item of entries) {
    const abs = path.join(dir, item.name)
    const rel = base ? `${base}/${item.name}` : item.name
    if (item.isDirectory()) {
      await walk(abs, rel)
      continue
    }
    const ext = path.extname(item.name)
    if (textExt.has(ext)) {
      files[rel] = { type: mime(ext), encoding: 'utf8', body: await fs.readFile(abs, 'utf-8') }
    } else {
      files[rel] = {
        type: mime(ext),
        encoding: 'base64',
        body: (await fs.readFile(abs)).toString('base64'),
      }
    }
    if (rel === 'client.js') entryName = rel
    if (ext === '.css') styles.push(rel)
  }
}

function mime(ext: string): string {
  switch (ext) {
    case '.js':
      return 'text/javascript; charset=utf-8'
    case '.css':
      return 'text/css; charset=utf-8'
    case '.map':
      return 'application/json; charset=utf-8'
    case '.woff2':
      return 'font/woff2'
    case '.woff':
      return 'font/woff'
    case '.wasm':
      return 'application/wasm'
    case '.svg':
      return 'image/svg+xml'
    default:
      return 'application/octet-stream'
  }
}

await walk(outDir)

if (!entryName) throw new Error('[vocs] standalone build did not emit client.js')

const module = `/**
 * Prebuilt standalone OpenAPI browser bundle (JS + CSS + fonts).
 *
 * THIS FILE IS GENERATED by \`scripts/build-openapi-standalone.ts\` (run as part
 * of \`pnpm build\`). Do not edit by hand.
 */

import type { Assets } from './assets.js'

export const assets: Assets = ${JSON.stringify({ built: true, entry: entryName, styles, files }, null, 2)}
`

await fs.writeFile(generated, module)
const total = Object.values(files).reduce((sum, file) => sum + file.body.length, 0)
console.log(
  `[vocs] Standalone bundle: ${Object.keys(files).length} files, ~${(total / 1024 / 1024).toFixed(1)}MB inlined → ${path.relative(root, generated)}`,
)
