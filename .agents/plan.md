# Vocs next: implementation plan

Vocs next is built on the `next` branch of `wevm/vocs` in nine phases. Each phase ends in something that runs, an end-to-end test that proves it, and recorded budgets. Phase 0 settles the three risks that could change the design before product code exists. Tempo is the pilot site from phase 1.

The design and public API are in [`design.md`](./design.md). Conventions are in [`AGENTS.md`](../AGENTS.md).

## Working rules

- **Branch:** commits land directly on `next`, with no pull requests. Never force push. `main` keeps shipping the current Vocs.
- **Fresh slate:** nothing is ported from Vocs v1 or `main`. Old code is prior art only.
- **CI:** `.github/workflows/next.yml` runs `verify.yml` on every push to `next`. `prerelease.yml` publishes a `pkg-pr-new` preview of each push.
- **Tests:** each phase adds Playwright suites against both playgrounds, and integration suites for the machines and adapters it adds. No unit tests.
- **Machines first:** each lifecycle starts as a machine with its graph test, before the UI that reads it.
- **Styling contract from the first component:** `data-vocs` parts, enumerated state attributes, and `--vocs-*` tokens.
- **Entrypoints land with their first export.** The export map grows phase by phase, never ahead of the code.

## Phase 0: Scaffold and spikes

Goal: a clean toolchain, and measured answers to the three risks.

- [x] Remove the previous tree. Scaffold with `zile new`, Vite+ (oxfmt, oxlint, `vp test`), TypeScript 7, and a pnpm catalog.
- [x] `AGENTS.md`, `.agents/design.md`, and this plan.
- [x] CI on `next`: check, types, and tests.
- [x] zyzz in the toolchain, with the `zyzz/oxlint` rules in `vite.config.ts`.
- [x] Playwright harness: `test/Playwright.ts` with console-error failure and `hydrated(page)`, and a CI job.
- [x] Stand-in model Worker in `test/workers/model` that replays a scripted turn over the OpenAI Responses API.
- [x] **Spike A, the agent in a page** (`spikes/agent`), with the stand-in model. The run against the real gateway waits for Cloudflare credentials.
- [x] **Spike B, rendering in a Worker** (`spikes/render`), in local workerd.
- [ ] **Spike C, AI Search** (`spikes/search/run.ts`). The script is ready. The run waits for Cloudflare credentials.
- [x] Decide how `vocs` depends on nanocode-ts. Decision below.

Done when: CI passes on `next`, the Playwright harness runs one smoke test, and the spike numbers and the Twoslash placement are recorded in this file.

### Phase 0 results

Measured on 2026-11-14 in an orb: 4 vCPU Intel Xeon at 2.60 GHz, headless Chromium 159, workerd 1.20261113.1, `nanocode-ts` `0624213`.

**Spike A, the agent in a page.** One turn over 50 Tempo pages (`tempoxyz/docs` at `e8f91d4`, 328 KB, 84 KB gzip), with the stand-in model, five fresh browser contexts, medians:

| Measurement                                                            | Value                                      |
| ---------------------------------------------------------------------- | ------------------------------------------ |
| `nanocode_wasm.wasm`                                                   | 13.00 MB raw, 4.57 MB gzip, 3.12 MB Brotli |
| sqlite-wasm                                                            | 0.88 MB raw, 0.35 MB Brotli                |
| Page JavaScript (nanocode-ts, bash, sqlite glue)                       | 845 KB raw, 281 KB gzip, 240 KB Brotli     |
| Compile both modules and mount 50 files, from localhost                | 120 ms                                     |
| Turn overhead with an instant model: two model calls and one `rg` cell | 280 ms                                     |
| WebAssembly memory after the turn                                      | 7 MB                                       |

- Over a network, the download dominates: 3.71 MB Brotli is about 0.6 s at 50 Mbit/s and 3 s at 10 Mbit/s. The agent must load on the first prompt, and should prefetch when the prompt box takes focus.
- Code Mode drives the shell through one `exec` custom tool (`tools.exec_command({ cmd })` in a JavaScript cell). `code_mode: true` and `workspace: bash.cwd` are required, or the session offers no workspace tools.
- The default Codex session also offers `image_gen` and `apply_patch`. Vocs must restrict the tool set.
- Model requests are OpenAI Responses API calls (`POST <endpoint>/responses`, SSE). `Provider.cloudflare` forwards that API to AI Gateway.
- Not measured yet: real time to first token and turn time through AI Gateway. These need `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, and a gateway.

**Spike B, rendering in a Worker.** Local workerd, a fresh isolate per sample, 10 warm requests each:

| Measurement                                        | Value                                           | Limit (Workers Paid)  |
| -------------------------------------------------- | ----------------------------------------------- | --------------------- |
| Bundle (Shiki, Twoslash, TypeScript 6)             | 11.4 MB raw, 1.85 MB gzip                       | 10 MB gzip, 64 MB raw |
| Startup CPU (`wrangler check startup`, three runs) | 80 ms, of which TypeScript evaluation is 50 ms  | 1 s                   |
| Shiki block, cold isolate / warm                   | 181 ms / 7 ms                                   | 30 s CPU              |
| Twoslash with lib types, cold / warm               | 1.6 s / 19 ms (cold includes the CDN lib fetch) | 30 s CPU              |
| Twoslash importing `viem`, cold / warm             | 10 to 20 s / 155 ms                             | 30 s CPU              |
| Types fetched for the `viem` sample                | 2,604 files, 23.4 MB                            |                       |

- TypeScript 6 runs in workerd with `nodejs_compat` only when `__filename` is defined, because it detects Node through `process`. Twoslash must use `@shikijs/twoslash/core`, since the main entry builds a filesystem-backed twoslasher on import.
- Type acquisition at render time is not viable: one package import fetches thousands of files, and unthrottled parallel fetches fail TLS handshakes.
- Local workerd timings approximate production CPU time. Production startup time and memory need a deploy.

**Twoslash placement.** Twoslash runs in the Worker. The build snapshots the type files of each pinned package into one content-addressed asset, and the render route loads it once per isolate. Rendered HTML is cached by the hash of block and snapshot, so each unique block runs Twoslash once. Phase 2 measures the snapshot trimmed to the files a program reads. A Node renderer is the fallback only if that snapshot does not fit in 128 MB with the TypeScript program.

**nanocode-ts dependency.** `vocs` cannot publish with a tarball URL dependency, and the `nanocode-ts` package is `private: true` with heavy dependencies (`viem`, `accounts`, `mppx`). Decision: ask the nanocode maintainers for an npm release of the browser entrypoints (`nanocode-ts`, `nanocode-ts/bash`) before phase 8. Until then, the catalog pins the release tarball for development. Vendoring the WebAssembly module and its glue is the fallback.

## Phase 1: Handler and chat, in custom mode

Goal: a host app mounts `Handler.from(config)`, and `<Ask />` answers Tempo questions with cited files.

- [x] `vocs`: `defineConfig` with validation and fault-then-fix errors.
- [x] `Source`: the contract, `Source.files`, and `Source.github` in `snapshot` mode.
- [x] The corpus build, `Corpus.build`: resolve revisions, fetch, write one content-addressed asset. It is a linear function, so it has no machine.
- [x] `vocs/vite` `vocs()`, which runs the corpus build and writes the corpus as a static asset. `vocs corpus` was dropped: the corpus is not public API, and hosts without Vite wait for `vocs build`.
- [x] `Provider`: `Provider.cloudflare` on AI Gateway. Named `Provider`, since nanocode's harness is the agent loop in the page and the adapter is the LLM provider behind the handler.
- [x] `vocs/server`: `Handler.from` with the model gateway (allowed models, size limit, per-address rate limit through a Workers rate-limiting binding), the corpus route, and the agent settings route. The host's bundler serves the agent module, so the handler has no module route.
- [x] `vocs/client`: `Client.create`, `machines.agent`, and `machines.turn`. The agent loads on the first `ask`.
- [x] `vocs/react`: `<Ask />` on `vocs/client`, with the files read listed under each answer.
- [x] A CI job that measures the size budgets and fails when one is exceeded (`pnpm check:budgets`). Turn overhead is not checked in CI yet.
- [x] `playground/custom`: a Worker host with a Vite and React page, configured with `tempoxyz/docs`, the Tempo TIPs, and `viem/tempo` (683 files, 7.5 MB, built in 12 s).
- [ ] The 20-question run against the real gateway. Skipped until Cloudflare credentials exist.

Done when: an end-to-end test asks a scripted question in `playground/custom` and sees the streamed answer and its cited files, and 20 real team questions get correct cited answers against the real gateway.

Finding: inlining the corpus in the Worker made the bundle 2.45 MB gzip with the three Tempo sources, against a 3 MB budget that Twoslash (1.85 MB) must also fit in. `vocs()` now writes the corpus as a static asset (7.5 MB, 1.74 MB Brotli, loaded on the first question), and the Worker is 4.7 kB gzip. The corpus is internal: `Handler.from(config, { basePath })` reads its URL from the config that `virtual:vocs/config` serves.

## Phase 2: Generated pages

Goal: a prompt becomes a streamed, refinable page with a permalink.

- [x] The block schema in Zod: `heading`, `prose`, `steps`, `code`, `codeGroup`, `callout`, `cards`, `fileTree`, `terminal`, `mermaid`, `demo`.
- [x] The page tools: create, read, update, and delete pages, and insert, replace, and remove blocks. `machines.guide` covers one page or several pages in sidebar groups.
- [x] `src/zyzz.config.ts` with the token set and the `vocs` layer. `id: 'vocs'` prefixes zyzz properties as `--z-vocs-*`, and each reads its public `--vocs-*` token. Output is atomic.
- [x] The package build compiles zyzz styles ahead of time and ships `vocs/styles.css` and `vocs/tokens.css`. The playground renders blocks without zyzz.
- [x] The block components in `vocs/react`, styled with zyzz, with `data-vocs` parts. A monochrome theme with light and dark defaults.
- [x] `mermaid` blocks render with Ondine. A diagram that does not compile fails its tool call.
- [x] `<Docs />` with home, docs, and chat views. The home view is a Lexical composer with Chat, Page, and Docs modes. Docs with more than one page get a sidebar.
- [ ] `machines.render` and the render route: blocks to streamed HTML with Shiki and Twoslash, where spike B decided. `vocs/rsc` `Blocks`.
- [ ] Twoslash failures return to the agent as a failed render.
- [ ] Hydration of interactive parts only: tabs, copy buttons, registered demos.
- [ ] `Storage`: `Storage.cloudflare` and `Storage.memory`. Saved pages, `<Page id />`, and server-rendered permalinks that load no WebAssembly.
- [ ] A chat reply can become a page.

Done when: end-to-end tests generate the "accept USDC in a Next.js checkout" page, refine it, load its permalink with JavaScript disabled, and see a wrong snippet caught and fixed.

## Phase 3: Quick mode

Goal: a site from `package.json` and `vocs.config.ts` alone.

- [ ] `vocs dev` and `vocs build`: Vite with `configFile: false`, or the project's `vite.config.ts` when present.
- [ ] The quick-mode app on `@vitejs/plugin-rsc` and `@cloudflare/vite-plugin`: prerendered home, permalink route, mounted handler. TanStack Start is the fallback.
- [ ] Conventions: `src/index.tsx`, `src/demos/*`, `src/concepts/*.mdx`, `src/styles.css`.
- [ ] `vocs build` output that `wrangler deploy` ships.
- [ ] `create-vocs` for quick mode.
- [ ] `playground/quick` with the same config shape as `playground/custom`.

Done when: every phase 1 and phase 2 end-to-end test passes against both playgrounds, and `pnpm create vocs` plus one GitHub source gives a working site.

## Phase 4: Search

Goal: the agent finds concepts, not only exact names.

- [ ] `Search`: the contract and `Search.cloudflare`, with upload keyed `<source>/<path>`, pruning, and a `source` filter.
- [ ] Indexing in `machines.corpus`, reindexing only changed sources.
- [ ] The `search` agent tool and its handler route.
- [ ] `Search.vectorize` and `Search.memory`.

Done when: the phase 1 question set passes with fewer agent tool calls than grep alone, and swapping `cloudflare` for `memory` is a config change that passes the same end-to-end test.

## Phase 5: Runtime mode and more sources

Goal: every source works in both modes.

- [ ] Runtime mounting: the handler serves `list` and `read`, and the page mounts each source as a lazy filesystem cached by revision.
- [ ] `github` in `runtime` mode.
- [ ] `googleDocs`, `url`, `openapi`, `endpoint`, and `from`.
- [ ] `mcp`: resources as files, tools proxied by the handler so tokens stay on the server.
- [ ] `visibility` enforcement, and `auth: 'reader'`.

Done when: the Tempo config in `design.md` runs with every source type, one source switches mode with one option, and a private source without `visibility: 'public'` fails the build with a clear error.

## Phase 6: Signed-in docs and verified code

Goal: docs act on the reader's account, and pages show whether their code ran.

- [ ] The handler's `reader` option, with key and scopes.
- [ ] Key fill in code blocks, and warnings for missing scopes.
- [ ] A testnet runner tool that runs a page's snippets and records the result on the saved page.
- [ ] `<Ask />` in a console page in `playground/custom`, with the reader's key.

Done when: an end-to-end test signs in, copies a snippet with the key filled in, and sees the saved page's latest testnet result.

## Phase 7: Agents, styling, and polish

Goal: other agents use the corpus, and hosts restyle everything.

- [ ] The MCP endpoint and `llms.txt`.
- [ ] The styling contract documented, and the default theme in light and dark.
- [ ] Accessibility: keyboard use, focus, `aria-live` for streaming, reduced motion.
- [ ] The Vocs docs site rebuilt in quick mode.

Done when: an external agent answers through the MCP endpoint, an end-to-end test restyles a playground with CSS alone, and the Vocs docs run on Vocs next.

## Phase 8: Release

Goal: `vocs@next` is published and Tempo runs on it.

- [ ] Add the Changesets release job to `next.yml`, enter pre mode with the `next` tag, and publish `vocs@next` and `create-vocs@next`.
- [ ] A migration note from the current Vocs.
- [ ] The Tempo pilot on a preview domain, then the cutover with the Tempo team.
- [ ] Decide when `next` replaces `main`.

Done when: Tempo's docs serve from `vocs@next` in production.

## Budgets

Each budget is set in the phase that first measures it. CI fails when a budget is exceeded.

| Budget                                   | Set in  | Value                                                                                                                                                                |
| ---------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Agent module and page JavaScript, Brotli | Phase 0 | 4 MB (measured 3.71 MB: 3.12 MB module, 0.24 MB JavaScript, 0.35 MB sqlite at `0624213`; 3.88 MB with sqlite workers in Phase 1; 3.96 MB with page tools in Phase 2) |
| Turn overhead with an instant model      | Phase 0 | 400 ms (measured 280 ms)                                                                                                                                             |
| Time to first token, warm, real gateway  | Phase 0 | To be measured with Cloudflare credentials                                                                                                                           |
| Worker bundle, gzip                      | Phase 0 | 3 MB (measured 1.85 MB)                                                                                                                                              |
| Warm block render in a Worker            | Phase 0 | Shiki 20 ms, Twoslash 250 ms (measured 7 ms and 155 ms)                                                                                                              |
| Page entry JavaScript with React, gzip   | Phase 1 | 180 kB (measured 160 kB). Raised from 100 kB in Phase 2, because the Lexical composer adds about 75 kB                                                               |
| Diagram compiler module, Brotli          | Phase 2 | 700 kB (measured 513 kB). Loads on the first `mermaid` block only                                                                                                    |
| Permalink time to first byte             | Phase 2 | To be measured                                                                                                                                                       |

## Risks

- **nanocode-ts has no npm release.** Phase 8 is blocked until the browser entrypoints publish to npm, or the module is vendored.
- **Twoslash type snapshots.** One `viem` import reads 2,604 type files (23.4 MB). Phase 2 must trim the snapshot to fit beside the TypeScript program in 128 MB.
- **plugin-rsc is 0.x.** Only the quick-mode app depends on it. TanStack Start is the fallback.
- **zyzz custom property names.** zyzz emits `--z-*` names, and a host that also uses zyzz can emit the same names. Phase 2 settles the token mapping.
- **XState in the page bundle.** It is part of the `vocs/react` budget.
- **Search cost.** AI Search bills per query from 2026-12-01. `vectorize` is the fallback.

## Out of scope

- Fee detection, from the original Slack thread.
- Migrating other wevm sites before phase 8.
- LLM evals. Phases use real question sets and end-to-end tests instead.
