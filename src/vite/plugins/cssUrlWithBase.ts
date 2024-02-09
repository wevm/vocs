import path from 'path'
import { fileURLToPath } from 'url'
import type { AcceptedPlugin } from 'postcss'

const cssUrlRE = /(?<=^|[^\w\-\u0080-\uffff])url\(['"]?(\s*('[^']+'|"[^"]+")\s*|[^'")]+)['"]?\)/g

const __dirname = fileURLToPath(import.meta.url)

const fileLinkPrefix = path.resolve(__dirname, '../../../app/')

export const postcssPluginCssUrlRewrite = (config: any): AcceptedPlugin => {
  const { baseUrl } = config
  return {
    postcssPlugin: 'postcss-rewrite-url-in-app',
    Root(root) {
      console.log('root', root.source?.input.file)
      if (root.source?.input.file?.includes(fileLinkPrefix)) {
        const css = root.source?.input.css
        if (css.includes('url(')) {
          root.walkDecls((decl) => {
            const ruleValue = decl.value

            if (typeof ruleValue === 'string' && ruleValue.includes('url(')) {
              if (ruleValue.match(/url\(['"]?data:/)) {
                return
              }
              decl.value = ruleValue.replaceAll(cssUrlRE, (a, b) => {
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
