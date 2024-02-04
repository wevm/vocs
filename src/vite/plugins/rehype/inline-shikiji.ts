import type { Root } from 'hast'
import type { RehypeShikijiCoreOptions } from 'rehype-shikiji/core'
import type { BuiltinLanguage, BuiltinTheme, Highlighter } from 'shikiji'
import { bundledLanguages, getHighlighter } from 'shikiji'
import type { LanguageInput } from 'shikiji/core'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'

const inlineShikijiRegex = /(.*){:(.*)}$/

export type RehypeInlineShikijiOptions = RehypeShikijiCoreOptions & {
  /**
   * Language names to include.
   *
   * @default Object.keys(bundledLanguages)
   */
  langs?: Array<LanguageInput | BuiltinLanguage>
}

export const rehypeInlineShikiji: Plugin<[RehypeInlineShikijiOptions], Root> = function (
  options = {} as any,
) {
  const themeNames = ('themes' in options ? Object.values(options.themes) : [options.theme]).filter(
    Boolean,
  ) as BuiltinTheme[]
  const langs = options.langs || Object.keys(bundledLanguages)

  const promise = getHighlighter({
    themes: themeNames,
    langs,
  })

  return async function (tree) {
    const highlighter = (await promise) as Highlighter
    return visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'code') return

      const match = (node.children[0] as any)?.value?.match(inlineShikijiRegex)
      if (!match) return

      const [, code, lang] = match
      const hast = highlighter.codeToHast(code, { ...options, lang })

      const inlineCode = (hast.children[0] as any).children[0]
      if (!inlineCode) return

      parent?.children.splice(index ?? 0, 1, inlineCode)
    })
  }
}
