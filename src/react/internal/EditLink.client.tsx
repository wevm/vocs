'use client'

import { cx } from 'cva'
import LucideSquarePen from '~icons/lucide/square-pen'
import * as MdxPageContext from '../MdxPageContext.js'
import { useConfig } from '../useConfig.js'

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
      className={cx(
        'vocs:flex vocs:items-center vocs:gap-2 vocs:text-secondary vocs:text-sm vocs:hover:text-heading vocs:transition-colors',
        className,
      )}
      data-v-edit-link
      href={url}
      rel="noopener noreferrer"
      target="_blank"
    >
      <LucideSquarePen className="vocs:size-4" />
      {text}
    </a>
  )
}

export declare namespace EditLink {
  export type Props = {
    className?: string | undefined
  }
}
