# AGENTS.md

This file provides guidance to AI agents when working with code in this repository.

## Overview

Vocs is a **portable documentation framework powered by Vite**. This is Vocs v2, a ground-up rewrite and successor to [Vocs v1](https://vocs.dev), designed to be the best-in-class documentation framework for technical projects.

### Vision

Vocs v2 aims to be:

- **Portable** – Built as a Vite plugin, Vocs can be plugged into any Vite-based application. No framework lock-in.
- **Modern** – First-class React Server Components support via Waku, MDX with advanced code highlighting (Shiki + Twoslash), and Tailwind CSS.
- **Developer-first** – Exceptional DX with hot reloading, TypeScript-first APIs, and minimal configuration.
- **Performant** – Static site generation, optimized bundles, and smart caching for Twoslash.
- **Extensible** – Modular architecture allows customization at every layer.

When contributing, reflect these principles: prefer Vite plugins over custom CLIs; prefer RSC-compatible patterns when adding React features.

### Competitive Landscape

Vocs is an alternative to documentation frameworks like Docusaurus, Nextra, VitePress, Starlight, and Fumadocs. It differentiates by being Vite-native and framework-agnostic while providing first-class Waku integration.

When in doubt, reference `_/` (reference implementations of competing frameworks and Vocs v1) for patterns rather than reinventing APIs.

### Project Status

This project is **heavily in progress**. See `ROADMAP.md` for the full feature checklist.

- Prefer work aligned with `ROADMAP.md` over ad hoc features
- Avoid breaking v1 parity unless the roadmap indicates a deliberate change

## Commands

```sh
# Development
pnpm dev:playground    # Start playground dev server for testing

# Building & Type Checking
pnpm build             # Build the library using zile
pnpm check:types       # Typecheck with tsc

# Code Quality
pnpm check             # Lint + format with Biome

# Testing
pnpm test              # Run all tests (vitest ./src)
pnpm vitest src/internal/sidebar.test.ts  # Run a single test file
```

### When to Run

- Before any PR or large change: `pnpm check && pnpm test`
- For type-driven refactors: run `pnpm check:types` frequently
- For changes affecting the docs site: run `pnpm dev:playground` and verify manually

## Architecture

Vocs is built as a Vite plugin with optional Waku (React Server Components) integration. This separation keeps the core framework-agnostic while enabling RSC features when desired.

### Directory Structure

| Directory | Purpose | When to Add Here |
|-----------|---------|------------------|
| `src/internal/` | Core logic: config, MDX, Shiki, Vite plugins | Framework-agnostic features, config changes, MDX transforms |
| `src/react/` | React components (Layout, Callout, Link, etc) | User-facing components |
| `src/react/internal/` | MDX-specific components (CodeBlock, Steps, etc) | Components only used within MDX |
| `src/server/` | Server utilities | Server-side logic |
| `src/waku/` | Waku framework integration: router, middleware, plugins | RSC-specific behavior |
| `src/styles/` | Tailwind CSS styles | Design system changes |
| `playground/` | Development playground (real Vocs site) | Testing features end-to-end |
| `_/` | Reference implementations (read-only) | Do not modify; use for reference only |

### Entry Points

| File | Purpose | Extension Pattern |
|------|---------|-------------------|
| `src/vite.ts` | Core Vite plugin (MDX, Tailwind, icons, config) | New core plugins compose into the array returned here |
| `src/waku/vite.ts` | Waku-specific Vite plugin, wraps core + adds RSC | Waku-only plugins go here |
| `src/index.ts` | Public API exports | Only stable, public APIs; keep experimental APIs internal |
| `src/config.ts` | Public config export (`defineConfig`) | Config schema changes |

### Key Internal Modules

| Module | Responsibility | Invariants |
|--------|----------------|------------|
| `internal/config.ts` | Config resolution, serialization, global state | Always go through `Config`/`defineConfig`; never read raw user config directly |
| `internal/mdx.ts` | MDX compile options, remark/rehype plugins | Add new MDX plugins here, not scattered in Vite plugins |
| `internal/vite-plugins.ts` | Vite plugins for MDX, virtual config, route watching | All Vocs-specific Vite behavior encapsulated here |
| `internal/sidebar.ts`, `internal/topNav.ts` | Navigation parsing from config | Handle nested items, collapsing, active state |
| `internal/shiki-transformers.ts` | Shiki code highlighting transformers | Code block styling, line highlighting, diffs |
| `internal/twoslash/` | Twoslash integration with caching | TypeScript code examples with type hints |

### Virtual Modules

| Module | Purpose | Usage |
|--------|---------|-------|
| `virtual:vocs/config` | Serialized config, hot-reloads in dev | Import from Vite app side / RSC environment only |
| `virtual:vocs/user-styles` | User's `_root.css` from pages directory | Injected automatically |

When adding new user-extensible entrypoints, create a `virtual:vocs/*` module and wire it via `internal/vite-plugins.ts`.

## Code Style

### Module Pattern

This project uses **module-driven development**. Each module exports functions, and modules represent their own "instance". This keeps public APIs discoverable, avoids long parameter lists, and works well with tree-shaking.

```ts
const foo = Foo.from(x)
const bar = Foo.mutate(foo)
```

- Import internal modules with namespace: `import * as Sidebar from './sidebar.js'`
- Use `.js` extensions for all relative imports (even for `.ts`/`.tsx` files)

### Function Parameters

Use `declare namespace` for function parameter/return types. This keeps all types discoverable from the function symbol (e.g., `from.Options`) and avoids name clashes across modules.

```ts
export function from(options: from.Options): from.ReturnType { ... }
export declare namespace from {
  type Options = { ... }
  type ReturnType = { ... }
}
```

Use this pattern for all exported functions.

### Component Props

Use `declare namespace` for component props. Internal component namespaces can also hold static values (e.g., `Item.className` for shared Tailwind classes).

```ts
export function Callout(props: Callout.Props) { ... }
export declare namespace Callout {
  type Props = { ... }
}
```

### React Conventions

| Convention | Reason |
|------------|--------|
| Server components by default | Stay RSC-friendly, minimize client bundle size |
| `'use client'` directive + `.client.tsx` suffix | Ensures Waku/Vite correctly splits client bundles |
| `.mdx.tsx` suffix for MDX-injected components | Helps MDX tooling discover appropriate components |
| Server/client pairs (e.g., `Foo.tsx` imports `Foo.client.tsx`) | Clean separation of server logic and client interactivity |
| `cx` from `cva` for conditional classNames | Consistent class handling |
| Icons from `~icons/lucide/*` | Unplugin-icons integration |

Hooks live in `src/react/` and follow the same client suffix convention if they use browser APIs.

### Tailwind

- Use `vocs:` prefix for all Tailwind classes (e.g., `vocs:flex`, `vocs:text-heading`). This isolates our design system from user Tailwind config.
- Data attributes for styling states: `data-v-*`, `data-active`, `data-collapsed`
- Tailwind config is in `src/styles/`

### Testing

- Vitest with inline snapshots (`toMatchInlineSnapshot`) — keeps tests and expectations together
- Colocate tests with modules (`foo.test.ts` next to `foo.ts`)
- Import from `.js` extension even in tests
- Prefer unit tests for pure internal modules; integration tests for Vite/Waku behavior

### Formatting (Biome)

- Single quotes, no semicolons
- 100 char line width, space indent
- Imports organized automatically
- Suppress lint rules with `// biome-ignore lint/...: _` (underscore as reason)
- Defer to Biome; don't hand-tune formatting

### Commit Style

Follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

| Type | When to Use |
|------|-------------|
| `feat` | New feature (`MINOR` in SemVer) |
| `fix` | Bug fix (`PATCH` in SemVer) |
| `docs` | Documentation only |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or updating tests |
| `chore` | Maintenance tasks, dependencies |
| `perf` | Performance improvement |
| `build` | Build system or external dependencies |
| `ci` | CI configuration |

- Use lowercase type and description
- Keep the first line under 72 characters
- Use `!` after type/scope for breaking changes: `feat!: remove deprecated API`
- Scope is optional but encouraged for clarity: `fix(sidebar): handle empty items`

### Conventions

- Shared utility types in `internal/types.ts` (`OneOf`, `MaybePartial`, `Compute`, etc.). Promote types here only when reused across multiple modules.
- JSDoc comments on config options and public APIs

## Imports & Module Boundaries

- Use relative paths with `.js` extension for all internal imports (even for `.ts`/`.tsx` files)
- Public entrypoints (`src/index.ts`, `src/config.ts`) re-export; internal code should not import from them
- Do not import from `src/internal/` in userland code; public API goes through `src/index.ts`
- Avoid circular dependencies by respecting layer boundaries: `internal/` → `react/` → `waku/`

## File Naming

| Pattern | Usage |
|---------|-------|
| `foo.ts` | Main module |
| `foo.test.ts` | Colocated test |
| `foo.client.tsx` | Client component with `'use client'` |
| `foo.mdx.tsx` | MDX-injected component |
| `foo-bar.ts` | Kebab-case for multi-word modules |

## Extending MDX / Docs Behavior

1. Add new remark/rehype plugins in `internal/mdx.ts`
2. If user-configurable, wire options into `defineConfig` in `internal/config.ts`
3. Supporting React components go in `src/react/internal/` with `.mdx.tsx` suffix

## Extending Vite Plugins / Virtual Modules

1. Define new plugins in `internal/vite-plugins.ts`
2. Compose them into the array in `src/vite.ts`
3. For runtime data, create `virtual:vocs/xyz` and implement via a Vite plugin

## Waku / RSC Constraints

- Do not access `window`, `document`, or browser-only APIs in server components
- Use client wrappers for browser interactivity
- Server/client pairs: create `Component.tsx` (server) that imports `Component.client.tsx` (client with `'use client'`)

## Error Handling

- Use Vite plugin hooks (`this.error`, `this.warn`) for build-time errors, not `console.error`
- Surface MDX/route/config validation errors with helpful context and file paths
- Throw typed errors with descriptive messages; avoid generic "something went wrong"

## Key Dependencies

| Dependency | Role | Where to Start |
|------------|------|----------------|
| Waku | React Server Components framework | `src/waku/` |
| Shiki | Syntax highlighting | `internal/shiki-transformers.ts`, `internal/mdx.ts` |
| Twoslash | TypeScript code examples with type hints | `internal/twoslash/` |
| Tailwind v4 | Styling | `src/styles/` |
| cva | Class variance authority for conditional styles | React components |
| unplugin-icons | Icon loading (`~icons/lucide/*`) | React components |
| @mdx-js/* | MDX processing | `internal/mdx.ts` |
