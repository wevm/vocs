import type { ShikijiTransformer } from 'shikiji'

export const transformerShrinkIndent = (): ShikijiTransformer => ({
  name: 'indent',
  token(hast, _, __, lineElement) {
    const child = hast.children[0]
    if (child.type !== 'text') return
    if (!child.value) return
    if (child.value.trim().length !== 0) return
    if (lineElement.children.length !== 0) return
    hast.children[0] = { type: 'text', value: child.value.replace(/\s\s/g, ' ') }
  },
})
