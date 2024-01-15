import { clsx } from 'clsx'
import { type DetailedHTMLProps, type HTMLAttributes } from 'react'

import * as styles from './Code.css.js'

export function Code(props: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>) {
  const children = filterEmptyLines(props.children)
  return (
    <code {...props} className={clsx(props.className, styles.root)}>
      {children}
    </code>
  )
}

function filterEmptyLines(nodes: React.ReactNode) {
  if (!Array.isArray(nodes)) return nodes
  return nodes
    .map((child, index) =>
      child.props &&
      'data-line' in child.props &&
      typeof child.props.children === 'string' &&
      child.props.children.trim() === '' &&
      nodes[index + 1]?.props?.className?.includes('twoslash-tag-line')
        ? null
        : child,
    )
    .filter(Boolean)
}
