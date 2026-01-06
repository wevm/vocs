---
name: tooling-engineering
description: Expert tooling engineer for Vite plugins, Waku/RSC architecture, MDX/Remark/Rehype transformations, and module-driven development. Use when building Vite plugins, working with MDX pipelines, extending Waku, or creating internal library modules.
---

# Tooling Engineering

Expert guidance for building Vite plugins, MDX transformations, Waku integrations, and function-based module-driven development.

## Core Principles

1. **Module-driven development** – Each file is its own module representing an "instance"
2. **Function-based API** – Export functions, not classes; use namespace imports
3. **Vite-native** – Prefer Vite plugins over custom CLIs or build tools
4. **RSC-compatible** – Ensure patterns work with React Server Components
5. **Tree-shakeable** – Design for optimal bundle size

## Module-Driven Development

### Pattern

Each module exports functions that operate on data. Modules represent their own "instance":

```ts
// sidebar.ts
export type SidebarItem = { text: string; link?: string; items?: SidebarItem[] }

export function flatten(items: SidebarItem[]): SidebarItem[] {
  const result: SidebarItem[] = []
  for (const item of items) {
    if (item.link) result.push(item)
    if (item.items) result.push(...flatten(item.items))
  }
  return result
}

export function fromConfig(config: Config['sidebar'], path: string) {
  // ...
}
```

### Import Style

Import modules with namespace style:

```ts
import * as Sidebar from './sidebar.js'
import * as Config from './config.js'
import * as Mdx from './mdx.js'

// Usage
const items = Sidebar.flatten(sidebar.items)
const config = await Config.resolve()
```

### Explicit Return Types

All module functions MUST have explicit return types:

```ts
// ✅ Good - explicit return type
export function flatten(items: SidebarItem[]): SidebarItem[] {
  // ...
}

// ❌ Bad - implicit return type
export function flatten(items: SidebarItem[]) {
  // ...
}
```

### Function Parameter & Return Types

Use `declare namespace` for function options and return types:

```ts
export function resolve(options: resolve.Options): resolve.ReturnType {
  // ...
}

export declare namespace resolve {
  type Options = { rootDir?: string }
  type ReturnType = Promise<Config>
}

// For simpler functions with inline types
export function flatten(items: flatten.Options): flatten.ReturnType {
  // ...
}

export declare namespace flatten {
  type Options = SidebarItem[]
  type ReturnType = SidebarItem[]
}
```

This pattern:
- Keeps types discoverable from the function symbol (e.g., `resolve.Options`)
- Avoids name clashes across modules
- Enables better IDE autocomplete and documentation

### File Extensions

Always use `.js` extensions for relative imports (even for `.ts`/`.tsx` files):

```ts
import * as Config from './config.js'
import * as Handlers from '../server/handlers.js'
```

## Vite Plugin Development

### Plugin Structure

Vite plugins are factory functions returning a plugin object:

```ts
import type { PluginOption } from 'vite'

export function myPlugin(options: myPlugin.Options = {}): PluginOption {
  return {
    name: 'vocs:my-plugin',
    // hooks...
  }
}

export declare namespace myPlugin {
  type Options = {
    enabled?: boolean
  }
}
```

### Plugin Naming

Use `vocs:` prefix for all Vocs plugins:

```ts
name: 'vocs:deps'
name: 'vocs:lang-watcher'
name: 'vocs:virtual-config'
name: 'vocs:mdx'
```

### Common Hooks

| Hook | When Called | Use Case |
|------|-------------|----------|
| `config` | Before config resolved | Modify Vite config |
| `configResolved` | After config resolved | Store final config |
| `configureServer` | Dev server setup | Add middleware, watchers |
| `resolveId` | Module resolution | Virtual modules |
| `load` | Module loading | Generate virtual module content |
| `transform` | Code transformation | Transform file content |
| `buildStart` | Build starts | Setup tasks |
| `buildEnd` | Build ends | Cleanup, validation |

### Virtual Modules

Use `virtual:vocs/` prefix for virtual modules:

```ts
const virtualModuleId = 'virtual:vocs/config'
const resolvedVirtualModuleId = '\0' + virtualModuleId

export function virtualConfig(): PluginOption {
  let config: Config

  return {
    name: 'vocs:virtual-config',

    configResolved(resolvedConfig) {
      config = resolvedConfig
    },

    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId
    },

    load(id) {
      if (id === resolvedVirtualModuleId) {
        return `export default ${JSON.stringify(config)}`
      }
    },

    // Enable HMR for virtual module
    handleHotUpdate({ file, server }) {
      if (file.endsWith('vocs.config.ts')) {
        const mod = server.moduleGraph.getModuleById(resolvedVirtualModuleId)
        if (mod) server.moduleGraph.invalidateModule(mod)
      }
    },
  }
}
```

### Dev Server Middleware

Add custom middleware in `configureServer`:

```ts
configureServer(server) {
  server.middlewares.use((req, res, next) => {
    if (req.url?.startsWith('/api/')) {
      // Handle API request
      return
    }
    next()
  })
}
```

### File Watchers

Watch for file changes and trigger restarts:

```ts
configureServer(server) {
  server.watcher.on('change', async (changedPath) => {
    if (changedPath.endsWith('.md')) {
      // Process change
      server.restart()
    }
  })
}
```

### Plugin Ordering

Use `enforce` to control plugin order:

```ts
{
  name: 'vocs:pre-plugin',
  enforce: 'pre',  // Run before core plugins
}

{
  name: 'vocs:post-plugin', 
  enforce: 'post',  // Run after core plugins
}
```

### Composing Plugins

Return arrays of plugins for complex features:

```ts
export async function vocs(): Promise<PluginOption[]> {
  const config = await Config.resolve()

  return [
    deps(),
    langWatcher(config),
    mdx(config),
    virtualConfig(),
    // ...
  ]
}
```

## MDX Pipeline

### Architecture

```
.md/.mdx file
    ↓
remark (parse to MDAST)
    ↓
remark plugins (transform MDAST)
    ↓
rehype (convert to HAST)
    ↓
rehype plugins (transform HAST)
    ↓
recma plugins (transform ESTree)
    ↓
JSX output
```

### Plugin Types

| Type | Input/Output | Use Case |
|------|--------------|----------|
| Remark | MDAST → MDAST | Markdown transformations |
| Rehype | HAST → HAST | HTML transformations |
| Recma | ESTree → ESTree | JavaScript transformations |

### Creating Remark Plugins

```ts
import type * as MdAst from 'mdast'
import * as UnistUtil from 'unist-util-visit'

export function remarkMyPlugin(): (tree: MdAst.Root) => void {
  return (tree) => {
    UnistUtil.visit(tree, 'code', (node: MdAst.Code) => {
      // Transform code blocks
      if (node.lang === 'tsx') {
        node.meta = `${node.meta ?? ''} twoslash`
      }
    })
  }
}
```

### Creating Rehype Plugins

```ts
import type * as HAst from 'hast'
import * as UnistUtil from 'unist-util-visit'

export function rehypeMyPlugin(): (tree: HAst.Root) => void {
  return (tree) => {
    UnistUtil.visit(tree, 'element', (node: HAst.Element) => {
      if (node.tagName === 'a') {
        // Add external link attributes
        const href = node.properties?.href as string
        if (href?.startsWith('http')) {
          node.properties = {
            ...node.properties,
            target: '_blank',
            rel: 'noopener noreferrer',
          }
        }
      }
    })
  }
}
```

### Registering Plugins

Add plugins in `getCompileOptions`:

```ts
export function getCompileOptions(config: Config) {
  return {
    remarkPlugins: [
      remarkFrontmatter,
      remarkGfm,
      remarkDirective,
      remarkMyPlugin,
      ...(config.markdown?.remarkPlugins ?? []),
    ],
    rehypePlugins: [
      rehypeSlug,
      rehypeAutolinkHeadings,
      rehypeShiki(config.codeHighlight),
      ...(config.markdown?.rehypePlugins ?? []),
    ],
    recmaPlugins: [],
  }
}
```

### Shiki Integration

Configure Shiki for code highlighting:

```ts
import shiki, { type RehypeShikiOptions } from '@shikijs/rehype'

export function rehypeShiki(options: rehypeShiki.Options) {
  return shiki({
    themes: {
      light: options.lightTheme ?? 'github-light',
      dark: options.darkTheme ?? 'github-dark',
    },
    langs: options.langs ?? defaultLangs,
    transformers: [
      transformerMetaHighlight(),
      transformerNotationDiff(),
      // Custom transformers...
    ],
  })
}
```

### Twoslash Integration

Add TypeScript type hints to code blocks:

```ts
import { transformerTwoslash } from '@shikijs/twoslash'

const twoslashTransformer = transformerTwoslash({
  explicitTrigger: true,  // Require `twoslash` meta
  twoslashOptions: {
    compilerOptions: {
      strict: true,
    },
  },
})
```

## Waku / RSC Architecture

### Overview

Waku provides React Server Components support via Vite environments:

```
┌─────────────────────────────────┐
│  Client Environment (browser)   │
├─────────────────────────────────┤
│  SSR Environment (HTML render)  │
├─────────────────────────────────┤
│  RSC Environment (server comp)  │
└─────────────────────────────────┘
```

### Plugin Composition

Wrap Waku plugins with Vocs-specific configuration:

```ts
import PluginRsc from '@vitejs/plugin-rsc'
import * as Plugins from './internal/vite-plugins.js'

export async function vocs(): Promise<PluginOption[]> {
  const config = await Config.resolve()

  return [
    vocs_core(),                    // Core Vocs plugin
    Plugins.allowServer(),          // Enable 'use server'
    PluginRsc({ /* options */ }),   // RSC transform
    Plugins.main(wakuConfig),       // Main Waku plugin
    Plugins.userEntries(config),    // User entry points
    // ...
  ]
}
```

### Router Integration

Vocs uses Waku's file-based router:

```
src/pages/
├── index.mdx         → /
├── guide/
│   ├── index.mdx     → /guide
│   └── [slug].mdx    → /guide/:slug
└── _layout.tsx       → Layout wrapper
```

### Middleware

Add custom middleware for request processing:

```ts
// src/middleware.ts
import type { MiddlewareHandler } from 'waku'

export default function middleware(): MiddlewareHandler {
  return async (ctx, next) => {
    // Pre-processing
    await next()
    // Post-processing
  }
}
```

### Context Access

Use Waku's context for request data:

```ts
import { getContext } from 'waku/server'

export function getRequestInfo() {
  const { req } = getContext()
  return {
    url: req.url,
    headers: req.headers,
  }
}
```

## Server Handlers

For any server-side API functionality, add a handler in `src/server/handlers/`.

### Handler Pattern

Handlers use the `Handler.create` factory with a fetch-style API:

```ts
// src/server/handlers/my-handler.ts
import * as Handler from './index.js'

export function handler(): Handler.Handler {
  return Handler.create(async (request) => {
    const url = new URL(request.url)
    
    // Validate request
    if (!url.pathname.startsWith('/api/')) {
      throw new Error()  // Throwing skips this handler
    }
    
    // Process and return Response
    return new Response(JSON.stringify({ data: 'value' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  })
}
```

### Handler Type

```ts
type Handler = {
  fetch: (request: Request) => Promise<Response>
  listener: http.RequestListener  // For Node.js http server
  handle: (req, res) => Promise<Response | undefined>
}
```

### Error Handling

Throw an error to skip the handler and pass to next middleware:

```ts
Handler.create(async (request) => {
  if (!shouldHandle(request)) {
    throw new Error()  // Skips this handler
  }
  return new Response('OK')
})
```

## Internal Module Patterns

### Config Resolution

```ts
// config.ts
let resolvedConfig: Config | undefined

export async function resolve(): Promise<Config> {
  if (resolvedConfig) return resolvedConfig

  const userConfig = await loadUserConfig()
  resolvedConfig = mergeWithDefaults(userConfig)

  return resolvedConfig
}

export function getConfigFile(): string | undefined {
  // Find vocs.config.ts
}
```

### Config Defaults

All default values should be defined in the `define` function in `config.ts`, not in components. This centralizes configuration logic and makes defaults discoverable.

For optional object configs with nested defaults, access `config.propName` directly rather than destructuring:

```ts
export function define(config: define.Options = {}): Config {
  const {
    title = 'Docs',
    // Don't destructure optional objects with nested defaults
  } = config

  return {
    title,
    // Apply defaults with spread - defaults first, user config overwrites
    editLink: config.editLink
      ? { text: 'Suggest changes', ...config.editLink }
      : undefined,
  }
}
```

### Accessing Nested Config in Components

When accessing nested optional config in components, destructure in two steps for clarity:

```ts
// ✅ Good - two-step destructure
const { editLink } = config
const { link, text } = editLink ?? {}

// ❌ Avoid - chained destructure is harder to read
const { link, text } = config.editLink ?? {}
```

### Type Utilities

Common utility types in `types.ts`:

```ts
// Make all properties optional if partial is true
export type MaybePartial<partial extends boolean, T> = 
  partial extends true ? Partial<T> : T

// Exactly one of the given types
export type OneOf<T extends object[]> = /* ... */

// Omit from union types
export type UnionOmit<T, K extends keyof any> = 
  T extends any ? Omit<T, K> : never
```

### Path Utilities

```ts
// path.ts
export function matches(currentPath: string, targetPath: string): boolean {
  const current = normalize(currentPath)
  const target = normalize(targetPath)
  return current === target || current.startsWith(target + '/')
}

export function normalize(path: string): string {
  return path.endsWith('/') ? path.slice(0, -1) : path
}
```

### Testing

Colocate tests with modules:

```ts
// sidebar.test.ts
import { describe, expect, it } from 'vitest'
import * as Sidebar from './sidebar.js'

describe('Sidebar.flatten', () => {
  it('flattens nested items', () => {
    const items = [{ text: 'A', items: [{ text: 'B', link: '/b' }] }]
    expect(Sidebar.flatten(items)).toMatchInlineSnapshot(`
      [{ "text": "B", "link": "/b" }]
    `)
  })
})
```

## Error Handling

### Vite Plugin Errors

Use Vite's error methods:

```ts
{
  name: 'vocs:validator',
  buildEnd() {
    if (hasErrors) {
      this.error('Validation failed: ...')  // Fails build
    }
    if (hasWarnings) {
      this.warn('Warning: ...')  // Shows warning
    }
  },
}
```

### Logging

Use Vite's logger:

```ts
import { createLogger } from 'vite'

const logger = createLogger(undefined, { 
  allowClearScreen: false, 
  prefix: '[vocs]' 
})

logger.info('Processing files...', { timestamp: true })
logger.warn('Deprecated option used')
logger.error('Build failed')
```

## Documentation

### Vite

- Plugin API: https://vite.dev/guide/api-plugin.html
- Environment API: https://vite.dev/guide/api-environment.html

### Waku

- Repository: https://github.com/wakujs/waku
- Router: Check `packages/waku/src/router/`
- Middleware: Check `packages/waku/src/lib/hono/middleware.ts`

### MDX

- @mdx-js/mdx: https://mdxjs.com/packages/mdx/
- Remark plugins: https://github.com/remarkjs/remark/blob/main/doc/plugins.md
- Rehype plugins: https://github.com/rehypejs/rehype/blob/main/doc/plugins.md

### Shiki

- Shiki: https://shiki.style/
- Transformers: https://shiki.style/packages/transformers
- Twoslash: https://twoslash.netlify.app/
