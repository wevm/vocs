import {
  codeToTokens,
  type Lang as HighlightsLang,
  isSupportedLanguage,
  type Theme,
} from '@pierre/highlights'
import * as themes from '@pierre/highlights/themes'
import type {
  CodeToHastOptions,
  CodeToTokensOptions,
  HighlighterGeneric,
  ShikiTransformerContextCommon,
} from 'shiki'
import { isSpecialLang, tokensToHast, transformerDecorations } from 'shiki/core'

const bundledThemes = new Map(
  Object.entries(themes)
    .filter((entry): entry is [string, Theme] => typeof entry[1] === 'object')
    .map(([name, theme]) => [name.toLowerCase(), theme]),
)

/** Adds Highlights tokenization while retaining Shiki's HAST renderer and transformers. */
export function from<Lang extends string, ThemeName extends string>(
  shiki: HighlighterGeneric<Lang, ThemeName>,
  options: from.Options = {},
): HighlighterGeneric<Lang, ThemeName> {
  const highlighter: HighlighterGeneric<Lang, ThemeName> = {
    ...shiki,
    // Rehype lazily loads aliases too; singleton Shiki instances do not register
    // aliases added by later configurations, so resolve them before loading.
    loadLanguage(...languages) {
      return shiki.loadLanguage(
        ...languages
          .map((lang) =>
            typeof lang === 'string' ? ((options.langAlias?.[lang] ?? lang) as Lang) : lang,
          )
          .filter(
            (lang) =>
              typeof lang !== 'string' ||
              !options.codeOptions ||
              !supports({ ...options.codeOptions, lang }, options),
          ),
      )
    },
    codeToTokens(code, codeOptions) {
      return tokenize(code, codeOptions, shiki as render.Fallback, options)
    },
    codeToHast(code, codeOptions) {
      return render(code, codeOptions, shiki as render.Fallback, options)
    },
  }
  return highlighter
}

export declare namespace from {
  type Options = {
    /** Shared render options used to skip loading grammars handled by Highlights. */
    codeOptions?: Partial<CodeToHastOptions> | undefined
    customLanguages?: string[] | undefined
    unresolvedGrammars?: boolean | undefined
    langAlias?: Record<string, string> | undefined
  }
}

function order(enforce: 'pre' | 'post' | undefined) {
  return enforce === 'pre' ? -1 : enforce === 'post' ? 1 : 0
}

/** Whether a render can use Highlights without a TextMate grammar. */
export function supports(codeOptions: Partial<CodeToHastOptions>, options: from.Options = {}) {
  const lang = options.langAlias?.[codeOptions.lang ?? ''] ?? codeOptions.lang ?? ''
  return (
    isSupportedLanguage(lang) &&
    !isSpecialLang(lang) &&
    !options.customLanguages?.includes(lang) &&
    !options.unresolvedGrammars &&
    !codeOptions.colorReplacements &&
    !codeOptions.grammarState &&
    !codeOptions.grammarContextCode &&
    !codeOptions.includeExplanation &&
    codeOptions.tokenizeTimeLimit === undefined &&
    !!selectThemes(codeOptions)
  )
}

function selectThemes(options: Partial<CodeToHastOptions>): Record<string, Theme> | undefined {
  if (!('themes' in options)) return
  const selected: Record<string, Theme> = {}
  for (const [key, theme] of Object.entries(options.themes ?? {})) {
    const value =
      typeof theme === 'string'
        ? bundledThemes.get(theme.replaceAll('-', '').toLowerCase())
        : undefined
    if (!value) return
    selected[key] = value
  }
  return Object.keys(selected).length ? selected : undefined
}

/** Renders supported tokens without initializing a Shiki grammar engine. */
export function render(
  code: string,
  codeOptions: CodeToHastOptions,
  fallback: render.Fallback = unavailable,
  adapterOptions: from.Options = {},
) {
  const lang = adapterOptions.langAlias?.[codeOptions.lang] ?? codeOptions.lang
  codeOptions = { ...codeOptions, lang }
  if (!('themes' in codeOptions) || !supports(codeOptions, adapterOptions))
    return fallback.codeToHast(code, codeOptions)

  const transformers = [...(codeOptions.transformers ?? [])].sort(
    (a, b) => order(a.enforce) - order(b.enforce),
  )
  const context: ShikiTransformerContextCommon = {
    meta: {},
    options: codeOptions,
    codeToHast: (source, options) => render(source, options, fallback, adapterOptions),
    codeToTokens: (source, options) => tokenize(source, options, fallback, adapterOptions),
  }
  let source = code
  for (const transformer of transformers)
    source = transformer.preprocess?.call(context, source, codeOptions) || source
  // Twoslash can change the language (e.g. @filename: example.tsx).
  const result = tokenize(source, codeOptions, fallback, adapterOptions)
  const sourceContext = { ...context, source }
  let tokens = result.tokens
  for (const transformer of transformers)
    tokens = transformer.tokens?.call(sourceContext, tokens) || tokens
  // Shiki's renderer applies decorations, but their boundaries must first
  // split Highlights tokens at the same UTF-16 offsets as Shiki tokens.
  if (codeOptions.decorations?.length)
    tokens = transformerDecorations().tokens?.call(sourceContext, tokens) || tokens
  return tokensToHast(
    tokens,
    {
      ...codeOptions,
      ...result,
      // Preserve selectors and theme classes used by Vocs and consumers.
      themeName: `shiki-themes ${Object.values(codeOptions.themes ?? {}).join(' ')}`,
      rootStyle:
        codeOptions.rootStyle === false
          ? false
          : (codeOptions.rootStyle ?? result.rootStyle ?? false),
    },
    sourceContext,
  )
}

export declare namespace render {
  type Fallback = Pick<ShikiTransformerContextCommon, 'codeToHast' | 'codeToTokens'>
}

function tokenize(
  code: string,
  codeOptions: CodeToTokensOptions,
  fallback: render.Fallback,
  options: from.Options,
) {
  const lang = options.langAlias?.[codeOptions.lang ?? 'text'] ?? codeOptions.lang ?? 'text'
  const resolved = { ...codeOptions, lang }
  const selectedThemes = selectThemes(resolved)
  if (!('themes' in resolved) || !selectedThemes || !supports(resolved, options))
    return fallback.codeToTokens(code, resolved)
  return codeToTokens(code, {
    lang: lang as HighlightsLang,
    themes: selectedThemes,
    ...(resolved.defaultColor === undefined ? {} : { defaultColor: resolved.defaultColor }),
    cssVariablePrefix: resolved.cssVariablePrefix ?? '--shiki-',
    ...(resolved.tokenizeMaxLineLength === undefined
      ? {}
      : { tokenizeMaxLineLength: resolved.tokenizeMaxLineLength }),
  })
}

const unavailable: render.Fallback = {
  codeToHast() {
    throw new Error('A Shiki fallback is required for these highlighting options')
  },
  codeToTokens() {
    throw new Error('A Shiki fallback is required for these highlighting options')
  },
}
