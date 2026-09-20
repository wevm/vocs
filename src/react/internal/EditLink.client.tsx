'use client'

import { cx } from 'cva'
import { style, theme } from 'zyzz/default'
import LucideSquarePen from '~icons/lucide/square-pen'
import * as MdxPageContext from '../MdxPageContext.js'
import { useConfig } from '../useConfig.js'

namespace styles {
  export const editLink = style({
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    fontSize: 'sm',
    lineHeight: 'calc(1.25 / 0.875)',
    color: theme.vars.color.gray['900'],
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '150ms',
    selectors: { '&:hover': { '@media (hover: hover)': { color: theme.vars.color.foreground } } },
  })
  export const editLink2 = style({ width: 4, height: 4 })
}

export function EditLink(props: EditLink.Props) {
  const { className } = props

  const config = useConfig()
  const { frontmatter } = MdxPageContext.use()
  const { editLink } = config

  const { link, text } = editLink ?? {}
  const filePath = frontmatter?.filePath

  if (!link || !filePath) return null

  const url = typeof link === 'function' ? link(filePath) : link.replace(/:path/g, filePath)

  return (
    <a
      className={cx(styles.editLink().className, className)}
      data-v-edit-link
      href={url}
      rel="noopener noreferrer"
      target="_blank"
    >
      <LucideSquarePen className={styles.editLink2().className} />
      {text}
    </a>
  )
}

export declare namespace EditLink {
  export type Props = {
    className?: string | undefined
  }
}
