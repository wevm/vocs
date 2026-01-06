'use client'

import { cx } from 'cva'
import * as MdxPageContext from '../MdxPageContext.js'

export function LastUpdated(props: LastUpdated.Props) {
  const { className } = props

  const { frontmatter } = MdxPageContext.use()
  const lastModified = frontmatter?.lastModified

  if (!lastModified) return null

  const date = new Date(lastModified)
  const formatted = date.toLocaleDateString(undefined, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const time = date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div
      className={cx('vocs:text-secondary vocs:text-sm', className)}
      data-v-last-updated
    >
      Last updated: {formatted}, {time}
    </div>
  )
}

export declare namespace LastUpdated {
  export type Props = {
    className?: string | undefined
  }
}
