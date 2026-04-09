'use client'

import { useRouter, Link as WakuLink } from 'waku'
import * as LinkPrefetch from '../internal/link-prefetch.js'
import * as Path from '../internal/path.js'
import { useLinkPrefetchMode } from './useLinkPrefetchMode.js'

export function Link(props: Link.Props) {
  const { children, prefetch, to, ...rest } = props
  const { path } = useRouter()
  const prefetchMode = useLinkPrefetchMode({ mode: prefetch })

  if (Path.isExternal(to))
    return (
      <a {...rest} href={to} rel="noopener noreferrer" target="_blank">
        {children}
      </a>
    )

  const [before, after] = (to || '').split('#')
  const resolvedTo = `${before ? before : path}${after ? `#${after}` : ''}`
  return (
    <WakuLink {...rest} to={resolvedTo} {...LinkPrefetch.toWakuProps(prefetchMode)}>
      {children}
    </WakuLink>
  )
}

export namespace Link {
  export type Props = Omit<React.ComponentProps<typeof WakuLink>, 'children'> & {
    children?: React.ReactNode
    prefetch?: LinkPrefetch.Input | undefined
  }
}
