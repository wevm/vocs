'use client'

import type { ReactNode } from 'react'
import { style, theme } from 'zyzz/default'
import { Link } from './Link.js'

namespace styles {
  export const cardLink = style({
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    selectors: {
      ':where(& > :not(:last-child))': {
        marginBlockStart: 'calc(calc(0.25rem * 2) * 0)',
        marginBlockEnd: 'calc(calc(0.25rem * 2) * calc(1 - 0))',
        borderStyle: 'solid',
        transitionProperty:
          'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        transitionDuration: '150ms',
      },
      '&:hover': { '@media (hover: hover)': { backgroundColor: theme.vars.color.gray['100'] } },
    },
    borderRadius: 'md',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: theme.vars.color.gray['400'],
    backgroundColor: `color-mix(in oklab, ${theme.vars.color.gray['100']} 70%, transparent)`,
    padding: 4,
    textDecorationLine: 'none',
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '150ms',
  })
  export const cardLink2 = style({
    position: 'absolute',
    top: 4,
    right: 4,
  })
  export const cardLink3 = style({
    display: 'flex',
    width: 8,
    height: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'lg',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: theme.vars.color.gray['400'],
    backgroundColor: theme.vars.color.surface,
    color: theme.vars.color.blue['900'],
  })
  export const cardLink4 = style({
    fontSize: '15px',
    fontWeight: 'medium',
    color: theme.vars.color.foreground,
  })
  export const cardLink5 = style({
    lineHeight: 'calc(1.25 / 0.875)',
    fontSize: 'sm',
    color: theme.vars.color.gray['900'],
  })
}

export function CardLink(props: CardLink.Props) {
  const { descriptionHtml, iconHtml, title, to, topRight } = props

  return (
    <Link to={to} className={styles.cardLink().className}>
      {topRight ? <div {...styles.cardLink2()}>{topRight}</div> : null}

      {iconHtml ? (
        <div
          {...styles.cardLink3()}
          // biome-ignore lint/security/noDangerouslySetInnerHtml: user-provided icon strings are already supported by Card.
          dangerouslySetInnerHTML={{ __html: iconHtml }}
        />
      ) : null}

      <div {...styles.cardLink4()}>{title}</div>

      <div
        {...styles.cardLink5()}
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
