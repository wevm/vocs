/**
 * Highlights code blocks for the render route. Shiki tokenizes with its JavaScript regex engine,
 * so no WebAssembly loads, and token colors read public `--vocs-code-*` properties. A Twoslash
 * block also type-checks against the type snapshot and shows types on hover. TypeScript loads on
 * the first Twoslash block. The handler imports this module on the first render.
 * @module
 */
import type { TwoslashInstance } from 'twoslash/core'
import { createCssVariablesTheme, createHighlighterCore, type ShikiTransformer } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import type TypeScript from 'typescript-api'
import type * as Config from '../Config.js'
import type * as Types from './Types.js'

/** A code highlighter, created once per handler. */
export type Highlighter = {
  /**
   * Returns the HTML inside `<code>`: one `span.line` per line.
   *
   * @throws {Highlight.TypeCheckError} When a Twoslash snippet does not type-check.
   * @throws {Highlight.UnsupportedError} When Twoslash is off for the site or the language.
   */
  render(snippet: Snippet): Promise<string>
}

/** Key of the type snapshot loader on a config served by `virtual:vocs/config`. */
export const typesKey = Symbol.for('vocs.types')

/** Returns the type snapshot loader that the `vocs()` plugin attaches when Twoslash is on. */
export function types(config: Config.Config): (() => Promise<Types.Snapshot>) | undefined {
  return (config as Config.Config & { [typesKey]?: () => Promise<Types.Snapshot> })[typesKey]
}

/** Source code to highlight. */
export type Snippet = {
  code: string
  /** Language, such as `ts`. An unknown language renders as plain text. */
  lang: string
  /** Type-checks a `ts` or `tsx` snippet and adds type information. */
  twoslash?: boolean | undefined
}

/**
 * Default values of the token color properties. The defaults are monochrome: shades of the text
 * color, so they follow light and dark schemes.
 */
export const tokens = {
  background: 'transparent',
  foreground: 'currentColor',
  'token-comment': 'color-mix(in srgb, currentColor 50%, transparent)',
  'token-constant': 'currentColor',
  'token-function': 'currentColor',
  'token-keyword': 'color-mix(in srgb, currentColor 70%, transparent)',
  'token-link': 'currentColor',
  'token-parameter': 'currentColor',
  'token-punctuation': 'color-mix(in srgb, currentColor 60%, transparent)',
  'token-string': 'color-mix(in srgb, currentColor 80%, transparent)',
  'token-string-expression': 'color-mix(in srgb, currentColor 80%, transparent)',
} as const

/**
 * Returns the compiler options of every Twoslash program. The type snapshot holds the lib files
 * they name.
 */
export function compilerOptions(ts: typeof TypeScript) {
  return {
    lib: ['lib.esnext.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    strict: true,
    target: ts.ScriptTarget.ESNext,
  } satisfies TypeScript.CompilerOptions
}

/** Grammars by language name and alias. Each loads on its first use. */
const languages = {
  bash: () => import('shiki/langs/shellscript.mjs'),
  css: () => import('shiki/langs/css.mjs'),
  diff: () => import('shiki/langs/diff.mjs'),
  go: () => import('shiki/langs/go.mjs'),
  graphql: () => import('shiki/langs/graphql.mjs'),
  html: () => import('shiki/langs/html.mjs'),
  javascript: () => import('shiki/langs/javascript.mjs'),
  js: () => import('shiki/langs/javascript.mjs'),
  json: () => import('shiki/langs/json.mjs'),
  jsonc: () => import('shiki/langs/jsonc.mjs'),
  jsx: () => import('shiki/langs/jsx.mjs'),
  py: () => import('shiki/langs/python.mjs'),
  python: () => import('shiki/langs/python.mjs'),
  rs: () => import('shiki/langs/rust.mjs'),
  rust: () => import('shiki/langs/rust.mjs'),
  sh: () => import('shiki/langs/shellscript.mjs'),
  shell: () => import('shiki/langs/shellscript.mjs'),
  sol: () => import('shiki/langs/solidity.mjs'),
  solidity: () => import('shiki/langs/solidity.mjs'),
  sql: () => import('shiki/langs/sql.mjs'),
  toml: () => import('shiki/langs/toml.mjs'),
  ts: () => import('shiki/langs/typescript.mjs'),
  tsx: () => import('shiki/langs/tsx.mjs'),
  typescript: () => import('shiki/langs/typescript.mjs'),
  yaml: () => import('shiki/langs/yaml.mjs'),
  yml: () => import('shiki/langs/yaml.mjs'),
  zsh: () => import('shiki/langs/shellscript.mjs'),
} as const

const theme = createCssVariablesTheme({
  name: 'vocs',
  variableDefaults: tokens,
  variablePrefix: '--vocs-code-',
})

/**
 * Keeps the children of `<code>`, so the block component owns `<pre>` and `<code>`. Drops the
 * empty last line that a Twoslash query at the end of a snippet leaves.
 */
const inner: ShikiTransformer = {
  root(root) {
    const pre = root.children[0]
    const code = pre?.type === 'element' ? pre.children[0] : undefined
    if (code?.type !== 'element') return root
    const children = [...code.children]
    for (;;) {
      const last = children.at(-1)
      if (last?.type !== 'element' || last.tagName !== 'span' || last.children.length > 0) break
      children.pop()
      if (children.at(-1)?.type === 'text') children.pop()
    }
    return { children, type: 'root' }
  },
}

/** Creates a highlighter. Shiki loads on the first render, and TypeScript on the first Twoslash snippet. */
export function create(options: create.Options = {}): Highlighter {
  let shiki: ReturnType<typeof createHighlighterCore> | undefined
  let twoslash: Promise<ShikiTransformer> | undefined

  return {
    async render(snippet) {
      const name = Object.hasOwn(languages, snippet.lang)
        ? (snippet.lang as keyof typeof languages)
        : undefined
      if (snippet.twoslash && name !== 'ts' && name !== 'tsx' && name !== 'typescript')
        throw new UnsupportedError(
          `Twoslash checks only \`ts\` and \`tsx\` blocks, not \`${snippet.lang}\`. Remove \`twoslash\`, or change the language.`,
        )
      const types = options.types
      if (snippet.twoslash && !types)
        throw new UnsupportedError(
          'Twoslash is off for this site. Emit the block without `twoslash`.',
        )

      shiki ??= createHighlighterCore({ engine: createJavaScriptRegexEngine(), themes: [theme] })
      const highlighter = await shiki.catch((error: unknown) => {
        shiki = undefined
        throw error
      })
      if (name && !highlighter.getLoadedLanguages().includes(name))
        await highlighter.loadLanguage(languages[name]())

      const transformers = [inner]
      if (snippet.twoslash && types) {
        twoslash ??= transformer(types)
        transformers.unshift(
          await twoslash.catch((error: unknown) => {
            twoslash = undefined
            throw error
          }),
        )
      }

      return highlighter.codeToHtml(snippet.code.replace(/\n$/, ''), {
        lang: name ?? 'text',
        theme: 'vocs',
        transformers,
      })
    },
  }
}

export declare namespace create {
  type Options = {
    /** Loads the type snapshot. Without it, Twoslash snippets are rejected. */
    types?: (() => Promise<Types.Snapshot>) | undefined
  }
}

/** Thrown when a Twoslash snippet has a type error that it does not mark as expected. */
export class TypeCheckError extends Error {
  override name = 'Highlight.TypeCheckError'
  constructor(cause: unknown) {
    super(
      `The code does not type-check. Fix it, or mark an expected error with \`// @errors: <code>\`.\n${(cause instanceof Error ? cause.message : String(cause)).trim()}`,
      { cause },
    )
  }
}

/** Thrown when a snippet asks for Twoslash where it does not run. */
export class UnsupportedError extends Error {
  override name = 'Highlight.UnsupportedError'
}

/** Loads TypeScript, Twoslash, and the type snapshot, and returns the Twoslash transformer. */
async function transformer(types: () => Promise<Types.Snapshot>): Promise<ShikiTransformer> {
  const [{ createTransformerFactory, rendererRich }, { createTwoslasher }, ts, snapshot] =
    await Promise.all([
      import('@shikijs/twoslash/core'),
      import('twoslash/core'),
      import('typescript-api').then((module) => module.default),
      types(),
    ])
  const twoslasher: TwoslashInstance = createTwoslasher({
    compilerOptions: compilerOptions(ts),
    fsMap: new Map(Object.entries(snapshot.files)),
    // Twoslash types `tsModule` with its `typescript` peer, which can resolve to TypeScript 7.
    tsModule: ts as never,
    vfsRoot: '/',
  })
  const part = (name: string) => ({ properties: { 'data-vocs-part': name } })
  return createTransformerFactory(twoslasher)({
    renderer: rendererRich({
      errorRendering: 'line',
      hast: {
        hoverPopup: part('popup'),
        hoverToken: part('hover'),
        popupDocs: part('docs'),
        popupDocsTags: part('tags'),
        popupError: part('error'),
        popupTypes: part('types'),
        queryPopup: part('query'),
      },
      queryRendering: 'line',
    }),
    onTwoslashError(error) {
      throw new TypeCheckError(error)
    },
  })
}
