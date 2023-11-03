import { clsx } from 'clsx'
import { type DetailedHTMLProps, type HTMLAttributes } from 'react'

import { CalloutTitle } from '../CalloutTitle.js'
import * as styles from './Strong.css.js'

export function Strong(props: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>) {
  if ('data-callout-title' in props && typeof props.children === 'string')
    return (
      <CalloutTitle
        {...props}
        className={clsx(props.className, styles.root)}
        children={props.children}
      />
    )
  return <strong {...props} className={clsx(props.className, styles.root)} />
}
