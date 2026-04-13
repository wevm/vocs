'use client'

import { useRouter, Link as WakuLink } from 'waku'
import * as Path from '../internal/path.js'

export function Link(props: Link.Props) {
  const { prefetch = import.meta.env.DEV ? 'none' : 'view', to, ...rest } = props
  const { path } = useRouter()

  if (Path.isExternal(props.to))
    return <a {...rest} href={props.to} rel="noopener noreferrer" target="_blank" />

  const [before, after] = (props.to || '').split('#')
  const resolvedTo = `${before ? before : path}${after ? `#${after}` : ''}`
  return (
    <WakuLink
      {...rest}
      to={resolvedTo}
      unstable_prefetchOnEnter={prefetch === 'intent'}
      unstable_prefetchOnView={prefetch === 'view'}
    />
  )
}

export namespace Link {
  export type Prefetch = 'none' | 'intent' | 'view'

  export type Props = React.ComponentProps<typeof WakuLink> & {
    prefetch?: Prefetch | undefined
  }
}
