import { default as postcssPrefixSelector } from 'postcss-prefix-selector'

export function postcssRawStyles() {
  return postcssPrefixSelector({
    prefix: ':not([data-vocs-raw])',
    includeFiles: [/elements\.css/, /layouts\.css/],
    transform(prefix: string, selector_: string) {
      const [selector, pseudo = ''] = selector_.split(/(:\S*)$/)
      return selector + prefix + pseudo
    },
  })
}
