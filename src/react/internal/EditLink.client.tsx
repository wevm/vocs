'use client'

import LucideSquarePen from '~icons/lucide/square-pen'
import { style } from '../../styles/zyzz.config.js'
import * as MdxPageContext from '../MdxPageContext.js'
import { useConfig } from '../useConfig.js'

namespace styles {
  export const link = style({
    display: 'flex',
    alignItems: 'center',
    gap: '2',
    fontSize: 'sm',
    lineHeight: 'sm',
    color: 'secondary',
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'standard',
    transitionDuration: 'standard',
    selectors: {
      '&:hover': {
        '@media (hover: hover)': {
          color: 'heading',
        },
      },
    },
  })

  export const icon = style({
    width: '4',
    height: '4',
  })
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
      {...styles.link({ className })}
      data-v-edit-link
      href={url}
      rel="noopener noreferrer"
      target="_blank"
    >
      <LucideSquarePen {...styles.icon()} />
      {text}
    </a>
  )
}

export declare namespace EditLink {
  export type Props = {
    className?: string | undefined
  }
}
