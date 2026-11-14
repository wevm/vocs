# Vocs next: design

Vocs next is documentation that readers talk to. A reader asks what they want to learn. A [nanocode](https://nanocode.xyz) agent in the reader's page searches the site's sources, then answers in chat or generates a page of typed blocks for that reader. Authors curate sources instead of writing pages.

This branch is a rewrite from a fresh slate. Vocs v1 and the Vocs on `main` are prior art only. The package name stays `vocs`, and releases ship under the `next` npm tag. The phases are in [`plan.md`](./plan.md). Discussion: [Amp thread](https://ampcode.com/threads/T-01a1d759-e7c7-7418-90be-4cea24b123d6).

## Experience

| Surface        | Behavior                                                                                                                                                        |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home           | "What do you want to learn?" above a visual index of capabilities. A tile generates a page instead of opening a fixed one.                                      |
| Generated page | Streams in block by block. The reader refines it in chat ("I use Express", "shorter"). A kept page gets a permalink such as `/learn/accept-usdc-nextjs-k3f9a2`. |
| Chat           | Short answers that list the files the agent read. Any answer can become a page.                                                                                 |
| Signed in      | The reader's API key and scopes fill into code. Missing scopes are flagged.                                                                                     |
| Agents         | Other agents read the same corpus through MCP and `llms.txt`.                                                                                                   |

Hand-written pages are limited to the visual index and concept posts. Everything else is generated.

## Public API

The package ships these entrypoints. Adapters are namespaces on the root entrypoint: `Source`, `Search`, `Provider`, and `Storage`. The package sets `sideEffects: false`, so a site bundles only the backends it calls.

| Entrypoint                           | Exports                                                                                                                                      | Runs in                            |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `vocs`                               | `defineConfig`, `Source`, `Search`, `Provider`, `Storage`, `type Config`, `type Block`, `type Reader`                                        | Anywhere                           |
| `vocs/server`                        | `Handler`                                                                                                                                    | Any `fetch` runtime                |
| `vocs/client`                        | `Client` (headless agent, turns, pages, saved pages)                                                                                         | Browser                            |
| `vocs/react`                         | `Docs`, `Ask`, `Page`, `Blocks`, and the block components (`Callout`, `Card`, `Cards`, `Code`, `CodeGroup`, `FileTree`, `Steps`, `Terminal`) | Browser and SSR                    |
| `vocs/rsc`                           | `Blocks`, `Page` as server components                                                                                                        | Hosts with React Server Components |
| `vocs/vite`                          | `vocs()` plugin                                                                                                                              | Vite                               |
| `vocs/styles.css`, `vocs/tokens.css` | The default theme in `@layer vocs`, or the tokens alone                                                                                      | CSS                                |
| `vocs` bin                           | `vocs dev`, `vocs build`                                                                                                                     | Node                               |

### Configuration

```ts
// vocs.config.ts
import { defineConfig, Provider, Search, Source, Storage } from 'vocs'

export default defineConfig({
  title: 'Tempo',
  provider: Provider.cloudflare({ gateway: 'tempo-docs', models: ['anthropic/claude-sonnet-5-5'] }),
  search: Search.cloudflare({ instance: 'tempo-docs' }),
  storage: Storage.cloudflare({ binding: 'PAGES' }),
  sources: [
    Source.files({ include: 'docs/**/*.md' }),
    Source.github({ repo: 'tempoxyz/tempo', paths: ['tips/**'] }),
    Source.github({ repo: 'wevm/viem', ref: 'main', paths: ['src/tempo/**'], mode: 'runtime' }),
    Source.googleDocs({ folder: 'TEMPO_PUBLIC_FOLDER_ID', visibility: 'public' }),
    Source.openapi({ url: 'https://api.tempo.xyz/openapi.json' }),
    Source.mcp({ name: 'tempo', url: 'https://api.tempo.xyz/mcp' }),
  ],
  demos: { memo: './src/demos/Memo.tsx' },
})
```

`defineConfig` validates the config and returns it typed. Adapters hold binding names and options, not secrets. Each adapter reads its secrets and bindings from the request context on every call.

### Adapter contracts

Every adapter is a plain object with a `type` literal and async operations. Each kind has a `from` factory for custom backends. Optional capabilities are optional operations.

```ts
// Source
type Source = {
  type: string // 'github'
  name: string
  mode: 'runtime' | 'snapshot'
  visibility: 'private' | 'public'
  auth: 'reader' | 'site'
  revision(context: Context): Promise<string> // commit SHA, modifiedTime, ETag
  list(context: Context): Promise<readonly string[]> // every file path
  read(path: string, context: Context): Promise<File> // content and the origin URL for citations
  tools?(context: Context): Promise<readonly Tool[]> // actions, such as MCP tools
}

// Search
type Search = {
  type: string
  index?(
    files: readonly File[],
    options: { source: string },
    context: Context,
  ): Promise<{ deleted: number; skipped: number; upserted: number }>
  search(
    query: string,
    options: { limit: number; sources?: readonly string[] | undefined },
    context: Context,
  ): Promise<readonly Result[]>
  status?(context: Context): Promise<{ state: 'failed' | 'indexing' | 'ready' }>
}

// Provider
type Provider = {
  type: string
  models: readonly string[] // the only model IDs the gateway forwards
  complete(body: string, context: Context): Promise<Response> // a streamed completion of a checked request body
}

// Storage
type Storage = {
  type: string
  delete(key: string, context: Context): Promise<void>
  get(key: string, context: Context): Promise<string | undefined>
  put(
    key: string,
    value: string,
    options: { ttl?: number | undefined },
    context: Context,
  ): Promise<void>
}

type Context = {
  env: Record<string, unknown>
  reader: Reader | undefined
  waitUntil(promise: Promise<unknown>): void
}
```

| Namespace | Factory                                     | Backend                                                     |
| --------- | ------------------------------------------- | ----------------------------------------------------------- |
|           | `github({ repo, ref?, paths? })`            | A GitHub repository, pinned at a commit in `snapshot` mode  |
|           | `googleDocs({ folder })`                    | Drive export as `text/markdown`                             |
|           | `url({ url })`                              | One URL, such as another site's `llms.txt`                  |
|           | `openapi({ url })`                          | One file per operation                                      |
|           | `mcp({ name, url })`                        | Resources as files and tools as agent tools                 |
|           | `endpoint({ name, url, schema })`           | One typed tool, such as an API called with the reader's key |
|           | `vectorize({ index, embedding, reranker })` | Workers AI embeddings, Vectorize, Workers AI reranker       |
|           | `memory()`                                  | A vector index packed at build, no service                  |
|           | `memory()`                                  | Process memory, for development and tests                   |

### Server

```ts
import { Handler } from 'vocs/server'
import config from 'virtual:vocs/config' // vocs.config.ts with its sources built by vocs()

const docs = Handler.from(config, {
  basePath: '/docs',
  reader: async (request) => ({ apiKey: await keyFor(request), scopes: ['payments:read'] }),
})

export default { fetch: docs.fetch } // Cloudflare Worker: fetch(request, env, ctx)
// app.all('/docs/*', (c) => docs.fetch(c.req.raw, c.env, c.executionCtx)) // Hono
```

`Handler.from(config, options)` returns `{ fetch }`. The sources snapshot (internally, the corpus) is never public API: `vocs()` builds it, writes it as a static asset, and attaches its URL to the config. Its routes under `basePath`:

| Route                           | Purpose                                                                                                                                                                          |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /model/responses`         | The model gateway for the OpenAI Responses API, which nanocode's Codex harness sends. Forwards only `config.provider.models`, limits request size, and rate limits each address. |
| `GET /search`                   | Runs `config.search`.                                                                                                                                                            |
| `GET /sources/:name/*`          | Lists and reads runtime sources.                                                                                                                                                 |
| `POST /mcp/:name`               | Proxies MCP calls, so tokens stay on the server.                                                                                                                                 |
| `POST /render`                  | Renders blocks to streamed HTML.                                                                                                                                                 |
| `GET /pages/:id`, `POST /pages` | Reads and saves pages through `config.storage`.                                                                                                                                  |
| `GET /agent`                    | The agent settings: title, description, model, and the URL of the sources snapshot, a static asset of the host's build, as is the agent module.                                  |
| `POST /mcp`, `GET /llms.txt`    | The corpus for other agents.                                                                                                                                                     |

### Client

`vocs/client` is the headless browser API. `vocs/react` is built on it, and other UI frameworks can use it directly.

```ts
import { Client } from 'vocs/client'

const client = Client.create({ basePath: '/docs' })
const turn = client.ask('How do I accept USDC in a Next.js checkout?', { output: 'page' })

turn.subscribe(() => render(turn.get())) // { status, text, files, error }; status is a machines.turn state
await turn.done
```

The agent module loads on the first `ask`, not on `create`.

### React

```tsx
import { Ask, Docs, Page } from 'vocs/react'
import 'vocs/styles.css'

<Docs basePath="/docs" demos={{ memo: Memo }} components={{ Callout: MyCallout }} /> // home, pages, chat
<Ask basePath="/docs" placeholder="Ask about the Tempo API" /> // only the prompt box
<Page basePath="/docs" id="accept-usdc-nextjs-k3f9a2" /> // a saved page
```

Hosts with React Server Components import `Blocks` and `Page` from `vocs/rsc` instead. Those render blocks on the server without the HTML step.

### Vite and CLI

```ts
// vite.config.ts, custom mode only
import { vocs } from 'vocs/vite'

export default defineConfig({ plugins: [vocs()] })
```

| Command      | Behavior                                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------------------------ |
| `vocs dev`   | Runs the quick-mode app with Vite and `configFile: false`, or the project's `vite.config.ts` when it exists. |
| `vocs build` | Builds the sources snapshot, the search index, a Worker, and static assets.                                  |

## Pages are typed blocks

The agent does not write MDX. It calls a page tool with typed blocks:

| Block                                               | Renders with                       |
| --------------------------------------------------- | ---------------------------------- |
| `heading`, `prose` (inline Markdown)                | Typography, heading anchors, links |
| `steps`                                             | `Steps`                            |
| `code` (lang, title, highlight markers, `twoslash`) | `Code`, with Shiki and Twoslash    |
| `codeGroup`                                         | `CodeGroup`                        |
| `callout`                                           | `Callout`                          |
| `cards`                                             | `Cards`, `Card`                    |
| `fileTree`, `terminal`, `mermaid`                   | `FileTree`, `Terminal`, Mermaid    |
| `demo` (a registered ID and props)                  | A component the site registers     |

- One Zod schema drives the page tool, validation, rendering, and Markdown export.
- Each block renders when it is complete, so a page fills in progressively.
- A `twoslash` block that fails to type-check fails its render, and the error returns to the agent.
- The model cannot run arbitrary JSX. A `demo` block names only a registered component.

## Sources

Every source runs in either mode, set per source with `mode`:

| Mode                 | When it is fetched                                                                                        | Use it for                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `snapshot` (default) | At build time, written into the corpus at a recorded revision                                             | Content that is fast to grep, cited at an exact revision, and indexed for search           |
| `runtime`            | When the agent reads it, mounted at `/sources/<name>` and fetched through the handler, cached by revision | Content that must be current, is too large to copy, or depends on the reader's credentials |

- In `snapshot` mode, the build calls `list` and `read` and writes each file into one content-addressed corpus asset.
- In `runtime` mode, the page mounts the source as a lazy `nanocode-ts/bash` filesystem whose reads go through the handler.
- Tools always run at request time, because they act instead of read.
- A changed snapshot source changes the corpus hash, which invalidates pages built from it.
- Content from either mode reaches the reader's browser. A private source needs `visibility: 'public'` to be included. A runtime source can instead use `auth: 'reader'`, so it shows only what that reader can already see.

## Search

Grep finds exact names, such as `transferWithMemo`. Semantic search finds concepts, such as "how do refunds work". The agent calls `search(query, { sources })`, gets ranked results with a path and a URL, and then reads the files before it answers.

- Search runs in the handler, because adapters hold tokens and bindings.
- The build indexes snapshot sources after it writes the corpus. A refresh reindexes only the changed source.
- Runtime sources are not sent to Cloudflare AI Search, because its indexing is asynchronous. They use grep, or `Search.memory`.
- One AI Search instance serves a whole site, with a `source` metadata filter.
- `Search.cloudflare` is first because it needs no indexing code. It costs $0.75 per 1,000 queries after 1,000 free a month, billed from 2026-12-01. `Search.vectorize` is the cheaper option if query cost matters.

## Two ways to use it

|          | Quick mode                             | Custom mode                                           |
| -------- | -------------------------------------- | ----------------------------------------------------- |
| For      | A docs site with nothing else to build | Docs inside an existing app, such as a console        |
| Files    | `package.json` and `vocs.config.ts`    | The host app, a mounted handler, and React components |
| Commands | `vocs dev`, `vocs build`               | The host's own dev server and build, with `vocs/vite` |
| Output   | A Cloudflare Worker and static assets  | Whatever the host deploys                             |

Quick mode is our own app around the handler. Custom mode is the host's app around it. A host that uses only runtime sources needs no build step.

```
quick/                           custom/
  package.json                     package.json
  vocs.config.ts                   vocs.config.ts
  src/                             vite.config.ts      vocs() plugin
    index.tsx       optional       src/
    demos/Memo.tsx  optional         worker.ts         Handler.from(config)
    concepts/*.mdx  optional         routes/docs.tsx   <Docs />
    styles.css      optional         routes/console.tsx <Ask />
```

Quick mode runs on a thin app layer over `@vitejs/plugin-rsc` and `@cloudflare/vite-plugin`, with a prerendered home, a server-rendered permalink route, and the mounted handler. TanStack Start is the fallback.

## Rendering

- **Any host:** the handler's render route turns blocks into HTML with React's `renderToReadableStream`, Shiki, and Twoslash. `vocs/react` inserts the HTML and hydrates only interactive parts, such as tabs, copy buttons, and registered demos.
- **Hosts with React Server Components:** `vocs/rsc` renders the same blocks as server components.
- **Twoslash on Workers is a risk:** bundle size, CPU time, and TypeScript lib files. Spike B measures it. If it does not fit, Twoslash blocks go to a Node renderer and Shiki stays in the Worker.

## Styling

Every element is targetable with plain CSS. Three layers cover most needs:

1. **Tokens.** Colors, fonts, radii, and spacing are custom properties, such as `--vocs-color-accent` and `--vocs-font-mono`.
2. **Part attributes.** Each element carries a `data-vocs` name, `data-vocs-part` for its pieces, and enumerated state attributes. These names are public API.
3. **Component overrides.** `components={{ Callout: MyCallout }}` replaces how a block renders, and `className` goes on each top-level component.

```html
<aside data-vocs="callout" data-kind="warning">
  <p data-vocs-part="title">Testnet only</p>
  <div data-vocs-part="body">…</div>
</aside>
<pre data-vocs="code" data-lang="ts" data-state="streaming">…</pre>
```

```css
:root {
  --vocs-color-accent: #5b4cdb;
}
[data-vocs='callout'][data-kind='warning'] {
  border-radius: 0;
}
```

- The default theme sits in `@layer vocs`, so unlayered host CSS wins.
- Generated class names are private and change between releases. Host CSS targets `data-vocs` attributes, never classes. Tailwind users target parts with variants such as `data-[vocs=callout]:rounded-none`.
- Server-rendered HTML carries the same attributes.
- Quick mode loads `src/styles.css` when it exists.

### Authoring with zyzz

Vocs authors its own styles with [zyzz](https://zyzz.style): typed `style()` and `variants()` definitions in a `namespace styles` beside each component, tokens from one `defineVars` set, and `layers: ['vocs']` in `src/zyzz.config.ts`.

- The package build compiles every style ahead of time. `vocs/styles.css` is static CSS, and `vocs/react` applies precompiled class names. Hosts, including hosts that use Tailwind or their own zyzz config, need no zyzz setup.
- The `zyzz/oxlint` plugin runs in `pnpm check`. It enforces valid styles, no conflicting `className` or `style` props, no unused styles, logical properties, and tokens for colors, radii, and fonts.
- zyzz names its custom properties `--z-<category>-<key>`, such as `--z-radius-md` (verified with `zyzz build` at 0.0.44). The public tokens stay `--vocs-*`. Phase 2 decides how zyzz tokens read them, and how they avoid collisions with a host's own `--z-*` properties.

## Lifecycles

Each of these is an XState machine with named states for success, failure, and cancellation. The states are public through `vocs/client` readers.

| Machine           | States (draft)                                                                |
| ----------------- | ----------------------------------------------------------------------------- |
| `machines.agent`  | `idle`, `loading`, `ready`, `failed`                                          |
| `machines.turn`   | `queued`, `thinking`, `searching`, `streaming`, `done`, `failed`, `cancelled` |
| `machines.page`   | `generating`, `refining`, `ready`, `saving`, `saved`, `failed`                |
| `machines.render` | `queued`, `rendering`, `rendered`, `failed`                                   |

## Decisions

| Question               | Decision                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------- |
| Where the code lives   | The `next` branch of `wevm/vocs`, rewritten from a fresh slate                                          |
| Where the agent runs   | In the reader's page                                                                                    |
| Who pays for inference | The site, through its own gateway on Cloudflare AI Gateway                                              |
| Hand-written pages     | Visual index and concept posts only                                                                     |
| Source modes           | Every source supports `snapshot` and `runtime`                                                          |
| Adapters               | Namespaces on the root entrypoint: `Source`, `Search`, `Provider`, `Storage`                            |
| Styles                 | Authored with zyzz, compiled ahead of time to static CSS. Hosts never need zyzz.                        |
| Core                   | A web-standard handler, with a client, React components, a Vite plugin, and a CLI around it             |
| State                  | XState machines with enumerated states, no boolean flags                                                |
| Quick-mode framework   | A thin layer on `@vitejs/plugin-rsc` and `@cloudflare/vite-plugin`, with TanStack Start as the fallback |
