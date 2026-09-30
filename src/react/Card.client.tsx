'use client'

import type { ReactNode } from 'react'
import { style, vars } from '../styles/zyzz.config.js'
import { Link } from './Link.js'

namespace styles {
  export const root = style({
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 'md',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: 'primary',
    backgroundColor: 'surfaceTint',
    '@supports (color: color-mix(in lab, red, red))': {
      backgroundColor: `color-mix(in oklab, ${vars.backgroundColor.surfaceTint} 70%, transparent) !custom`,
    },
    padding: '4',
    textDecorationLine: 'none',
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'standard',
    transitionDuration: 'standard',
    selectors: {
      ':where(& > :not(:last-child))': {
        marginBlockStart: '0 !custom',
        marginBlockEnd: '2',
      },
      '&:hover': {
        '@media (hover: hover)': {
          backgroundColor: 'surfaceTint',
        },
      },
    },
  })

  export const externalIcon = style({
    position: 'absolute',
    top: '4',
    right: '4',
  })

  export const icon = style({
    display: 'flex',
    width: '8',
    height: '8',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'lg',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: 'primary',
    backgroundColor: 'surface',
    color: 'accent',
  })

  export const title = style({
    fontSize: '15px !custom',
    fontWeight: 'medium',
    color: 'heading',
  })

  export const description = style({
    fontSize: 'sm',
    lineHeight: 'sm',
    color: 'secondary',
  })
}

export function CardLink(props: CardLink.Props) {
  const { descriptionHtml, iconHtml, title, to, topRight } = props

  return (
    <Link to={to} {...styles.root()}>
      {topRight ? <div {...styles.externalIcon()}>{topRight}</div> : null}

      {iconHtml ? (
        <div
          {...styles.icon()}
          // biome-ignore lint/security/noDangerouslySetInnerHtml: user-provided icon strings are already supported by Card.
          dangerouslySetInnerHTML={{ __html: iconHtml }}
        />
      ) : null}

      <div {...styles.title()}>{title}</div>

      <div
        {...styles.description()}
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
