import type { ShikiTransformer } from 'shiki'

export const transformerLineNumbers = (): ShikiTransformer => ({
  name: 'line-numbers',
  code(hast) {
    if (!this.options.meta?.__raw?.includes('showLineNumbers')) return
    hast.properties['data-line-numbers'] = true
  },
})
