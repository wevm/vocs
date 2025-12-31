'use client'

// TODO: Migrate to an agnostic `useRouter`/`Link` (to support frameworks beyond Waku).
import { useRouter, Link as WakuLink } from 'waku'

export function Link(props: Link.Props) {
  const { path } = useRouter()

  const isExternal = props.to?.match(/^(https?:\/\/|mailto:|tel:)/)
  if (isExternal) return <a {...props} target="_blank" rel="noopener noreferrer" />

  const [before, after] = (props.to || '').split('#')
  const to = `${before ? before : path}${after ? `#${after}` : ''}`
  return <WakuLink {...props} to={to} />
}

export namespace Link {
  export type Props = {
    children: React.ReactNode
    to: string
  }
}
