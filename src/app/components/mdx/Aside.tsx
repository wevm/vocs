import { clsx } from 'clsx'
import { type DetailedHTMLProps, type HTMLAttributes } from 'react'

import { Callout } from '../Callout.js'
import * as styles from './Aside.css.js'

export function Aside(props: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>) {
  const className = clsx(props.className, styles.root)
  if ('data-callout' in props) return <Callout {...props} className={className} />
  return <aside {...props} className={className} />
}
