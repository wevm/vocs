import type { MDXComponents } from 'mdx/types.js'

import { Callout } from './react/Callout.js'
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
  span(props: React.PropsWithChildren<React.ComponentProps<'span'>>) {
    if (props.className?.includes('twoslash-completion-cursor'))
      return <TwoslashCompletionList {...props} />
    if (props.className?.includes('twoslash-hover')) return <TwoslashHover {...props} />
    return <span {...props} />
  },
}
