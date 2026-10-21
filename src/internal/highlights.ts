import { codeToTokens, isSupportedLanguage, type Theme } from '@pierre/highlights'
import * as themes from '@pierre/highlights/themes'
import type { HighlighterGeneric, ShikiTransformerContextCommon } from 'shiki'
import { isSpecialLang, tokensToHast } from 'shiki/core'

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
        ...languages.map((lang) =>
          typeof lang === 'string' ? ((options.langAlias?.[lang] ?? lang) as Lang) : lang,
        ),
      )
    },
    codeToHast(code, codeOptions) {
      const lang = options.langAlias?.[codeOptions.lang] ?? codeOptions.lang
      codeOptions = { ...codeOptions, lang }
      if (!('themes' in codeOptions)) return shiki.codeToHast(code, codeOptions)
      const selectedThemes: Record<string, Theme> = {}
      for (const [key, theme] of Object.entries(codeOptions.themes ?? {})) {
        const selected =
          typeof theme === 'string'
            ? bundledThemes.get(theme.replaceAll('-', '').toLowerCase())
            : undefined
        if (!selected) return shiki.codeToHast(code, codeOptions)
        selectedThemes[key] = selected
      }
      // TextMate grammars and Twoslash can depend on scopes or grammar state.
      // Keep those blocks, special languages, and advanced token options on Shiki.
      if (
        !isSupportedLanguage(lang) ||
        isSpecialLang(lang) ||
        options.customLanguages?.includes(lang) ||
        /\btwoslash\b/.test(codeOptions.meta?.__raw ?? '') ||
        !Object.keys(selectedThemes).length ||
        codeOptions.decorations ||
        codeOptions.colorReplacements ||
        codeOptions.grammarState ||
        codeOptions.grammarContextCode ||
        codeOptions.includeExplanation ||
        codeOptions.tokenizeTimeLimit !== undefined ||
        options.unresolvedGrammars
      )
        return shiki.codeToHast(code, codeOptions)

      const transformers = [...(codeOptions.transformers ?? [])].sort(
        (a, b) => order(a.enforce) - order(b.enforce),
      )
      const context: ShikiTransformerContextCommon = {
        meta: {},
        options: codeOptions,
        codeToHast: highlighter.codeToHast,
        codeToTokens: shiki.codeToTokens as ShikiTransformerContextCommon['codeToTokens'],
      }
      let source = code
      for (const transformer of transformers)
        source = transformer.preprocess?.call(context, source, codeOptions) || source
      const result = codeToTokens(source, {
        lang,
        themes: selectedThemes,
        ...(codeOptions.defaultColor === undefined
          ? {}
          : { defaultColor: codeOptions.defaultColor }),
        cssVariablePrefix: codeOptions.cssVariablePrefix ?? '--shiki-',
        ...(codeOptions.tokenizeMaxLineLength === undefined
          ? {}
          : { tokenizeMaxLineLength: codeOptions.tokenizeMaxLineLength }),
      })
      const sourceContext = { ...context, source }
      let tokens = result.tokens
      for (const transformer of transformers)
        tokens = transformer.tokens?.call(sourceContext, tokens) || tokens
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
    },
  }
  return highlighter
}

export declare namespace from {
  type Options = {
    customLanguages?: string[] | undefined
    unresolvedGrammars?: boolean | undefined
    langAlias?: Record<string, string> | undefined
  }
}

function order(enforce: 'pre' | 'post' | undefined) {
  return enforce === 'pre' ? -1 : enforce === 'post' ? 1 : 0
}
