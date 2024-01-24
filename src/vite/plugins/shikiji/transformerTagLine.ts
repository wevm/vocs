import type { ShikijiTransformer } from 'shikiji'

export const transformerTagLine = (): ShikijiTransformer => ({
  name: 'tag-line',
  root(hast) {
    const lines = (hast.children[0] as any)?.children[0]?.children
    if (!lines) return

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line.properties?.class.includes('twoslash-tag-line')) {
        lines.splice(i - 1, 0, line)
        lines.splice(i + 1, 1)
        if (i + 1 === lines.length) lines.splice(i, 1)
      }
    }
  },
})
