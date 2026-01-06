import { config } from 'virtual:vocs/config'
import { langs as virtualLangs } from 'virtual:vocs/langs'
import {
  bundledLanguages,
  createHighlighter,
  hastToHtml,
  makeSingletonHighlighter,
  type ShikiTransformer,
} from 'shiki/bundle/web'

const getHighlighter = makeSingletonHighlighter(createHighlighter)

export async function CodeToHtml(props: CodeToHtml.Props) {
  const { code, lang } = props
  const { codeHighlight } = config
  const { langAlias = {}, themes } = codeHighlight

  const highlighter = await getHighlighter({
    themes: import.meta.env.DEV ? ['none'] : (Object.values(themes) as never),
    langs: import.meta.env.DEV
      ? ['txt']
      : ([...Object.keys(bundledLanguages), ...virtualLangs] as never),
    langAlias,
  })

  const loadedLangs = highlighter.getLoadedLanguages()
  const resolvedLang = loadedLangs.includes(lang) ? lang : 'txt'

  const hast = highlighter.codeToHast(code, {
    defaultColor: 'light-dark()',
    lang: import.meta.env.DEV ? 'txt' : resolvedLang,
    rootStyle: false,
    meta: {
      'data-v-overflow-fade': true,
    },
    themes,
    ...(import.meta.env.DEV ? { theme: 'none' } : { themes }),
    transformers: [transformerShrinkIndent()],
  })

  // Add data-v attribute and overflow sentinel to pre
  const pre = hast.children[0]
  if (pre && pre.type === 'element' && pre.tagName === 'pre') {
    pre.properties = { ...pre.properties, 'data-v': '' }
    pre.children.push({
      type: 'element',
      tagName: 'div',
      properties: { 'data-v-overflow-sentinel': true },
      children: [],
    })
  }

  const html = hastToHtml(hast)

  // biome-ignore lint/security/noDangerouslySetInnerHtml: _
  return <div dangerouslySetInnerHTML={{ __html: html }} />
}

export namespace CodeToHtml {
  export type Props = {
    code: string
    lang: string
  }
}
