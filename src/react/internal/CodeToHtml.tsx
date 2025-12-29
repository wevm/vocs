import { config } from 'virtual:vocs/config'
import {
  bundledLanguages,
  createHighlighter,
  makeSingletonHighlighter,
  type ShikiTransformer,
} from 'shiki/bundle/web'

const getHighlighter = makeSingletonHighlighter(createHighlighter)

export async function CodeToHtml(props: CodeToHtml.Props) {
  const { code, lang } = props
  const { codeHighlight } = config
  const { langAlias = {}, themes } = codeHighlight

  const highlighter = await getHighlighter({
    themes: Object.values(themes) as never,
    langs: Object.keys(bundledLanguages) as never,
    langAlias,
  })

  const html = highlighter.codeToHtml(code, {
    defaultColor: 'light-dark()',
    lang,
    rootStyle: false,
    themes,
    transformers: [transformerShrinkIndent()],
  })

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
