'use client'

import { useRouter, Link as WakuLink } from 'waku'

export function Link(props: Link.Props) {
  const { path } = useRouter()

  const isExternal = props.to?.match(/^(https?:\/\/|mailto:|tel:)/)
  if (isExternal) return <a {...props} data-v-link target="_blank" rel="noopener noreferrer" />

  const [before, after] = (props.to || '').split('#')
  const to = `${before ? before : path}${after ? `#${after}` : ''}`
  return <WakuLink {...props} data-v-link to={to} unstable_prefetchOnView />
}

export namespace Link {
  export type Props = {
    children: React.ReactNode
    className?: string | undefined
    to: string
  }
}
