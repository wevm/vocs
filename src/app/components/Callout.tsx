import { clsx } from 'clsx'
import { type DetailedHTMLProps, type HTMLAttributes } from 'react'

import * as styles from './Callout.css.js'

export function Callout(props: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>) {
  return (
    <aside
      {...props}
      // @ts-expect-error
      className={clsx(props.className, styles.root, styles[props['data-callout']])}
    />
  )
}
