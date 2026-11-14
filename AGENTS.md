# Agent Guidelines

Adapted from the general sections of these guidance files, retrieved 2026-11-14. Project-specific rules from each source are left out.

| Source                                                                            | Commit    | Sections used                                                                         |
| --------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------- |
| [`wevm/zyzz`](https://github.com/wevm/zyzz/blob/main/AGENTS.md)                   | `b5124eb` | TypeScript, ordering, modules, inference, abstraction, documentation, tooling         |
| [`wevm/ondine`](https://github.com/wevm/ondine/blob/main/AGENTS.md)               | `9331bde` | Prose, testing, benchmarks, workflow                                                  |
| [`tempoxyz/accounts2`](https://github.com/tempoxyz/accounts2/blob/main/AGENTS.md) | `0d83b25` | Runtime, errors, friction logging                                                     |
| [`tempoxyz/id`](https://github.com/tempoxyz/id/blob/main/AGENTS.md)               | `770797e` | State machines, Workers runtime, performance, logging, end-to-end tests, explanations |

## Project Principles

- Vocs is documentation that readers talk to. A [nanocode](https://nanocode.xyz) agent runs in the reader's page, reads the site's sources, and answers in chat or generates a page of typed blocks. `.agents/design.md` holds the design and `.agents/plan.md` holds the phases and their acceptance gates.
- The core is a web-standard handler, `(Request) => Response`, in `vocs/server`. The CLI, the Vite plugin, the React components, and the quick-mode app are layers around it. The handler runs anywhere `fetch` runs.
- Two consumption modes share one core. Quick mode is a `package.json` and a `vocs.config.ts`. Custom mode embeds `vocs/server`, `vocs/client`, and `vocs/react` in a host app. A feature is done when it works in both modes.
- Adapters are public entrypoints, one per kind: `vocs/sources`, `vocs/search`, `vocs/models`, and `vocs/storage`. Consumers import them as namespaces, such as `import * as Source from 'vocs/sources'`.
- This branch is a rewrite from a fresh slate. Vocs v1 and the Vocs on `main` are prior art only. Do not port, copy, or mirror their code, APIs, or file layout. Read them only to learn which problems exist.
- The model never runs arbitrary code in the reader's page. It emits typed blocks, and a `demo` block names only a component the site registered.
- Every rendered element is public styling API: a `data-vocs` name, `data-vocs-part` names, state attributes, and `--vocs-*` tokens. Change them only with a semver-major release.
- Secrets stay in the handler. Model keys, search tokens, and source credentials never reach the page, the corpus, an error, or a log.
- Performance is a feature. A permalink renders on the server and loads no WebAssembly. The agent module loads on the first prompt, not on page load.

## TypeScript Conventions

- Treat `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess` as design constraints. Include `| undefined` when an optional property can explicitly receive `undefined`, and narrow indexed reads before use.
- Use `readonly T[]` for array types. Keep mutable arrays only when mutation is part of the contract.
- Use `type` for project-owned shapes. Use `interface` only when declaration merging or an external ambient contract requires it.
- Include `.js` extensions on relative imports and exports so source stays valid under NodeNext ESM.
- Author every source file and script in TypeScript. `.js` files are banned. Node runs TypeScript natively (`node script.ts`), so scripts need no build step.
- Import module-shaped internal files as namespaces (`import * as Corpus from './Corpus.js'`) and access members through the module name. Named imports are fine for types, leaf helpers, and third-party APIs that are not module namespaces.
- Import Node built-ins as namespaces unless the neighboring code or API is clearer with a named import.
- Re-export public module files as namespaces (`export * as Handler from './Handler.js'`). Do not flatten sibling-module symbols into a barrel.
- Use static imports. Use a dynamic import only at a real runtime or bundle boundary, such as loading the agent module on the first prompt. Never use one to work around a dependency cycle.
- Use `import type` and `export type` where an import or export is type-only.
- Use functions and plain data for normal APIs. Classes are limited to errors and framework-required entrypoints such as Durable Objects.
- Keep error classes in the module that throws them, ordered alphabetically with its public exports. Set custom error `name` values to the namespaced form, such as `Config.InvalidError`.
- Model every value with more than one case as an enumerated string-literal union or an `as const` object. TypeScript `enum` is banned, because Node type stripping and `erasableSyntaxOnly` reject it.
- Never model state with booleans. Two booleans that describe one thing are one union, such as `status: 'idle' | 'loading' | 'ready' | 'failed'`. This applies to options too: prefer `visibility: 'private' | 'public'` over `public: boolean`.
- Prefer `camelCase` constants. Keep uppercase names only when they mirror an external protocol.
- Use `const` generic parameters when callers should keep literal or tuple types.
- Default optional option bags in the signature (`options: fn.Options = {}`), not with `options?: fn.Options` and downstream fallback logic.
- Name typed option bags `options`. Use a domain noun only when the value is not an options bag.
- Prefer one named object parameter over several positional parameters. An instance-like receiver such as `client`, `cache`, or `store` may be the first positional parameter, followed by an options bag.
- Put a function's parameter, return, and error types in a matching `declare namespace` (`resolve.Options`, `resolve.ReturnType`, `resolve.ErrorType`). Keep a sibling exported type only when several functions share the domain type.
- Avoid inline object types on local variables. When an explicit local object type improves clarity, name it directly above the use.
- Do not extract a named type until it is reused or makes a difficult shape materially easier to read.
- Keep shared domain types beside the module that owns the concept.
- Group a module's Zod schemas in a `schema` namespace, and derive their types beside them (`schema.Block`). Export the namespace only when another module validates against the same shape.
- Let declared return types constrain intermediate expressions. Avoid redundant local annotations.
- Return values directly unless a binding is reused or gives a complex expression a useful name.
- Prefer immediately invoked function expressions (IIFEs) with explicit branches and early returns over nested or complex ternary expressions. Keep simple two-way ternaries when both branches are easy to scan.
- For a fallible local derivation, prefer an IIFE expression over a mutable variable assigned across `try` and `catch` blocks.
- Never destructure parameters in function definitions, including arrow functions, callbacks, and methods. Accept a named parameter and destructure inside the body when reading several properties.
- Declare component props as `Component.Props` inside the component's matching namespace, including nested components such as `Card.Group.Props`. Do not use inline props types or standalone props aliases.
- Prefer short names whose meaning is clear from local context, such as `options`, `client`, `entry`, and `fn`.
- Keep wire formats, ordered tuples, protocol fields, and other order-sensitive shapes explicit. Do not alphabetize data whose order has meaning.
- Avoid new `any`. Use a precise boundary type, validation, narrowing, or the smallest justified assertion.
- Separate distinct contexts and logical steps with one blank line: setup, guard clauses, derivation, mutation or emission, and final returns. Avoid both dense uninterrupted logic and a blank line after every statement.
- Keep a lookup with its immediate guard, related local declarations, and consecutive assertions together.
- Do not use section-divider comments. Use exports, TSDoc, and whitespace to express module structure.
- Comment invariants and non-obvious reasons, not line-by-line mechanics. Keep comments independent of plans, task IDs, and prior versions.

## Alphabetical Ordering

- Alphabetize imports, named import and export specifiers, public exports, type properties, object properties, union members, unordered lists, configuration maps, scripts, and dependencies. Use case-insensitive lexical order.
- Keep attached documentation with the declaration or property it describes. Keep function overloads and their namespace together. Do not introduce use-before-initialization or reorder execution.
- Keep order that has observable meaning: authored CSS declarations, cascade layers, tuples, package file inclusions followed by exclusions, workflow steps, middleware and plugin order, and block order in a page. Mark intentional exceptions in a nearby comment.
- Keep `name` and `on` first in GitHub workflows, then alphabetize the remaining top-level keys. Keep the scaffold package.json group order around `[!start-pkg]`, and alphabetize entries within each group. Do not alphabetize prose sections or sequential phases.

## Module and Instance Conventions

- Organize each module file as one conceptual namespace that holds its public types, constants, functions, and errors. Consumers read calls as `Module.operation(...)`.
- Prefer stateless module functions for pure behavior. Do not create an instance when inputs fully describe the operation.
- When behavior needs dependencies or lifecycle state, expose a factory such as `Module.create(options)` that returns a plain object of operations and data.
- Construct instances explicitly at the application boundary and pass them down. Do not hide construction in imports or module-scope singletons.
- Scope an instance to the lifecycle that owns its state, such as one CLI run, one Worker request, one agent turn, or one test.
- Inject environment-specific capabilities through factory options or narrow structural types. Keep filesystem, network, cache, clock, and platform bindings out of domain modules.
- Let factory operations close over shared dependencies and state. Do not return methods that depend on `this`.
- Keep one authoritative instance value. Derive related helpers and views from it instead of duplicating configuration or state.
- Keep mutable caches and registries private to the instance. Expose explicit operations, and provide disposal only when the lifecycle requires it.
- Avoid side-effect registration. The package sets `sideEffects: false`, so an import used only to install global behavior can disappear from a bundle.
- Keep transport-independent planning, parsing, and normalization pure. Put filesystem, network, and Worker behavior in thin adapters around that core.
- Keep internal helpers under `internal/` and export them only when another module has a real contract with them.
- Keep the public surface lean, and derive values the library already knows.
- A framework-mandated class delegates reusable logic to module functions, so the class stays a small lifecycle adapter.

## Adapters

- Use an adapter when one contract has several interchangeable backends: sources, search, models, and storage. Do not add an adapter layer for a single implementation.
- An adapter is a plain object with a `type` literal and async operations. Build it with a factory named for the backend, such as `Search.cloudflare(options)`, and provide `from(adapter)` for custom backends.
- Each adapter kind has its own entrypoint (`src/sources/index.ts` for `vocs/sources`), with one module per backend. A consumer that imports one backend bundles no other backend.
- Type the contract by the smallest capability the core consumes, not by a concrete SDK client.
- Adapters receive the request context (`env`, reader) on every call. They read secrets and bindings per call and never capture them at module scope.
- Optional capabilities are optional operations, such as `index?` on a search adapter. Never signal a capability with a boolean.
- Each built-in adapter has an integration suite against its real backend, or a real local equivalent. Suites that need cloud credentials skip with a stated reason when the credentials are absent.

## Type Inference Conventions

- Keep literal inputs through public helpers when those literals affect the output type.
- Keep generic types flowing from inputs through callbacks and return values. Do not erase them to `any` at an internal seam.
- Keep public callbacks, options, and return values free of `any`.
- Add consumer `.test-d.ts` fixtures beside their owning module when public inference or narrowing changes. Import public entrypoints.
- Revisit inference after an API change. Prefer a narrower useful contract over a broad type that merely compiles.

## Abstraction Conventions

- Start with concrete code and extract only after repeated uses reveal a stable shared contract.
- Prefer small local duplication over an abstraction that adds flags, modes, or call-site-specific branches.
- Wait for at least three concrete uses before introducing a general abstraction, unless a hard boundary already exists.
- Optimize for code that is easy to change, not maximum DRYness.
- Keep authoritative state, configuration, schemas, and constants in one place, and derive dependent values.
- Avoid wrappers that only rename another function or mirror an SDK without narrowing capabilities or adding a domain contract.

## State Machines

Use XState v5 for lifecycles and `@xstate/store` for event-driven stores. Zustand, Redux, and `let`-flag stores are banned. Every state a lifecycle can be in is a named machine state. A state that exists only as a combination of variables is an implicit state, and implicit states are banned.

| State                                                      | Model                                              |
| ---------------------------------------------------------- | -------------------------------------------------- |
| One value with two or three cases                          | A union `useState` or `let`                        |
| Several values that change together, with no states        | An `@xstate/store` store                           |
| A lifecycle with async events, timers, overlaps, or guards | An XState machine                                  |
| A value that combines two or more flags or statuses        | A state of an XState machine                       |
| A record that transitions across requests                  | A conditional write that checks the current status |

Lifecycles in Vocs that are machines from the start: the agent turn, the agent module load, block rendering, page generation and refinement, the corpus build, source refresh, and search indexing.

- A compound conditional over state is an unnamed state. Lift it into a machine:
  - A value that combines flags with `&&`, `||`, or a ternary, such as `streaming = status === 'running' || (status === 'tool' && blocks > 0)`.
  - A guard that combines flags, such as `if (!prompt || turn.isPending || turn.isDone) return`.
  - A prop that combines flags, such as `disabled={sending || loading || !ready}`.
- State is a value that changes over time: `useState`, `useRef`, `let`, request status flags, and snapshot reads.
- Rate a conditional by its state operands, the reads of state that it combines. Count a read once, however often it repeats:

  | Complexity | The conditional                                                                  | Model                          |
  | ---------- | -------------------------------------------------------------------------------- | ------------------------------ |
  | Low        | Reads one or two state operands with one operator                                | Inline                         |
  | Medium     | Reads three state operands, mixes `&&` and `\|\|`, or reads another derived flag | A machine state, tag, or guard |
  | High       | Reads four or more state operands, nests a ternary, or repeats across functions  | A machine state, tag, or guard |

- If a conditional rates medium or high, use a machine. If a low conditional grows, rate it again.
- Name each combination as a state or tag. Read it with a selector, such as `machines.streaming(snapshot)`.
- Several exclusive booleans, such as `editing` and `adding`, are one union.
- Input validation, type guards, and checks of request fields are not state.
- Do not write a machine for a linear async function, such as a retry loop.
- The snapshot is the only source of state. Never hold one value in both a store and a machine.
- Machines are deterministic. A machine reads no clock, random value, or I/O. The same events always produce the same states.

**Structure**

- Put each machine in `export namespace machines` at the bottom of the module that runs it. A React component's machine lives in its `.tsx`.
- Define each machine as `export const <name> = setup(...).createMachine(...)` in `machines`, read as `machines.turn`.
- Merge a type-only `export namespace <name>` with it for `Context`, `Event`, `Actor`, and `Snapshot`, read as `machines.turn.Snapshot`. Derive `Actor` from `typeof <name>`.
- Put readers and pure decisions beside the machine, as `export function`s of `machines`, such as `machines.status(snapshot)`.
- Inside `machines`, refer to a machine's types through its namespace, such as `turn.Event`. A bare `Event` names the DOM's.
- Module-scope code above `machines` runs before it, so it never reads `machines`.
- Keep machines pure. The runner provides effects with `machine.provide({ actions, actors })`.
- Define with `setup({ actions, guards, types }).createMachine({...})`. Name every action and guard, including `assign`s.
- Callbacks take one parameter, `args`, and narrow with `assertEvent(args.event, type)`.
- Declare provided actions as no-ops in `setup`, with TSDoc naming the provider.
- Type with `types: { context: {} as Context, events: {} as Event }`. Export `Context` and `Event` with TSDoc on every member.
- Export `type Actor`, `type Snapshot`, and snapshot readers such as `status(snapshot)`. Never compare `snapshot.value` across modules.

**States, events, and context**

- Name states for what is true, in camelCase: `loading`, `streaming`. States that consumers read are public API.
- Name events for what happened, in dot notation: `prompt.submit`, `block.complete`. Events carry only what the transition needs.
- `context` holds only what states cannot express. Never a promise, stub, or client.
- Change `context` only with `assign`.
- Derive a multi-value status in one exported `select(context)`, with its priority table in TSDoc.
- Prefer per-state transitions. Use root `on` only for events every state handles the same way.
- Use `after` for timers, and `invoke` with `fromPromise` or `fromCallback` for state-owned work. No timer IDs or `AbortController`s beside a machine.
- Every machine has explicit terminal or idle states for success, failure, and cancellation. No path ends in an unnamed or transient state.

**Running a machine**

- Create actors with `createActor(machine).start()` in the owning lifecycle, never at module scope.
- Wait with `waitFor(actor, predicate)`.
- Expose actors read-only. For common reads, expose a stable `{ get, subscribe }` pair.
- `vocs/client` does not depend on `@xstate/react`. React reads `{ get, subscribe }` with `useSyncExternalStore`.

**Machines in React**

| Need                                | Hook                                                |
| ----------------------------------- | --------------------------------------------------- |
| A component owns a machine          | `useActorRef(machine.provide({ actions, actors }))` |
| A component reads a snapshot value  | `useSelector(actorRef, selector, compare)`          |
| Components below a parent share one | `createActorContext(machine)` and its `Provider`    |
| An effect reacts to each snapshot   | `actorRef.subscribe` in a `useEffect`               |

- Use `useActorRef`, not `useMachine`.
- Define selectors at module scope or in the machine file. Pass `shallowEqual` for selectors that return new objects.
- Provide effects with `.provide()` in the `useActorRef` call. Never copy props into context.
- Keep entry actions with I/O idempotent, since StrictMode restarts the actor.
- Send events from handlers and effects, never during render.

**Testing machines**

- Test a module's machines in its `<Module>.test.ts`, in a `describe('machines.<name>')` per machine, without I/O.
- Arrange, act, assert: start the actor, send a flow's events, and assert `snapshot.value` and changed `context`.
- Assert effects by recording provided actions' arguments in an array. No `vi.fn`. Never replace a guard.
- Provide invoked actors with scripted `fromPromise` results, and assert their inputs.
- Cover the graph with `getShortestPaths` from `xstate/graph`:
  - Build `events` from a `Record` keyed by every `Event` type, offering only events the runner sends from each state.
  - Assert with `snapshot.can(event)` that every type is handled somewhere.
  - Give `serializeState` the status values, not growing counters.
- At each path's end, assert the state agrees with `select(context)`. Never use `getSimplePaths`.

## Runtime Conventions

- Module scope holds only constants and immutable data. Never cache a `Request`, `Response`, stream, binding, or request-bound client there.
- Construct clients lazily inside a request. Keep top-level work free of I/O.
- Read `Date.now()` inside the call, never at module scope.
- Use `crypto.getRandomValues()` and `crypto.randomUUID()`. `Math.random()` is banned.
- Compare secrets in constant time with `crypto.subtle.timingSafeEqual`, after SHA-256 for variable lengths.
- Await or return every promise. Mark `void` only with a reason.
- Read a request body once. Forward bodies as streams.
- Reach services through bindings, not public URLs, when the handler runs on Workers.
- Code in `vocs`, `vocs/server`, and the adapter entrypoints runs on Workers, Node, Bun, and Deno. Only `vocs/vite` and the CLI may import Node built-ins.

## Performance

- Reuse values the request already holds. Never read the same thing twice.
- Run independent calls in `Promise.all`.
- Never add a round trip to a flow. Return the next step's data in the same response.
- Pass non-response work, such as cache writes and index updates, to `waitUntil()`.
- Cache by content hash or revision. A cache key that cannot change when its input changes is a bug.
- Stream every response that can stream: chat tokens, generated blocks, and rendered HTML.
- Keep budgets for the page bundle, the agent module, time to first token, and permalink time to first byte. CI fails when a budget is exceeded. Record each budget and its measurement in `.agents/plan.md`.
- A change adds no duplicate call, no extra round, and no sequential call without a dependency. State the reason for each exception in the commit body.

## Errors

- Write messages as the fault, then the fix: `Source "docs" has no files. Check the include pattern.`
- Name the source, block, or config path in each message.
- Surface build-time errors through the Vite plugin context (`this.error`, `this.warn`) in `vocs/vite`, and through a non-zero exit in the CLI.
- Never include tokens, secrets, or source credentials in an error.

## Logging

- Log only through a `Log` module. `console` is banned in `src/`, except in the CLI's user-facing output.
- `Log.error`: unexpected failure. `Log.warn`: recoverable problem. `Log.info`: routine event worth keeping.
- `message` is a fixed sentence. Put values in `fields`.
- `fields` never hold tokens, secrets, prompts, bodies, headers, or personal data.
- Never log expected errors. A `catch` that recovers from an unexpected failure logs it.

## Styling Conventions

- Every element carries a stable `data-vocs` name. Its pieces carry `data-vocs-part`, and its states carry attributes such as `data-state` and `data-kind`. State attributes take enumerated values, never `true` and `false`.
- Read every color, font, radius, and space from a `--vocs-*` custom property.
- Put the default theme in `@layer vocs`, so unlayered host CSS wins without `!important`.
- Do not put utility classes in rendered markup. Server-rendered HTML carries the same attributes as client-rendered HTML.
- Respect `prefers-reduced-motion` and `prefers-color-scheme`. Use accessible native controls with keyboard activation, visible focus, and accessible names.

## Code Documentation

- Start every maintained TypeScript module with a brief standalone TSDoc `@module` comment that describes its responsibility. Place it before imports, or after a required shebang.
- Add TSDoc to every public export and public type property. Write or update the contract documentation with the implementation.
- Document caller-visible purpose, inputs, output, defaults, errors, and side effects. Keep low-level wiring in nearby implementation comments.
- Update the owning entrypoint documentation when adding or changing a public module.

## Prose Conventions

Applies to documentation, comments, TSDoc, interface copy, and commit messages.

- Write about the code, not about the person who uses it. Avoid second person outside interface copy.
- Describe behavior in technical terms, not by the experience it produces. Prefer `streams blocks as they complete` over `feels fast`.
- Write formally, concisely, and technically. Use precise verbs such as "returns", "renders", "streams", "rejects", "emits", "serves", and "throws".
- State an invariant or a reason the code cannot show on its own. Leave out justification the code already makes plain.
- Write close to ASD-STE100 Simplified Technical English. Use the short, common word: "use", "start", "before", "about", not "utilize", "commence", "prior to", "approximately".
- Use one word for one thing. Do not use a synonym for variety.
- Keep an instruction to 20 words or fewer, and a descriptive sentence to 25 words or fewer.
- Keep each paragraph to one topic and six sentences or fewer. Use a vertical list for sequential steps or several conditions.
- Put a condition before the instruction it controls.
- Use the active voice in instructions.
- Do not stack more than three nouns, except in a technical name.
- Do not leave out "the", "a", or "this" to make a sentence shorter.
- Use a diagram, not prose, to show a flow, and keep it to about 12 nodes. Use a table, not a paragraph, to compare options.
- Do not use semicolons or em dashes in prose. Semicolons stay valid inside code and CSS.

## Testing Conventions

End-to-end tests are the main proof that Vocs works. Integration tests cover only complex logic. Unit tests are banned.

| Kind        | Covers                                                                            | Runner                   | Location                  |
| ----------- | --------------------------------------------------------------------------------- | ------------------------ | ------------------------- |
| End-to-end  | Every reader-facing feature, in quick mode and custom mode                        | Playwright               | `test/e2e/*.e2e.ts`       |
| Integration | State machines, the corpus build, block rendering, adapters against real backends | Vitest through `vp test` | `src/**/<Module>.test.ts` |

- Test behavior: public contracts, reader flows, security boundaries, and errors. Never styling details.
- No unit tests, private-helper tests, or per-function suites disguised as integration tests.
- No mocks, stubs, fakes, module replacements, fake timers, or stubbed globals. Use real Workers runtimes, real browsers, real files, and real processes.
- A stand-in service is allowed when the real one is paid or nondeterministic. It is a real server under `test/workers/` that speaks the real protocol, such as a model server that replays scripted turns over the gateway's API. A separate opt-in suite runs the same flows against the real gateway.

**End-to-end**

- Every feature adds or updates an end-to-end test. If a browser cannot drive a feature, state the reason in the commit body.
- Run each suite against production builds of `playground/quick` and `playground/custom`.
- Import `test` and `expect` from `test/Playwright.ts`. Tests fail on any console error.
- Wait for observable conditions, such as `hydrated(page)` or a locator assertion. Never wait for `networkidle`.
- Each test stands alone, since CI shards by test.
- Run each new or changed end-to-end test before a push. Report a test that did not run as not run.

**Integration**

- Keep a module's tests in one `<Module>.test.ts` beside it. Group tests in a `describe` named for the public function or machine.
- Assert observable results with inline snapshots (`toMatchInlineSnapshot`, `toThrowErrorMatchingInlineSnapshot`), one value each. Use property matchers only for nondeterministic fields. Never derive expectations from the implementation.
- Add a regression scenario for every bug fix, end-to-end when a browser can drive it.
- Use bounded waits (`expect.poll`, locator assertions). No sleeps or retries.
- Isolate real resources, and clean them up after success or failure.
- Exclude tests, fixtures, and benchmarks from published files.

## Benchmark Conventions

- Benchmark complete public workflows: corpus build, block render, cold agent load, time to first token, and permalink render.
- Validate equivalent work before comparing two runs.
- Record raw, gzip, and Brotli sizes for each entrypoint and for the agent module.
- Record commit, tool versions, hardware, warmup, sample count, median, and p95. Confirm timing regressions with repeated samples instead of single-run gates.
- Keep generated reports under ignored `bench/results/`.

## Workflow Conventions

- Run the smallest script that covers the changed behavior while iterating.
- Run `pnpm check:types` after TypeScript changes.
- `pnpm check` runs formatting and syntax-only lint with fixes. Keep only task-related fixes.
- Run `git diff --check` and review the diff before finishing.

## Git Conventions

- Work lands directly on `next`. Never open a pull request. `main` keeps shipping the current Vocs.
- Conventional commits, lowercase, no trailing period: `feat:`, `fix:`, `perf:`, `refactor:`, `docs:`, `test:`, `chore:`. The scope is optional.
- Name what changed, with codebase identifiers. State the change, not the reason.
- Each message stands alone for a reader who has not seen the task that produced it.
- Never force push and never amend a pushed commit. Correct a mistake with a follow-up commit.

## Explanations

For in-session explanations to maintainers, not committed to the repository.

| Explanation                            | Format                        |
| -------------------------------------- | ----------------------------- |
| One fact or a short answer             | Prose, with a table if needed |
| One flow or structure                  | A diagram, then steps         |
| Several flows, layers, or a comparison | One self-contained HTML page  |

- Lead with a diagram or table. Cite facts as `file:line`.
- Never include tokens, secrets, `.env` values, or personal data.
- Move durable content into `.agents/` or the docs, never an explanation page.

## Repository Layout

- `src/`: one directory per entrypoint (`server/`, `client/`, `react/`, `rsc/`, `vite/`, `cli/`, `sources/`, `search/`, `models/`, `storage/`), PascalCase modules, and `internal/` for unexported helpers. `src/index.ts` is the `vocs` entrypoint.
- `src/styles/`: `styles.css` (tokens and the default theme) and `tokens.css`.
- `playground/quick` and `playground/custom`: the two consumption modes, with one shared `vocs.config.ts` shape. End-to-end tests run against them.
- `test/e2e/`: Playwright suites. `test/workers/`: stand-in services. `test/fixtures/`: reusable input corpora.
- `.agents/design.md` holds the design and public API. `.agents/plan.md` tracks phases, acceptance gates, and budgets.

## Tooling

- Declare all package dependencies with `catalog:` references. Keep versions in `pnpm-workspace.yaml`, never inline in package manifests.
- Prettier, ESLint, and Biome are banned. Use Vite+ with oxfmt for formatting and oxlint for linting, configured in `vite.config.ts`.
- Use zile for library builds and development linking. Zile derives build inputs from package entrypoints.
- Use TypeScript 7 for type checks.
- Put scripts, devDependencies, and packageManager before `[!start-pkg]` in package.json. Package metadata and runtime dependencies follow it.
- Use the single scaffold `tsconfig.json`.

## Commands

- `pnpm build` builds the package with zile. `pnpm dev` links source entrypoints with `zile dev`.
- `pnpm check` runs `vp check --fix`. `pnpm check:types` runs TypeScript.
- `pnpm test` runs the integration suites with `vp test`.

## Friction Logging

- Log papercuts and friction (tooling, docs, APIs, tests, conventions) as they occur with `pnpx frog log`.
- Run `pnpx frog list` first to see what is already known.
- Do not log global, system, or internal friction.
