// @ts-expect-error
import * as postcssPrefixSelector from 'postcss-prefix-selector'

export function postcssRawStyles() {
  // @ts-expect-error
  return postcssPrefixSelector.default({
    prefix: ':not([data-vocs-raw])',
    includeFiles: [/elements\.css/, /layouts\.css/],
    transform(prefix: string, selector_: string) {
      const [selector, pseudo = ''] = selector_.split(/(:\S*)$/)
      return selector + prefix + pseudo
    },
  })
}
