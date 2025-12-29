import type { MDXComponents } from 'mdx/types.js'

import { Callout } from './react/Callout.js'
import { CodeToHtml } from './react/internal/CodeToHtml.js'
import { TwoslashCompletionList } from './react/internal/TwoslashCompletionList.js'
import { TwoslashHover } from './react/internal/TwoslashHover.js'
import { Link } from './react/Link.js'

export const components: MDXComponents = {
  a(props: React.ComponentProps<'a'> & { children: React.ReactNode }) {
    // TODO: slugs (autolink), ids (#)
    return <Link {...props} />
  },
  aside(
    props: React.PropsWithChildren<
      React.ComponentProps<'aside'> & { 'data-context': Callout.Props['variant'] }
    >,
  ) {
    if ('data-callout' in props) return <Callout {...props} variant={props['data-context']} />
    return <aside data-md {...props} />
  },
  code(props: React.PropsWithChildren<React.ComponentProps<'code'>>) {
    if ('data-code' in props && 'data-lang' in props)
      return <CodeToHtml code={props['data-code'] as string} lang={props['data-lang'] as string} />
    return <code {...props} data-md />
  },
  pre(props: React.PropsWithChildren<React.ComponentProps<'pre'>>) {
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
