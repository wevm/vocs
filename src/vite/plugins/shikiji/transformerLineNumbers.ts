import type { ShikijiTransformer } from 'shikiji'

export const transformerLineNumbers = (): ShikijiTransformer => ({
  name: 'line-numbers',
  code(hast) {
    if (!this.options.meta?.__raw?.includes('showLineNumbers')) return
    hast.properties['data-line-numbers'] = true
  },
})
