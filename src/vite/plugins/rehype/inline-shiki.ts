import type { RehypeShikiCoreOptions } from '@shikijs/rehype/core'
import type { Root } from 'hast'
import type { BuiltinLanguage, BuiltinTheme, Highlighter } from 'shiki'
import { bundledLanguages, getHighlighter } from 'shiki'
import type { LanguageInput } from 'shiki/core'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'

const inlineShikiRegex = /(.*){:(.*)}$/

export type RehypeInlineShikiOptions = RehypeShikiCoreOptions & {
  /**
   * Language names to include.
   *
   * @default Object.keys(bundledLanguages)
   */
  langs?: Array<LanguageInput | BuiltinLanguage>
}

export const rehypeInlineShiki: Plugin<[RehypeInlineShikiOptions], Root> = function (
  options = {} as any,
) {
  const themeNames = ('themes' in options ? Object.values(options.themes) : [options.theme]).filter(
    Boolean,
  ) as BuiltinTheme[]
  const langs = options.langs || Object.keys(bundledLanguages)

  let promise: Promise<Highlighter>

  return async function (tree) {
    if (!promise)
      promise = getHighlighter({
        themes: themeNames,
        langs,
      })
    const highlighter = await promise
    return visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'code') return

      const match = (node.children[0] as any)?.value?.match(inlineShikiRegex)
      if (!match) return

      const [, code, lang] = match
      const hast = highlighter.codeToHast(code, { ...options, lang })

      const inlineCode = (hast.children[0] as any).children[0]
      if (!inlineCode) return

      parent?.children.splice(index ?? 0, 1, inlineCode)
    })
  }
}
