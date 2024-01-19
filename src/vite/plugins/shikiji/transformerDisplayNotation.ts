import type { ShikijiTransformer } from 'shikiji'

export const transformerDisplayNotation = (): ShikijiTransformer => ({
  name: 'display-notation',
  postprocess(html) {
    return html.replaceAll(/\/\/\$ \[(.*)\]/g, '// [$1]')
  },
})
