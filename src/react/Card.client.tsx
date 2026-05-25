'use client'

import type { ReactNode } from 'react'
import { Link } from './Link.js'

export function CardLink(props: CardLink.Props) {
  const { descriptionHtml, iconHtml, title, to, topRight } = props

  return (
    <Link
      to={to}
      className="vocs:relative vocs:flex vocs:flex-col vocs:space-y-2 vocs:rounded-md vocs:bg-surfaceTint/70 vocs:border vocs:border-primary vocs:p-4 vocs:no-underline vocs:transition-colors vocs:hover:bg-surfaceTint"
    >
      {topRight ? <div className="vocs:absolute vocs:top-4 vocs:right-4">{topRight}</div> : null}

      {iconHtml ? (
        <div
          className="vocs:size-8 vocs:flex vocs:items-center vocs:justify-center vocs:rounded-lg vocs:border vocs:border-primary vocs:bg-surface vocs:text-accent"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: user-provided icon strings are already supported by Card.
          dangerouslySetInnerHTML={{ __html: iconHtml }}
        />
      ) : null}

      <div className="vocs:text-[15px] vocs:font-medium vocs:text-heading">{title}</div>

      <div
        className="vocs:text-sm vocs:leading-relaxed vocs:text-secondary"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: markdown descriptions are rendered before they reach the client.
        dangerouslySetInnerHTML={{ __html: descriptionHtml }}
      />
    </Link>
  )
}

export declare namespace CardLink {
  export type Props = {
    descriptionHtml: string
    iconHtml: string | null
    title: string
    to: string
    topRight?: ReactNode | undefined
  }
}
