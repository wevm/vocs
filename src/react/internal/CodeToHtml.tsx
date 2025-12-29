import { config } from 'virtual:vocs/config'
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
    langs: import.meta.env.DEV ? ['txt'] : (Object.keys(bundledLanguages) as never),
    langAlias,
  })

  const hast = highlighter.codeToHast(code, {
    defaultColor: 'light-dark()',
    lang: import.meta.env.DEV ? 'txt' : lang,
    rootStyle: false,
    meta: {
      'data-overflow-fade': true,
    },
    ...(import.meta.env.DEV ? { theme: 'none' } : { themes }),
    transformers: [transformerShrinkIndent()],
  })

  // Add overflow sentinel
  const pre = hast.children[0]
  if (pre && pre.type === 'element' && pre.tagName === 'pre')
    pre.children.push({
      type: 'element',
      tagName: 'div',
      properties: { 'data-overflow-sentinel': true },
      children: [],
    })

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

function transformerShrinkIndent(): ShikiTransformer {
  return {
    name: 'indent',
    span(hast) {
      const child = hast.children[0]
      if (!child) return
      if (child.type !== 'text') return
      if (!child.value) return
      hast.children[0] = { type: 'text', value: child.value.replace(/\s\s/g, ' ') }
    },
  }
}
