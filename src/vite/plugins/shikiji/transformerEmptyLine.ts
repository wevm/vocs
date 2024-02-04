import type { ShikijiTransformer } from 'shikiji'

export const transformerEmptyLine = (): ShikijiTransformer => ({
  name: 'empty-line',
  line(hast) {
    const child = hast.children[0]
    if (child) return
    hast.properties['data-empty-line'] = true
    hast.children = [
      {
        type: 'text',
        value: ' ',
      },
    ]
  },
})
