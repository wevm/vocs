import type { ShikijiTransformer } from 'shikiji'

export const transformerSplitIdentifiers = (): ShikijiTransformer => ({
  name: 'split-identifiers',
  token(hast) {
    const child = hast.children[0]
    if (child.type !== 'text') return
    if (child.value.trim().length === 0) return
    if (child.value.match(/\/\/ \[!/)) return

    let identifier = false
    let item = ''
    const items = []

    for (const char of child.value) {
      if (char.match(/\w/)) {
        if (!identifier) {
          items.push(item)
          item = ''
        }
        identifier = true
        item += char
      } else if (char.match(/\W/)) {
        if (identifier) {
          items.push(item)
          item = ''
        }
        identifier = false
        item += char
      }
    }

    if (item) items.push(item)

    hast.children = items.map((item) => ({ type: 'text', value: item }))
  },
})
