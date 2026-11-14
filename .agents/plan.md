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
- [ ] Playwright harness: `test/Playwright.ts` with console-error failure and `hydrated(page)`, and a CI job.
- [ ] Stand-in model Worker in `test/workers/model` that replays scripted turns over the gateway's API.
- [ ] **Spike A, the agent in a page.** Pin one `nanocode-ts` release. Run one turn in a browser over sqlite-wasm, with 50 Tempo Markdown files in a `nanocode-ts/bash` memory filesystem and a Worker route to Cloudflare AI Gateway. Record module load, time to first token, and turn time.
- [ ] **Spike B, rendering in a Worker.** Render a Shiki block and a Twoslash block in a Worker. Record bundle size, startup time, CPU time per block, and peak memory against the Workers Paid limits: 64 MiB, 1 s startup, 128 MB, 30 s CPU.
- [ ] **Spike C, AI Search.** Upload 50 files with `items.upload` from a Worker, then query with a `source` filter. Record time to searchable and result quality on 10 questions.
- [ ] Decide how `vocs` depends on nanocode-ts, since a published package cannot depend on a tarball URL: an npm release, or a vendored build.

Done when: CI passes on `next`, the Playwright harness runs one smoke test, and the spike numbers and the Twoslash placement are recorded in this file.

## Phase 1: Handler and chat, in custom mode

Goal: a host app mounts `Handler.from(config)`, and `<Ask />` answers Tempo questions with cited files.

- [ ] `vocs`: `defineConfig` with validation and fault-then-fix errors.
- [ ] `Source`: the contract, `Source.files`, and `Source.github` in `snapshot` mode.
- [ ] `machines.corpus` and the corpus build: resolve revisions, fetch, write one content-addressed asset.
- [ ] `vocs/vite` `vocs()` and `vocs corpus`, both running the corpus build.
- [ ] `Model`: `Model.cloudflare` on AI Gateway.
- [ ] `vocs/server`: `Handler.from` with the model gateway (allowed models, size limit, per-address rate limit), the corpus route, and the agent route.
- [ ] `vocs/client`: `Client.create`, `machines.agent`, and `machines.turn`. The agent loads on the first `ask`.
- [ ] `vocs/react`: `<Ask />` on `vocs/client`, with the files read listed under each answer.
- [ ] `playground/custom`: a Worker host with a Vite and React page, configured with `tempoxyz/docs`, the Tempo TIPs, and `viem/tempo`.

Done when: an end-to-end test asks a scripted question in `playground/custom` and sees the streamed answer and its cited files, and 20 real team questions get correct cited answers against the real gateway.

## Phase 2: Generated pages

Goal: a prompt becomes a streamed, refinable page with a permalink.

- [ ] The block schema in Zod: `heading`, `prose`, `steps`, `code`, `codeGroup`, `callout`, `cards`, `fileTree`, `terminal`, `mermaid`, `demo`.
- [ ] The page tool: emit blocks one at a time, and revise a page in place. `machines.page`.
- [ ] `src/zyzz.config.ts` with the token set and the `vocs` layer. Decide how zyzz tokens read the public `--vocs-*` properties without colliding with a host's `--z-*` properties, and whether output is atomic or grouped.
- [ ] The package build compiles zyzz styles ahead of time and ships `vocs/styles.css` and `vocs/tokens.css`. An end-to-end test renders a block in a host without zyzz.
- [ ] The block components in `vocs/react`, styled with zyzz, with `data-vocs` parts.
- [ ] `machines.render` and the render route: blocks to streamed HTML with Shiki and Twoslash, where spike B decided. `vocs/rsc` `Blocks`.
- [ ] Twoslash failures return to the agent as a failed render.
- [ ] Hydration of interactive parts only: tabs, copy buttons, registered demos.
- [ ] `Storage`: `Storage.cloudflare` and `Storage.memory`. Saved pages, `<Page id />`, and server-rendered permalinks that load no WebAssembly.
- [ ] `<Docs />` with home, page, and chat views. A chat reply can become a page.

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

| Budget                         | Set in  | Value                                                    |
| ------------------------------ | ------- | -------------------------------------------------------- |
| Agent module, gzip             | Phase 0 | To be measured (nanocode-ts is 3.8 MB gzip at `543b857`) |
| Time to first token, warm      | Phase 0 | To be measured                                           |
| Block render CPU in a Worker   | Phase 0 | To be measured                                           |
| `vocs/react` page bundle, gzip | Phase 1 | To be measured                                           |
| Permalink time to first byte   | Phase 2 | To be measured                                           |

## Risks

- **nanocode-ts has no npm release.** Phase 0 decides how `vocs` depends on it.
- **Twoslash in a Worker.** Spike B decides. A Node renderer is the fallback.
- **plugin-rsc is 0.x.** Only the quick-mode app depends on it. TanStack Start is the fallback.
- **zyzz custom property names.** zyzz emits `--z-*` names, and a host that also uses zyzz can emit the same names. Phase 2 settles the token mapping.
- **XState in the page bundle.** It is part of the `vocs/react` budget.
- **Search cost.** AI Search bills per query from 2026-12-01. `vectorize` is the fallback.

## Out of scope

- Fee detection, from the original Slack thread.
- Migrating other wevm sites before phase 8.
- LLM evals. Phases use real question sets and end-to-end tests instead.
