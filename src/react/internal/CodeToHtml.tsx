import { config } from 'virtual:vocs/config'
import { bundledLanguages, hastToHtml } from 'shiki/bundle/web'
import { getHighlighter, transformerShrinkIndent } from '../../internal/shiki.js'

export async function CodeToHtml(props: CodeToHtml.Props) {
  const { code, lang } = props
  const { codeHighlight } = config
  const { langAlias = {}, themes } = codeHighlight

  const highlighter = await getHighlighter({
    themes: import.meta.env.DEV ? ['none'] : (Object.values(themes) as never),
    langs: import.meta.env.DEV ? ['txt'] : (Object.keys(bundledLanguages) as never),
    langAlias,
  })

  await Promise.all([
    await highlighter.loadTheme('github-dark-dimmed'),
    await highlighter.loadTheme('github-light'),
    await highlighter.loadLanguage(lang as never),
  ])

  const hast = highlighter.codeToHast(code, {
    defaultColor: 'light-dark()',
    lang,
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
