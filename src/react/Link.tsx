'use client'

import { useRouter, Link as WakuLink } from 'waku'
import * as Path from '../internal/path.js'

export function Link(props: Link.Props) {
  const { path } = useRouter()

  if (Path.isExternal(props.to))
    return <a {...props} data-v-link href={props.to} rel="noopener noreferrer" target="_blank" />

  const [before, after] = (props.to || '').split('#')
  const to = `${before ? before : path}${after ? `#${after}` : ''}`
  return <WakuLink {...props} data-v-link to={to} unstable_prefetchOnView />
}

export namespace Link {
  export type Props = {
    children: React.ReactNode
    className?: string | undefined
    onClick?: React.MouseEventHandler | undefined
    to: string
  }
}
