import type { MDXComponents } from 'mdx/types.js'
import { Callout } from './Callout.js'

export const components: MDXComponents = {
  aside(
    props: React.PropsWithChildren<React.ComponentProps<'aside'> & { 'data-context': string }>,
  ) {
    if ('data-callout' in props) return <Callout {...props} />
    return <aside data-vocs {...props} />
  },
}
