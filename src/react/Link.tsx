'use client'

import { useRouter, Link as WakuLink } from 'waku'
import * as Path from '../internal/path.js'

export function Link(props: Link.Props) {
  const { to, ...rest } = props
  const { path } = useRouter()

  if (Path.isExternal(props.to))
    return <a {...rest} href={props.to} rel="noopener noreferrer" target="_blank" />

  const [before, after] = (props.to || '').split('#')
  const resolvedTo = `${before ? before : path}${after ? `#${after}` : ''}`
  return <WakuLink {...rest} to={resolvedTo} unstable_prefetchOnView={!import.meta.env.DEV} />
}

export namespace Link {
  export type Props = React.ComponentProps<typeof WakuLink>
}
