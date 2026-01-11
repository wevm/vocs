import { createHighlighter, makeSingletonHighlighter, type ShikiTransformer } from 'shiki'

export const getHighlighter = makeSingletonHighlighter(createHighlighter)

export function transformerShrinkIndent(): ShikiTransformer {
  return {
    name: 'indent',
    span(hast) {
      const child = hast.children[0]
      if (!child) return
      if (child.type !== 'text') return
      if (!child.value) return
      hast.children[0] = { type: 'text', value: child.value.replace(/\s\s/g, ' ') }
    },
  }
}
