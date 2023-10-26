import { clsx } from 'clsx'
import { type DetailedHTMLProps, type HTMLAttributes } from 'react'

import styles from './Callout.module.css'

export function Callout(props: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>) {
  return (
    <aside
      {...props}
      className={clsx(props.className, styles.root, styles[(props as any)['data-callout']])}
    />
  )
}
