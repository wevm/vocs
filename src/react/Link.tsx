'use client'

import { useRouter, Link as WakuLink } from 'waku'

export function Link(props: Link.Props) {
  const { href } = props

  const { path } = useRouter()

  const isExternal = href?.match(/^(https?:\/\/|mailto:|tel:)/)
  if (isExternal) return <a {...props} target="_blank" rel="noopener noreferrer" />

  const [before, after] = (href || '').split('#')
  const to = `${before ? before : path}${after ? `#${after}` : ''}`
  return <WakuLink {...props} to={to} />
}

export namespace Link {
  export type Props = {
    children: React.ReactNode
    className?: string | undefined
    hideExternalIcon?: boolean | undefined
    onClick?: ((e: React.MouseEvent<HTMLAnchorElement>) => void) | undefined
    href?: string | undefined
    variant?: 'styleless' | undefined
  }
}
