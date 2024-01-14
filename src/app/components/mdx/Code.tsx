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
      index !== nodes.length - 1
        ? null
        : child,
    )
    .filter(Boolean)
}
