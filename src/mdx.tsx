import type { MDXComponents } from 'mdx/types.js'

import { Callout } from './react/Callout.js'
import { CodeGroup } from './react/internal/CodeGroup.js'
import { CodeToHtml } from './react/internal/CodeToHtml.js'
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
      React.ComponentProps<'aside'> & { 'data-context': Callout.Props['variant'] }
    >,
  ) {
    if ('data-callout' in props) return <Callout {...props} variant={props['data-context']} />
    return <aside data-md {...props} />
  },
  div(props: React.PropsWithChildren<React.ComponentProps<'div'>>) {
    if ('data-code-group' in props) return <CodeGroup {...props} />
    return <div {...props} />
  },
  code(props: React.PropsWithChildren<React.ComponentProps<'code'>>) {
    return <code {...props} data-md />
  },
  pre(
    props: React.PropsWithChildren<React.ComponentProps<'pre'>> & {
      'data-code'?: string | undefined
      'data-lang'?: string | undefined
    },
  ) {
    const { 'data-code': code, 'data-lang': lang } = props
    if (code && lang) return <CodeToHtml code={code} lang={lang} />
    return <pre {...props} data-md />
  },
  span(props: React.PropsWithChildren<React.ComponentProps<'span'>>) {
    if (props.className?.includes('twoslash-completion-cursor'))
      return <TwoslashCompletionList {...props} />
    if (props.className?.includes('twoslash-hover')) {
      return <TwoslashHover {...props} />
    }
    return <span {...props} />
  },
}
