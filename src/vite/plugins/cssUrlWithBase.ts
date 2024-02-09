import { resolve } from 'node:path'
import { fileURLToPath } from 'url'
import type { AcceptedPlugin } from 'postcss'
import type { ParsedConfig } from '../../config.js'

export const postcssPluginCssUrlRewrite = (config: ParsedConfig): AcceptedPlugin => {
  const { baseUrl } = config
  const cssUrlRE = /(?<=^|[^\w\-\u0080-\uffff])url\(['"]?(\s*('[^']+'|"[^"]+")\s*|[^'")]+)['"]?\)/g
  const __dirname = fileURLToPath(import.meta.url)
  const fileLinkPrefix = resolve(__dirname, '../../../app/')
  return {
    postcssPlugin: 'postcss-rewrite-url-in-app',
    Root(root) {
      if (root.source?.input.file?.includes(fileLinkPrefix)) {
        const css = root.source?.input.css
        if (css.includes('url(')) {
          root.walkDecls((decl) => {
            const ruleValue = decl.value
            if (typeof ruleValue === 'string' && ruleValue.includes('url(')) {
              if (ruleValue.match(/url\(['"]?data:/)) {
                return
              }
              decl.value = ruleValue.replace(cssUrlRE, (a, b) => {
                let replaceUrl = b
                const cssUrlFirstWords = b.split('/')[0]
                if (!/^(?:[^.]|\.+)$/.test(cssUrlFirstWords)) {
                  replaceUrl = `${baseUrl}${replaceUrl.replace(/^\/*/, '/')}`
                  return a.replace(b, replaceUrl)
                }
                return a
              })
            }
          })
        }
      }
    },
  }
}

postcssPluginCssUrlRewrite.postcss = true
