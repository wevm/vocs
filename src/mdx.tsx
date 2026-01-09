import type { MDXComponents } from 'mdx/types.js'

import { Callout } from './react/Callout.js'
import { CodeBlock } from './react/internal/CodeBlock.mdx.js'
import { CodeGroup } from './react/internal/CodeGroup.mdx.js'
import { CodeToHtml } from './react/internal/CodeToHtml.js'
import { Steps } from './react/internal/Steps.mdx.js'
import { TwoslashCompletionList } from './react/internal/TwoslashCompletionList.js'
import { TwoslashHover } from './react/internal/TwoslashHover.js'
import { Link } from './react/Link.js'

export const components: MDXComponents = {
  a(props: React.ComponentProps<'a'> & { children: React.ReactNode }) {
    // TODO: slugs (autolink), ids (#)
    // biome-ignore lint/style/noNonNullAssertion: _
    return <Link {...props} to={props.href!} />
  },
  aside(
    props: React.PropsWithChildren<
      React.ComponentProps<'aside'> & { 'data-v-context': Callout.Props['variant'] }
    >,
  ) {
    if ('data-v-callout' in props) return <Callout {...props} variant={props['data-v-context']} />
    return <aside {...props} data-v />
  },
  div(props: React.PropsWithChildren<React.ComponentProps<'div'>>) {
    if ('data-v-code-group' in props) return <CodeGroup {...props} />
    if ('data-v-steps' in props) return <Steps {...props} />
    return <div {...props} />
  },
  code(props: React.PropsWithChildren<React.ComponentProps<'code'>>) {
    return <code {...props} data-v />
  },
  pre(
    props: React.PropsWithChildren<React.ComponentProps<'pre'>> & {
      'data-v-codeToHtml'?: string | undefined
      'data-v-code'?: string | undefined
      'data-v-lang'?: string | undefined
    },
  ) {
    const { 'data-v-codeToHtml': codeToHtml, 'data-v-code': code, 'data-v-lang': lang } = props
    if (codeToHtml && code && lang) return <CodeToHtml code={code} lang={lang} />
    return <CodeBlock {...props} />
  },
  span(props: React.PropsWithChildren<React.ComponentProps<'span'>>) {
    if (props.className?.includes('twoslash-completion-cursor'))
      return <TwoslashCompletionList {...props} />
    if (props.className?.includes('twoslash-hover')) return <TwoslashHover {...props} />
    return <span {...props} />
  },
  table(props: React.PropsWithChildren<React.ComponentProps<'table'>>) {
    return (
      <div data-v-table-wrapper>
        <table {...props} />
      </div>
    )
  },
}

export function useMDXComponents(existing?: MDXComponents): MDXComponents {
  return { ...components, ...existing }
}
