import type { MDXComponents } from 'mdx/types.js'
import { Callout } from './Callout.js'
import { Link } from './Link.js'

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
    return <aside data-vocs {...props} />
  },
}
