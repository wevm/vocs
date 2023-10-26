import { clsx } from 'clsx'
import { type DetailedHTMLProps, type HTMLAttributes } from 'react'

import styles from './List.module.css'

export function List({
  ordered,
  ...props
}: DetailedHTMLProps<HTMLAttributes<any>, any> & { ordered?: boolean }) {
  const Element = ordered ? 'ol' : 'ul'
  return (
    <Element
      {...props}
      className={clsx(props.className, styles.root, ordered ? styles.ordered : styles.unordered)}
    />
  )
}
