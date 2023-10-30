import { clsx } from 'clsx'
import { type DetailedHTMLProps, type HTMLAttributes } from 'react'

import { Callout, type CalloutProps } from '../Callout.js'
import * as styles from './Aside.css.js'

export function Aside(props: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>) {
  const className = clsx(props.className, styles.root)
  if ('data-callout' in props)
    return (
      <Callout className={className} type={props['data-callout'] as CalloutProps['type']}>
        {props.children}
      </Callout>
    )
  return <aside {...props} className={className} />
}
